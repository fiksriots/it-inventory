"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSupplier(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const contact_person = formData.get("contact_person") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

  if (!name) {
    return { error: "Nama perusahaan/supplier wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("suppliers")
    .insert([{ 
      name, 
      contact_person, 
      phone, 
      email, 
      address 
    }]);

  if (error) {
    console.error("Error inserting supplier:", error);
    return { error: `Gagal menyimpan supplier: ${error.message || error.details || JSON.stringify(error)}` };
  }

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  
  if (error) {
    console.error("Error deleting supplier:", error);
    return { error: `Gagal menghapus supplier: ${error.message}` };
  }
  
  revalidatePath("/suppliers");
  return {};
}
