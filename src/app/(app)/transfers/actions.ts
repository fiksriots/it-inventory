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
