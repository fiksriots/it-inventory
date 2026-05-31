"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  let code = formData.get("code") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parent_id") as string || null;

  if (!name) {
    return { error: "Nama kategori wajib diisi." };
  }

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

  const { error } = await supabase
    .from("categories")
    .insert([{ 
      name, 
      code: code.toUpperCase(), 
      description,
      parent_id: parentId || null
    }]);

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

export async function getCategoryItems(categoryId: string) {
  const supabase = await createClient();

  // 1. Ambil semua kategori untuk menyelesaikan hierarki subkategori
  const { data: allCats } = await supabase.from("categories").select("id, parent_id");
  const targetIds: string[] = [categoryId];

  if (allCats) {
    const getChildrenIds = (parentId: string) => {
      allCats.forEach(cat => {
        if (cat.parent_id === parentId) {
          targetIds.push(cat.id);
          getChildrenIds(cat.id);
        }
      });
    };
    getChildrenIds(categoryId);
  }

  // 2. Ambil barang-barang yang termasuk dalam kategori-kategori tersebut, beserta total stoknya per kondisi/lokasi
  const { data, error } = await supabase
    .from("items")
    .select(`
      id,
      name,
      sku,
      unit,
      categories (
        name
      ),
      item_stocks (
        quantity,
        condition,
        locations (
          name
        )
      )
    `)
    .in("category_id", targetIds)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching category items:", error);
    return { error: error.message };
  }

  return { data };
}
