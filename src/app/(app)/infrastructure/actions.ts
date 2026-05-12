"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createInfrastructure(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  
  // Mapping eksplisit string kosong ke null untuk menghindari error parsing tipe di Postgres
  const rawLocation = formData.get("location_id") as string;
  const location_id = rawLocation && rawLocation.trim() !== "" ? rawLocation.trim() : null;

  const status = formData.get("status") as string || "Aktif";
  
  const rawIp = formData.get("ip_address") as string;
  const ip_address = rawIp && rawIp.trim() !== "" ? rawIp.trim() : null;

  const rawVendor = formData.get("vendor_name") as string;
  const vendor_name = rawVendor && rawVendor.trim() !== "" ? rawVendor.trim() : null;

  const rawNotes = formData.get("notes") as string;
  const notes = rawNotes && rawNotes.trim() !== "" ? rawNotes.trim() : null;

  const rawLastDate = formData.get("last_maintenance_date") as string;
  const last_maintenance_date = rawLastDate && rawLastDate.trim() !== "" ? rawLastDate.trim() : null;

  const rawNextDate = formData.get("next_maintenance_date") as string;
  const next_maintenance_date = rawNextDate && rawNextDate.trim() !== "" ? rawNextDate.trim() : null;

  if (!name || !category) {
    throw new Error("Nama Fasilitas dan Kategori wajib diisi.");
  }

  // Generasi nomor aset unik
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const catPrefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "INF");
  const asset_number = `${catPrefix}-${dateStr}-${randomHex}`;

  const payload = {
    asset_number,
    name,
    category,
    location_id,
    status,
    ip_address,
    vendor_name,
    notes,
    last_maintenance_date,
    next_maintenance_date,
    created_by: user?.id || null,
  };

  console.log("DEBUG: Menyimpan payload infrastruktur:", payload);

  const { data, error } = await supabase
    .from("infrastructure_assets")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Insert Infrastructure Error Details:", error);
    throw new Error(`Gagal menyimpan fasilitas (${error.code || 'DB_ERR'}): ${error.message}. Pastikan tabel 'infrastructure_assets' sudah dibuat di database.`);
  }

  revalidatePath("/infrastructure");
  return { success: true, id: data.id };
}

export async function updateInfrastructure(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  
  const rawLocation = formData.get("location_id") as string;
  const location_id = rawLocation && rawLocation.trim() !== "" ? rawLocation.trim() : null;

  const status = formData.get("status") as string || "Aktif";
  
  const rawIp = formData.get("ip_address") as string;
  const ip_address = rawIp && rawIp.trim() !== "" ? rawIp.trim() : null;

  const rawVendor = formData.get("vendor_name") as string;
  const vendor_name = rawVendor && rawVendor.trim() !== "" ? rawVendor.trim() : null;

  const rawNotes = formData.get("notes") as string;
  const notes = rawNotes && rawNotes.trim() !== "" ? rawNotes.trim() : null;

  if (!name || !category) {
    throw new Error("Nama Fasilitas dan Kategori wajib diisi.");
  }

  const payload = {
    name,
    category,
    location_id,
    status,
    ip_address,
    vendor_name,
    notes,
  };

  const { error } = await supabase
    .from("infrastructure_assets")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Update Infrastructure Error Details:", error);
    throw new Error(`Gagal memperbarui fasilitas: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  revalidatePath(`/infrastructure/${id}`);
  return { success: true };
}

export async function updateInfraSchedule(id: string, formData: FormData) {
  const supabase = await createClient();

  const rawLast = formData.get("last_maintenance_date") as string;
  const rawNext = formData.get("next_maintenance_date") as string;
  const rawNotes = formData.get("notes") as string;

  const payload: any = {};
  if (rawLast !== null) payload.last_maintenance_date = rawLast && rawLast.trim() !== "" ? rawLast.trim() : null;
  if (rawNext !== null) payload.next_maintenance_date = rawNext && rawNext.trim() !== "" ? rawNext.trim() : null;
  if (rawNotes !== null) payload.notes = rawNotes && rawNotes.trim() !== "" ? rawNotes.trim() : null;

  // Set status ke Aktif jika sudah selesai maintenance
  const statusUpdate = formData.get("status") as string;
  if (statusUpdate) {
    payload.status = statusUpdate;
  }

  console.log("DEBUG: Memperbarui jadwal infrastruktur:", payload);

  const { error } = await supabase
    .from("infrastructure_assets")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Update Schedule Error Details:", error);
    throw new Error(`Gagal memperbarui jadwal maintenance: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  revalidatePath(`/infrastructure/${id}`);
  return { success: true };
}

export async function deleteInfrastructure(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("infrastructure_assets")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Infrastructure Error:", error);
    throw new Error(`Gagal menghapus fasilitas: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  return { success: true };
}
