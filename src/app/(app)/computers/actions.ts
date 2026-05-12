"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createComputer(prevState: any, formData: FormData) {
  const supabase = await createClient();

  let assetNumber = formData.get("asset_number") as string;
  const name = formData.get("name") as string;
  const locationIdInput = formData.get("location_id") as string;
  const locationId = locationIdInput ? locationIdInput : null;
  const userAssigned = formData.get("user_assigned") as string;

  const ipAddress = formData.get("ip_address") as string;
  const operatingSystem = formData.get("operating_system") as string;
  const processor = formData.get("processor") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;

  // Ekstensi parameter Enterprise
  const macAddress = formData.get("mac_address") as string;
  const serialNumber = formData.get("serial_number") as string;
  const pDateInput = formData.get("purchase_date") as string;
  const wDateInput = formData.get("warranty_expiry_date") as string;
  const remoteSupportId = formData.get("remote_support_id") as string;

  const purchaseDate = pDateInput ? pDateInput : null;
  const warrantyExpiryDate = wDateInput ? wDateInput : null;

  const status = formData.get("status") as string || "Aktif";
  const notes = formData.get("notes") as string;
  const lastMaintenanceDateInput = formData.get("last_maintenance_date") as string;
  const nextMaintenanceDateInput = formData.get("next_maintenance_date") as string;

  const lastMaintenanceDate = lastMaintenanceDateInput ? lastMaintenanceDateInput : null;
  const nextMaintenanceDate = nextMaintenanceDateInput ? nextMaintenanceDateInput : null;

  if (!name) {
    return { error: "Nama Komputer / Hostname wajib diisi." };
  }

  // Generate nomor aset jika diset AUTO atau kosong
  if (!assetNumber || assetNumber === "AUTO" || assetNumber.trim() === "") {
    const rand = Math.floor(1000 + Math.random() * 9000);
    assetNumber = `PC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${rand}`;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("computers")
    .insert({
      asset_number: assetNumber,
      name,
      location_id: locationId,
      user_assigned: userAssigned,
      ip_address: ipAddress,
      operating_system: operatingSystem,
      processor,
      ram,
      storage,
      mac_address: macAddress,
      serial_number: serialNumber,
      purchase_date: purchaseDate,
      warranty_expiry_date: warrantyExpiryDate,
      remote_support_id: remoteSupportId,
      status,
      notes,
      last_maintenance_date: lastMaintenanceDate,
      next_maintenance_date: nextMaintenanceDate,
      created_by: user?.id || null,
    });

  if (error) {
    console.error("Create computer error:", error);
    return { error: `Gagal menyimpan data komputer: ${error.message}` };
  }

  revalidatePath("/computers");
  redirect("/computers");
}

export async function updateComputer(id: string, prevState: any, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const locationIdInput = formData.get("location_id") as string;
  const locationId = locationIdInput ? locationIdInput : null;
  const userAssigned = formData.get("user_assigned") as string;

  const ipAddress = formData.get("ip_address") as string;
  const operatingSystem = formData.get("operating_system") as string;
  const processor = formData.get("processor") as string;
  const ram = formData.get("ram") as string;
  const storage = formData.get("storage") as string;

  // Ekstensi parameter Enterprise
  const macAddress = formData.get("mac_address") as string;
  const serialNumber = formData.get("serial_number") as string;
  const pDateInput = formData.get("purchase_date") as string;
  const wDateInput = formData.get("warranty_expiry_date") as string;
  const remoteSupportId = formData.get("remote_support_id") as string;

  const purchaseDate = pDateInput ? pDateInput : null;
  const warrantyExpiryDate = wDateInput ? wDateInput : null;

  const status = formData.get("status") as string || "Aktif";
  const notes = formData.get("notes") as string;

  if (!name) {
    return { error: "Nama Komputer / Hostname wajib diisi." };
  }

  const { error } = await supabase
    .from("computers")
    .update({
      name,
      location_id: locationId,
      user_assigned: userAssigned,
      ip_address: ipAddress,
      operating_system: operatingSystem,
      processor,
      ram,
      storage,
      mac_address: macAddress,
      serial_number: serialNumber,
      purchase_date: purchaseDate,
      warranty_expiry_date: warrantyExpiryDate,
      remote_support_id: remoteSupportId,
      status,
      notes,
    })
    .eq("id", id);

  if (error) {
    console.error("Update computer error:", error);
    return { error: `Gagal memperbarui data: ${error.message}` };
  }

  revalidatePath(`/computers/${id}`);
  revalidatePath("/computers");
  return { success: true };
}

export async function updateMaintenanceSchedule(id: string, lastDate: string | null, nextDate: string | null, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("computers")
    .update({
      last_maintenance_date: lastDate,
      next_maintenance_date: nextDate,
      status,
    })
    .eq("id", id);

  if (error) {
    return { error: `Gagal memperbarui jadwal: ${error.message}` };
  }

  revalidatePath(`/computers/${id}`);
  revalidatePath("/computers");
  return { success: true };
}

export async function deleteComputer(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("computers")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Gagal menghapus komputer: ${error.message}` };
  }

  revalidatePath("/computers");
  redirect("/computers");
}
