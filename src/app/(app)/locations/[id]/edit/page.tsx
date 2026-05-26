import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EditLocationForm from "./edit-form";

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: location } = await supabase.from("locations").select("*").eq("id", id).single();
  
  if (!location) notFound();

  // Ambil lokasi lain yang bisa dijadikan parent (kecuali lokasi itu sendiri)
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, parent_id")
    .neq("id", id)
    .order("name");
  
  return <EditLocationForm location={location} locations={locations || []} />;
}
