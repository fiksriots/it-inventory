import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditCategoryForm from "./edit-form";
import { formatCategoryName } from "@/utils/category";
import { fixEmptyCategoryCodes } from "@/app/(app)/services/import-export-actions";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Jalankan self-healing untuk kode kategori kosong terlebih dahulu
  await fixEmptyCategoryCodes();

  const supabase = await createClient();
  
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single();
  if (!category) notFound();

  // Ambil semua kategori selain kategori yang sedang diedit (untuk menghindari sirkular referensi)
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .neq("id", id)
    .order("name");

  const categoryOptions = (allCategories || []).map(cat => ({
    id: cat.id,
    label: formatCategoryName(cat, allCategories || [])
  })).sort((a, b) => a.label.localeCompare(b.label));

  return <EditCategoryForm category={category} categories={categoryOptions} />;
}
