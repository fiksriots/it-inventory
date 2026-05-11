import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditItemForm from "./edit-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).single();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  const { data: locations } = await supabase.from("locations").select("id, name").order("name");
  
  // Fetch Detailed Stock per Location
  const { data: stocks } = await supabase
    .from("item_stocks")
    .select("*, locations(name)")
    .eq("item_id", id);
  const totalStock = stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  if (!item) notFound();
  return <EditItemForm item={item} categories={categories || []} locations={locations || []} stocks={stocks || []} />;
}
