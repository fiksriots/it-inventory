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
    .select("id, name, parent:parent_id(name)")
    .order("name");

  // Ambil kategori unik dari database
  const { data: assets } = await supabase
    .from("infrastructure_assets")
    .select("category");
  const dbCategories = Array.from(new Set((assets || []).map(a => a.category).filter(Boolean)));

  return (
    <InfrastructureForm 
      locations={locations || []} 
      dbCategories={dbCategories}
      initialLocation={location} 
      initialCategory={category} 
    />
  );
}
