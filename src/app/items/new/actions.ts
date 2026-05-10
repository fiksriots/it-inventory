"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createItem(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category_id = formData.get("category_id") as string;
  const price = formData.get("price") as string;
  const description = formData.get("description") as string;

  if (!name || !sku) {
    return { error: "Nama barang dan SKU wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .insert([{ 
      name, 
      sku, 
      category_id: category_id || null, 
      price: price ? parseFloat(price) : 0,
      description 
    }]);

  if (error) {
    console.error("Error inserting item:", error);
    if (error.code === '23505') { // Unique violation for SKU
       return { error: "SKU sudah digunakan. Silakan gunakan SKU lain." };
    }
    return { error: "Gagal menyimpan barang. Silakan coba lagi." };
  }

  revalidatePath("/items");
  redirect("/items");
}
