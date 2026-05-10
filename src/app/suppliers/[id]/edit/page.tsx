import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditSupplierForm from "./edit-form";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", id).single();

  if (!supplier) notFound();

  return <EditSupplierForm supplier={supplier} />;
}
