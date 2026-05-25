import { createClient } from "@/utils/supabase/server";
import LocationsClient from "./locations-client";

export default async function LocationsPage() {
  const supabase = await createClient();

  // Ambil semua lokasi untuk dirender secara hirarkis (parent-child accordion) di client
  const { data: locations } = await supabase
    .from("locations")
    .select("*, parent:parent_id(name), item_stocks(quantity), computers(id), infrastructure_assets(id)")
    .order("name");

  return <LocationsClient initialLocations={locations || []} />;
}
