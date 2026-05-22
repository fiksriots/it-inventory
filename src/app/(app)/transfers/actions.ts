"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMutation(prevState: any, formData: FormData) {
  const itemId = formData.get("item_id") as string;
  const locationId = formData.get("location_id") as string;
  const mutationType = formData.get("mutation_type") as string; // 'INBOUND' | 'OUTBOUND'
  const quantity = parseInt(formData.get("quantity") as string);
  const notes = formData.get("notes") as string;

  if (!itemId || !locationId || !mutationType || isNaN(quantity) || quantity <= 0) {
    return { error: "Semua data wajib diisi dengan benar." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Log the inventory mutation
  const { error: logError } = await supabase
    .from("inventory_logs")
    .insert([{
      item_id: itemId,
      location_id: locationId,
      user_id: user?.id,
      mutation_type: mutationType,
      quantity,
      notes
    }]);

  if (logError) {
    console.error("Log error:", logError);
    return { error: `Gagal mencatat log: ${logError.message}` };
  }

  // 2. Update stock
  // First, check if stock record exists
  const { data: currentStock } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", locationId)
    .single();

  if (mutationType === 'INBOUND') {
    if (currentStock) {
      await supabase
        .from("item_stocks")
        .update({ quantity: currentStock.quantity + quantity, last_updated: new Date().toISOString() })
        .eq("item_id", itemId)
        .eq("location_id", locationId);
    } else {
      await supabase
        .from("item_stocks")
        .insert([{ item_id: itemId, location_id: locationId, quantity }]);
    }
  } else {
    // OUTBOUND
    if (!currentStock || currentStock.quantity < quantity) {
      return { error: "Stok tidak mencukupi untuk melakukan pengeluaran barang." };
    }
    await supabase
      .from("item_stocks")
      .update({ quantity: currentStock.quantity - quantity, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", locationId);
  }

  revalidatePath("/transfers");
  revalidatePath(`/items/${itemId}`);
  redirect("/transfers");
}

export async function createTransfer(prevState: any, formData: FormData) {
  const itemId = formData.get("item_id") as string;
  const fromLocationId = formData.get("from_location_id") as string;
  const toLocationId = formData.get("to_location_id") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const notes = formData.get("notes") as string;

  if (!itemId || !fromLocationId || !toLocationId || isNaN(quantity) || quantity <= 0) {
    return { error: "Semua data wajib diisi dengan benar." };
  }

  if (fromLocationId === toLocationId) {
    return { error: "Lokasi asal dan tujuan tidak boleh sama." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Check source stock
  const { data: sourceStock } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", fromLocationId)
    .single();

  if (!sourceStock || sourceStock.quantity < quantity) {
    return { error: "Stok di lokasi asal tidak mencukupi." };
  }

  // 2. Record the transfer
  const { error: transferError } = await supabase
    .from("item_transfers")
    .insert([{
      item_id: itemId,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      user_id: user?.id,
      quantity,
      notes
    }]);

  if (transferError) {
    return { error: `Gagal mencatat transfer: ${transferError.message}` };
  }

  // 3. Update source stock (Subtract)
  await supabase
    .from("item_stocks")
    .update({ quantity: sourceStock.quantity - quantity, last_updated: new Date().toISOString() })
    .eq("item_id", itemId)
    .eq("location_id", fromLocationId);

  // 4. Update destination stock (Add)
  const { data: destStock } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", toLocationId)
    .single();

  if (destStock) {
    await supabase
      .from("item_stocks")
      .update({ quantity: destStock.quantity + quantity, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", toLocationId);
  } else {
    await supabase
      .from("item_stocks")
      .insert([{ item_id: itemId, location_id: toLocationId, quantity }]);
  }

  revalidatePath("/transfers");
  revalidatePath(`/items/${itemId}`);
  redirect("/transfers");
}

export async function createReplacement(prevState: any, formData: FormData) {
  const itemId = formData.get("item_id") as string;
  const sourceLocationId = formData.get("source_location_id") as string; // Gudang (working stock)
  const targetLocationId = formData.get("target_location_id") as string; // Cafe (deployment site)
  const brokenLocationId = formData.get("broken_location_id") as string; // Gudang Rusak
  const quantity = parseInt(formData.get("quantity") as string);
  const replacementNotes = formData.get("replacement_notes") as string;
  const damageNotes = formData.get("damage_notes") as string;

  if (!itemId || !sourceLocationId || !targetLocationId || !brokenLocationId || isNaN(quantity) || quantity <= 0) {
    return { error: "Semua data wajib diisi dengan benar." };
  }

  if (sourceLocationId === targetLocationId || targetLocationId === brokenLocationId || sourceLocationId === brokenLocationId) {
    return { error: "Lokasi asal, tujuan, dan gudang rusak tidak boleh sama." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Check source stock (any non-Rusak condition)
  const { data: sourceStocks } = await supabase
    .from("item_stocks")
    .select("condition, quantity")
    .eq("item_id", itemId)
    .eq("location_id", sourceLocationId)
    .neq("condition", "Rusak");

  const sourceStock = sourceStocks?.find(s => s.quantity >= quantity);
  if (!sourceStock) {
    return { error: "Stok aktif (non-Rusak) di lokasi asal tidak mencukupi." };
  }
  const sourceCondition = sourceStock.condition || "Normal";

  // 2. Check if target location has active stock (non-Rusak) to be replaced
  const { data: targetStocks } = await supabase
    .from("item_stocks")
    .select("condition, quantity")
    .eq("item_id", itemId)
    .eq("location_id", targetLocationId)
    .neq("condition", "Rusak");

  const targetStock = targetStocks?.find(s => s.quantity >= quantity);
  if (!targetStock) {
    return { error: "Stok aktif (non-Rusak) di lokasi target tidak ditemukan untuk diganti." };
  }
  const targetCondition = targetStock.condition || "Normal";

  // 3. Record the first transfer: Source -> Target (New unit deployment)
  const { error: transfer1Error } = await supabase
    .from("item_transfers")
    .insert([{
      item_id: itemId,
      from_location_id: sourceLocationId,
      to_location_id: targetLocationId,
      user_id: user?.id,
      quantity,
      notes: `[PENGGANTIAN] Menggunakan stok bagus dari sumber. Catatan: ${replacementNotes || '-'}`
    }]);

  if (transfer1Error) {
    return { error: `Gagal mencatat transfer unit baru: ${transfer1Error.message}` };
  }

  // 4. Record the second transfer: Target -> Broken Warehouse (Broken unit evacuation)
  const { error: transfer2Error } = await supabase
    .from("item_transfers")
    .insert([{
      item_id: itemId,
      from_location_id: targetLocationId,
      to_location_id: brokenLocationId,
      user_id: user?.id,
      quantity,
      notes: `[UNIT RUSAK] Memindahkan unit rusak ke gudang rusak. Catatan: ${damageNotes || '-'}`
    }]);

  if (transfer2Error) {
    return { error: `Gagal mencatat transfer unit rusak: ${transfer2Error.message}` };
  }

  // Update Source Stock (Decrement working unit)
  await supabase
    .from("item_stocks")
    .update({ quantity: sourceStock.quantity - quantity, last_updated: new Date().toISOString() })
    .eq("item_id", itemId)
    .eq("location_id", sourceLocationId)
    .eq("condition", sourceCondition);

  // Update Target Stock (Remove broken unit, insert new working unit)
  if (targetCondition === sourceCondition) {
    // If conditions are identical, target location quantities do not change (net zero)
  } else {
    // Decrement the old condition (representing broken unit removed)
    await supabase
      .from("item_stocks")
      .update({ quantity: targetStock.quantity - quantity, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", targetLocationId)
      .eq("condition", targetCondition);

    // Increment the new condition (representing working unit added)
    const { data: targetDestStock } = await supabase
      .from("item_stocks")
      .select("quantity")
      .eq("item_id", itemId)
      .eq("location_id", targetLocationId)
      .eq("condition", sourceCondition)
      .maybeSingle();

    if (targetDestStock) {
      await supabase
        .from("item_stocks")
        .update({ quantity: targetDestStock.quantity + quantity, last_updated: new Date().toISOString() })
        .eq("item_id", itemId)
        .eq("location_id", targetLocationId)
        .eq("condition", sourceCondition);
    } else {
      await supabase
        .from("item_stocks")
        .insert([{ item_id: itemId, location_id: targetLocationId, quantity, condition: sourceCondition }]);
    }
  }

  // Update Broken Stock (Increment/Insert as 'Rusak' at broken location)
  const { data: destBrokenStock } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", brokenLocationId)
    .eq("condition", "Rusak")
    .maybeSingle();

  if (destBrokenStock) {
    await supabase
      .from("item_stocks")
      .update({ quantity: destBrokenStock.quantity + quantity, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", brokenLocationId)
      .eq("condition", "Rusak");
  } else {
    await supabase
      .from("item_stocks")
      .insert([{ item_id: itemId, location_id: brokenLocationId, quantity, condition: "Rusak" }]);
  }

  revalidatePath("/transfers");
  revalidatePath(`/items/${itemId}`);
  redirect("/transfers");
}
