import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditLocationForm from "./edit-form";

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: location } = await supabase.from("locations").select("*").eq("id", id).single();
  
  if (!location) notFound();
  
  return <EditLocationForm location={location} />;
}
