"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parent_id") as string || null;
  if (!name || !code) return { error: "Nama kategori dan Kode wajib diisi." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ 
    name, 
    code: code.toUpperCase(), 
    description,
    parent_id: parentId || null
  }).eq("id", id);
  if (error) return { error: `Gagal memperbarui: ${error.message}` };
  revalidatePath("/categories");
  redirect("/categories");
}
