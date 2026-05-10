import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditCategoryForm from "./edit-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single();

  if (!category) notFound();

  return <EditCategoryForm category={category} />;
}
