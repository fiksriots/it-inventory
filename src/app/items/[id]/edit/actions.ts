"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateItem(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category_id = formData.get("category_id") as string;
  const price = formData.get("price") as string;
  const description = formData.get("description") as string;

  if (!name || !sku) return { error: "Nama barang dan SKU wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({
      name,
      sku,
      category_id: category_id || null,
      price: price ? parseFloat(price) : 0,
      description,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "SKU sudah digunakan. Silakan gunakan SKU lain." };
    return { error: `Gagal memperbarui barang: ${error.message}` };
  }

  revalidatePath("/items");
  redirect("/items");
}
