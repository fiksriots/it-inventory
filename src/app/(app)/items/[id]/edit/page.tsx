import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditItemForm from "./edit-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (!item) notFound();
  return <EditItemForm item={item} categories={categories || []} />;
}
