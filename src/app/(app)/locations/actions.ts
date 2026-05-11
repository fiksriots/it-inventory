"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLocation(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;

  if (!name) {
    return { error: "Nama departemen/lokasi wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .insert([{ name, address }]);

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

  if (!name) {
    return { error: "Nama departemen/lokasi wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .update({ name, address })
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
