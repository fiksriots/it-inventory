import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditItemForm from "./edit-form";
import { formatCategoryName } from "@/utils/category";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).single();
  
  const { data: rawCategories } = await supabase.from("categories").select("id, name, parent_id");
  const formattedCategories = (rawCategories || []).map(cat => ({
    ...cat,
    name: formatCategoryName(cat, rawCategories || [])
  })).sort((a, b) => a.name.localeCompare(b.name));

  const { data: locations } = await supabase.from("locations").select("id, name").order("name");
  
  // Fetch Detailed Stock per Location
  const { data: stocks } = await supabase
    .from("item_stocks")
    .select("*, locations(name)")
    .eq("item_id", id);

  if (!item) notFound();
  return <EditItemForm item={item} categories={formattedCategories} locations={locations || []} stocks={stocks || []} />;
}
