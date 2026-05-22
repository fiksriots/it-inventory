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

  if (!name || !sku) return { error: "Nama barang dan SKU wajib diisi." };
  const supabase = await createClient();
  const { error } = await supabase.from("items").update({
    name, sku, category_id: category_id || null,
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
        await supabase
          .from("item_stocks")
          .update({ quantity: currentStock.quantity + qty, last_updated: new Date().toISOString() })
          .eq("item_id", id)
          .eq("location_id", locationId)
          .eq("condition", adjCondition);
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
