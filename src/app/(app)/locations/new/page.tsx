import { createClient } from "@/utils/supabase/server";
import NewLocationForm from "./new-form";

export default async function NewLocationPage() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, parent_id")
    .order("name");

  return <NewLocationForm locations={locations || []} />;
}
