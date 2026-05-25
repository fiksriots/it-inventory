import { createClient } from "@/utils/supabase/server";
import InfrastructureForm from "./infrastructure-form";

export default async function NewInfrastructurePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; category?: string }>;
}) {
  const { location, category } = await searchParams;
  const supabase = await createClient();

  // Ambil lokasi untuk penempatan
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");

  return (
    <InfrastructureForm 
      locations={locations || []} 
      initialLocation={location} 
      initialCategory={category} 
    />
  );
}
