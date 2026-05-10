"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateSupplier(id: string, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const contact_person = formData.get("contact_person") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  if (!name) return { error: "Nama perusahaan wajib diisi." };
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update({ name, contact_person, phone, email, address }).eq("id", id);
  if (error) return { error: `Gagal memperbarui: ${error.message}` };
  revalidatePath("/suppliers");
  redirect("/suppliers");
}
