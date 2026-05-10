"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) return { error: "Nama kategori wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, description })
    .eq("id", id);

  if (error) return { error: `Gagal memperbarui kategori: ${error.message}` };

  revalidatePath("/categories");
  redirect("/categories");
}
