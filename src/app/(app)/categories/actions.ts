"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;

  if (!name || !code) {
    return { error: "Nama kategori dan Kode wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .insert([{ name, code: code.toUpperCase(), description }]);

  if (error) {
    console.error("Error inserting category:", error);
    return { error: `Gagal menyimpan kategori: ${error.message || error.details || JSON.stringify(error)}` };
  }

  // Refresh data di halaman categories
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting category:", error);
    return { error: `Gagal menghapus kategori: ${error.message}` };
  }
  
  revalidatePath("/categories");
  return {};
}
