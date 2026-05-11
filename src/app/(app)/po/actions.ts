"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPurchaseOrder(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supplierId = formData.get("supplier_id") as string;
  let poNumber = formData.get("po_number") as string;
  
  const adminFee = parseFloat(formData.get("admin_fee") as string || "0");
  const shippingFee = parseFloat(formData.get("shipping_fee") as string || "0");
  const discountAmount = parseFloat(formData.get("discount_amount") as string || "0");
  const paymentMethod = formData.get("payment_method") as string;
  
  // New Fields
  const department = formData.get("department") as string;
  const requestedBy = formData.get("requested_by") as string;
  const locationId = formData.get("location_id") as string;
  const supplierType = formData.get("supplier_type") as string || "Offline";
  const notes = formData.get("notes") as string;

  // Extract items
  const itemsJson = formData.get("items_data") as string;
  const items = JSON.parse(itemsJson || "[]");

  if (!supplierId || items.length === 0) {
    return { error: "Supplier dan minimal satu barang wajib diisi." };
  }

  // Auto-generate PO Number if requested or empty
  if (!poNumber || poNumber === "AUTO") {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true })
      .filter("created_at", "gte", `${date.toISOString().split('T')[0]}T00:00:00`);
    
    const seq = ((count || 0) + 1).toString().padStart(3, '0');
    poNumber = `PO-${dateStr}-${seq}`;
  }

  // Calculate totals
  const subtotal = items.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.unit_price), 0);
  const totalAmount = subtotal + adminFee + shippingFee - discountAmount;

  // 1. Create the PO
  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .insert([{
      po_number: poNumber,
      supplier_id: supplierId,
      created_by: user?.id,
      status: 'Draft',
      subtotal,
      admin_fee: adminFee,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      department,
      requested_by: requestedBy,
      location_id: locationId || null,
      supplier_type: supplierType,
      notes
    }])
    .select()
    .single();

  if (poError) {
    console.error("PO Error:", poError);
    return { error: `Gagal membuat PO: ${poError.message}` };
  }

  // 2. Create the PO Items
  const poItems = items.map((item: any) => ({
    po_id: po.id,
    item_id: item.item_id || null,
    custom_item_name: item.custom_item_name || null,
    item_link: item.item_link || null,
    unit: item.unit || "PCS",
    quantity: item.quantity,
    unit_price: item.unit_price
  }));

  const { error: itemsError } = await supabase
    .from("po_items")
    .insert(poItems);

  if (itemsError) {
    return { error: `PO dibuat tapi gagal menyimpan item: ${itemsError.message}` };
  }

  revalidatePath("/po");
  redirect("/po");
}

export async function updatePONotes(id: string, notes: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ notes })
    .eq("id", id);

  if (error) {
    return { error: `Gagal memperbarui catatan: ${error.message}` };
  }

  revalidatePath(`/po/${id}`);
  return { success: true };
}

export async function updatePOStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If status is "Selesai", process stock addition to Temporary
  if (status === "Selesai") {
    // 1. Get PO details and items
    const { data: po, error: poGetError } = await supabase
      .from("purchase_orders")
      .select("*, po_items(*)")
      .eq("id", id)
      .single();
    
    if (poGetError || !po) {
      return { error: `Gagal mengambil data PO: ${poGetError?.message}` };
    }

    // 2. Ensure "Temporary" location exists
    let { data: tempLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("name", "Temporary")
      .single();
    
    if (!tempLocation) {
      const { data: newLoc, error: locError } = await supabase
        .from("locations")
        .insert([{ name: "Temporary", address: "Gudang Transit Otomatis" }])
        .select()
        .single();
      
      if (locError) return { error: `Gagal membuat lokasi Temporary: ${locError.message}` };
      tempLocation = newLoc;
    }

    // 3. Process each item
    for (const poItem of po.po_items) {
      let finalItemId = poItem.item_id;

      // Handle Manual Item (no item_id)
      if (!finalItemId && poItem.custom_item_name) {
        // Create Master Item
        const sku = `MANUAL-${po.po_number.split('-').slice(1).join('-')}-${Math.floor(Math.random() * 1000)}`;
        const { data: newItem, error: newItemError } = await supabase
          .from("items")
          .insert([{
            name: poItem.custom_item_name,
            sku: sku,
            price: poItem.unit_price,
            description: `Dibuat otomatis dari PO ${po.po_number}`
          }])
          .select()
          .single();
        
        if (newItemError) return { error: `Gagal membuat master barang manual: ${newItemError.message}` };
        finalItemId = newItem.id;
        
        // Update po_item with the new item_id for reference
        await supabase.from("po_items").update({ item_id: finalItemId }).eq("id", poItem.id);
      }

      if (finalItemId) {
        // 4. Update Stock in Temporary Location
        const { data: existingStock } = await supabase
          .from("item_stocks")
          .select("quantity")
          .eq("item_id", finalItemId)
          .eq("location_id", tempLocation.id)
          .single();
        
        if (existingStock) {
          await supabase
            .from("item_stocks")
            .update({ quantity: existingStock.quantity + poItem.quantity, last_updated: new Date().toISOString() })
            .eq("item_id", finalItemId)
            .eq("location_id", tempLocation.id);
        } else {
          await supabase
            .from("item_stocks")
            .insert([{ 
              item_id: finalItemId, 
              location_id: tempLocation.id, 
              quantity: poItem.quantity 
            }]);
        }

        // 5. Log Inventory
        await supabase.from("inventory_logs").insert([{
          item_id: finalItemId,
          location_id: tempLocation.id,
          user_id: user?.id,
          mutation_type: "INBOUND",
          quantity: poItem.quantity,
          notes: `Masuk dari PO ${po.po_number} (Tujuan Akhir: ${po.location_id || 'N/A'})`
        }]);
      }
    }
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { error: `Gagal memperbarui status: ${error.message}` };
  }

  revalidatePath("/po");
  revalidatePath(`/po/${id}`);
  return { success: true };
}

export async function deletePO(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Gagal menghapus PO: ${error.message}` };
  }

  revalidatePath("/po");
  return { success: true };
}
