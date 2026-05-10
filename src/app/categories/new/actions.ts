"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return { error: "Nama kategori wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .insert([{ name, description }]);

  if (error) {
    console.error("Error inserting category:", error);
    return { error: "Gagal menyimpan kategori. Silakan coba lagi." };
  }

  // Refresh data di halaman categories
  revalidatePath("/categories");
  redirect("/categories");
}
