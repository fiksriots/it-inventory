"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLocation(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const parentIdVal = formData.get("parent_id") as string;
  const parent_id = parentIdVal ? parentIdVal : null;

  if (!name) {
    return { error: "Nama departemen/lokasi wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .insert([{ name, address, parent_id }]);

  if (error) {
    console.error("Error inserting location:", error);
    return { error: `Gagal menyimpan lokasi: ${error.message}` };
  }

  revalidatePath("/locations");
  redirect("/locations");
}

export async function updateLocation(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const parentIdVal = formData.get("parent_id") as string;
  const parent_id = parentIdVal ? parentIdVal : null;

  if (!name) {
    return { error: "Nama departemen/lokasi wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .update({ name, address, parent_id })
    .eq("id", id);

  if (error) {
    console.error("Error updating location:", error);
    return { error: `Gagal memperbarui lokasi: ${error.message}` };
  }

  revalidatePath("/locations");
  redirect("/locations");
}

export async function deleteLocation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting location:", error);
    return { error: `Gagal menghapus lokasi: ${error.message}` };
  }
  
  revalidatePath("/locations");
  return {};
}

export async function getLocationItems(locationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_stocks")
    .select(`
      quantity,
      condition,
      items (
        id,
        name,
        sku
      )
    `)
    .eq("location_id", locationId)
    .gt("quantity", 0)
    .order("quantity", { ascending: false });

  if (error) {
    console.error("Error fetching location items:", error);
    return { error: error.message };
  }

  return { data };
}
