import { createClient } from "@/utils/supabase/server";
import { fixEmptyCategoryCodes } from "@/app/(app)/services/import-export-actions";
import CategoriesClient from "./categories-client";

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Jalankan self-healing untuk kode kategori kosong
  await fixEmptyCategoryCodes();

  // Ambil seluruh kategori beserta jumlah item-nya untuk diserahkan ke pohon hierarki di client
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, code, description, parent_id, items(count)")
    .order("name", { ascending: true });

  return <CategoriesClient initialCategories={categories || []} />;
}
