import { createClient } from "@/utils/supabase/server";
import InfrastructureClient from "./infrastructure-client";

export default async function InfrastructurePage() {
  const supabase = await createClient();

  // Ambil daftar fasilitas fisik yang diurutkan dari terbaru
  const { data: infrastructureAssets } = await supabase
    .from("infrastructure_assets")
    .select(`
      *,
      locations (name)
    `)
    .order("created_at", { ascending: false });

  // Ambil lokasi untuk kemudahan filter
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");

  const safeAssets = infrastructureAssets || [];
  const safeLocations = locations || [];

  return <InfrastructureClient assets={safeAssets} locations={safeLocations} />;
}
