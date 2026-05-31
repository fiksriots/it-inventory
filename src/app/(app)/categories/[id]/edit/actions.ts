"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  let code = formData.get("code") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parent_id") as string || null;
  if (!name) return { error: "Nama kategori wajib diisi." };
  const supabase = await createClient();

  if (!code || code.trim() === "") {
    const { data: categories } = await supabase.from("categories").select("code");
    let maxNum = 0;
    (categories || []).forEach(cat => {
      if (cat.code && cat.code.toUpperCase().startsWith("K-")) {
        const num = parseInt(cat.code.toUpperCase().replace("K-", ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    code = `K-${nextNum.toString().padStart(4, '0')}`;
  }

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
