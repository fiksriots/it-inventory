"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createItem(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category_id = formData.get("category_id") as string;
  const condition = formData.get("condition") as string;
  const price = formData.get("price") as string;
  const description = formData.get("description") as string;

  if (!name || !sku) {
    return { error: "Nama barang dan SKU wajib diisi." };
  }

  const supabase = await createClient();

  // Mulai proses fetch user secara paralel dengan insert item untuk menghemat waktu round-trip jaringan
  const userPromise = supabase.auth.getUser();

  const { data: item, error: itemError } = await supabase
    .from("items")
    .insert([{ 
      name, 
      sku, 
      category_id: category_id || null, 
      condition: condition || 'Baru',
      price: price ? parseFloat(price) : 0,
      description 
    }])
    .select()
    .single();

  if (itemError) {
    console.error("Error inserting item:", itemError);
    if (itemError.code === '23505') { // Unique violation for SKU
       return { error: "SKU sudah digunakan. Silakan gunakan SKU lain." };
    }
    return { error: "Gagal menyimpan barang. Silakan coba lagi." };
  }

  // Handle Initial Stock
  const initialStock = formData.get("initial_stock") as string;
  const locationId = formData.get("location_id") as string;
  const stockQty = parseInt(initialStock);

  if (!isNaN(stockQty) && stockQty > 0 && locationId) {
    const { data: { user } } = await userPromise;
    
    // Jalankan operasi insert stock dan log secara paralel menggunakan Promise.all
    await Promise.all([
      supabase.from("item_stocks").insert([{
        item_id: item.id,
        location_id: locationId,
        quantity: stockQty
      }]),
      supabase.from("inventory_logs").insert([{
        item_id: item.id,
        location_id: locationId,
        user_id: user?.id,
        mutation_type: 'INBOUND',
        quantity: stockQty,
        notes: 'Stok awal saat pendaftaran barang.'
      }])
    ]);
  }

  revalidatePath("/items");
  redirect("/items");
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting item:", error);
    return { error: `Gagal menghapus barang: ${error.message}` };
  }
  
  revalidatePath("/items");
  return {};
}
