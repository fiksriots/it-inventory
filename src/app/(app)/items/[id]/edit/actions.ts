"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateItem(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category_id = formData.get("category_id") as string;
  const condition = formData.get("condition") as string;
  const price = formData.get("price") as string;
  const description = formData.get("description") as string;

  const unit = (formData.get("unit") as string) || "PCS";
  const has_conversion = formData.get("has_conversion") === "on" || formData.get("has_conversion") === "true";
  const conversion_unit = formData.get("conversion_unit") as string || null;
  const conversion_rate_str = formData.get("conversion_rate") as string;
  const conversion_rate = conversion_rate_str ? parseFloat(conversion_rate_str) : 1;

  const new_category_name = formData.get("new_category_name") as string;
  const new_category_code = formData.get("new_category_code") as string;

  if (!name || !sku) return { error: "Nama barang dan SKU wajib diisi." };
  const supabase = await createClient();

  let finalCategoryId = category_id;
  if (new_category_name && new_category_code) {
    // Check if category name or code already exists to avoid duplicates
    const { data: existingCat } = await supabase
      .from("categories")
      .select("id")
      .or(`name.ilike.${new_category_name.trim()},code.ilike.${new_category_code.trim()}`)
      .maybeSingle();

    if (existingCat) {
      finalCategoryId = existingCat.id;
    } else {
      const { data: newCat, error: catError } = await supabase
        .from("categories")
        .insert([{ 
          name: new_category_name.trim(), 
          code: new_category_code.trim().toUpperCase() 
        }])
        .select()
        .single();

      if (catError) {
        console.error("Error creating custom category:", catError);
        return { error: `Gagal membuat kategori baru: ${catError.message}` };
      }
      finalCategoryId = newCat.id;
    }
  }

  const { error } = await supabase.from("items").update({
    name, sku, category_id: finalCategoryId || null,
    condition: condition || 'Baru',
    price: price ? parseFloat(price) : 0, description,
    unit,
    has_conversion,
    conversion_unit: has_conversion ? conversion_unit : null,
    conversion_rate: has_conversion ? conversion_rate : 1,
  }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "SKU sudah digunakan." };
    return { error: `Gagal memperbarui: ${error.message}` };
  }

  // Handle Quick Stock Adjustment
  const adjustmentQty = formData.get("adjustment_qty") as string;
  const locationId = formData.get("adjustment_location_id") as string;
  const adjCondition = formData.get("adjustment_condition") as string || 'Normal';
  const qty = parseInt(adjustmentQty);

  if (!isNaN(qty) && qty !== 0 && locationId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Get current stock for this specific location AND condition
    const { data: currentStock } = await supabase
      .from("item_stocks")
      .select("quantity")
      .eq("item_id", id)
      .eq("location_id", locationId)
      .eq("condition", adjCondition)
      .single();

    const mutationType = qty > 0 ? 'INBOUND' : 'OUTBOUND';
    const absoluteQty = Math.abs(qty);

    if (mutationType === 'OUTBOUND' && (!currentStock || currentStock.quantity < absoluteQty)) {
       console.error("Insufficient stock for quick adjustment");
    } else {
      // 2. Update/Insert Stock
      if (currentStock) {
        const newQty = currentStock.quantity + qty;
        if (newQty <= 0) {
          await supabase
            .from("item_stocks")
            .delete()
            .eq("item_id", id)
            .eq("location_id", locationId)
            .eq("condition", adjCondition);
        } else {
          await supabase
            .from("item_stocks")
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq("item_id", id)
            .eq("location_id", locationId)
            .eq("condition", adjCondition);
        }
      } else if (qty > 0) {
        await supabase
          .from("item_stocks")
          .insert([{ item_id: id, location_id: locationId, condition: adjCondition, quantity: qty }]);
      }

      // 3. Log Movement
      await supabase.from("inventory_logs").insert([{
        item_id: id,
        location_id: locationId,
        user_id: user?.id,
        mutation_type: mutationType,
        quantity: absoluteQty,
        notes: `Penyesuaian stok (${adjCondition}) via Master Barang.`
      }]);
    }
  }

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect("/items");
}

export async function updateStockCondition(
  itemId: string,
  locationId: string,
  oldCondition: string,
  newCondition: string
) {
  if (!itemId || !locationId || !oldCondition || !newCondition) {
    return { error: "Data tidak valid." };
  }

  if (oldCondition === newCondition) {
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get current stock of old condition
  const { data: oldStock, error: oldErr } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", locationId)
    .eq("condition", oldCondition)
    .single();

  if (oldErr || !oldStock) {
    return { error: "Stok asal tidak ditemukan." };
  }

  const qty = oldStock.quantity;

  // 2. Check if target condition already exists in the same location
  const { data: targetStock } = await supabase
    .from("item_stocks")
    .select("quantity")
    .eq("item_id", itemId)
    .eq("location_id", locationId)
    .eq("condition", newCondition)
    .maybeSingle();

  if (targetStock) {
    // Merge: Update target and delete old
    const { error: updateErr } = await supabase
      .from("item_stocks")
      .update({ quantity: targetStock.quantity + qty, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", locationId)
      .eq("condition", newCondition);

    if (updateErr) return { error: `Gagal memperbarui stok: ${updateErr.message}` };

    await supabase
      .from("item_stocks")
      .delete()
      .eq("item_id", itemId)
      .eq("location_id", locationId)
      .eq("condition", oldCondition);
  } else {
    // Just update the condition
    const { error: updateErr } = await supabase
      .from("item_stocks")
      .update({ condition: newCondition, last_updated: new Date().toISOString() })
      .eq("item_id", itemId)
      .eq("location_id", locationId)
      .eq("condition", oldCondition);

    if (updateErr) return { error: `Gagal mengubah kondisi: ${updateErr.message}` };
  }

  // 3. Log mutation in inventory_logs
  await supabase.from("inventory_logs").insert([{
    item_id: itemId,
    location_id: locationId,
    user_id: user?.id,
    mutation_type: 'OUTBOUND',
    quantity: qty,
    notes: `Ubah kondisi dari [${oldCondition}] ke [${newCondition}] (${qty} unit).`
  }]);

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}
