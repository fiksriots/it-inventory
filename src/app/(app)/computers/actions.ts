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
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const prefix = `PC-${dateStr}-`;

    const { data: todayAssets } = await supabase
      .from("computers")
      .select("asset_number")
      .like("asset_number", `${prefix}%`);

    let maxSeq = 0;
    if (todayAssets && todayAssets.length > 0) {
      todayAssets.forEach(a => {
        const parts = a.asset_number.split('-');
        const seqStr = parts[parts.length - 1];
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      });
    }

    const seq = (maxSeq + 1).toString().padStart(3, '0');
    assetNumber = `${prefix}${seq}`;
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

export async function createComputerMaintenanceLog(computerId: string, formData: FormData) {
  const supabase = await createClient();

  const maintenance_date = formData.get("maintenance_date") as string;
  const maintenance_title = formData.get("maintenance_title") as string;
  
  const rawNotes = formData.get("notes") as string;
  const notes = rawNotes && rawNotes.trim() !== "" ? rawNotes.trim() : null;
  
  const rawPerformedBy = formData.get("performed_by") as string;
  const performed_by = rawPerformedBy && rawPerformedBy.trim() !== "" ? rawPerformedBy.trim() : null;
  
  const status_after = formData.get("status_after") as string || "Aktif";

  if (!maintenance_date || !maintenance_title) {
    throw new Error("Tanggal Perawatan dan Judul wajib diisi.");
  }

  // 1. Insert ke tabel log
  const logPayload = {
    computer_id: computerId,
    maintenance_date,
    maintenance_title,
    notes,
    performed_by,
    status_after
  };

  const { error: logError } = await supabase
    .from("computer_maintenance_logs")
    .insert([logPayload]);

  if (logError) {
    console.error("Insert Log Error Details:", logError);
    throw new Error(`Gagal menyimpan log perawatan: ${logError.message}`);
  }

  // 2. Update tanggal terakhir perawatan, tanggal berikutnya (opsional), dan status pada komputer
  const computerPayload: any = {
    last_maintenance_date: maintenance_date,
    status: status_after
  };

  const rawNextDate = formData.get("next_maintenance_date") as string;
  if (rawNextDate && rawNextDate.trim() !== "") {
    computerPayload.next_maintenance_date = rawNextDate.trim();
  }

  const { error: computerError } = await supabase
    .from("computers")
    .update(computerPayload)
    .eq("id", computerId);

  if (computerError) {
    console.error("Update Computer Error Details:", computerError);
  }

  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  return { success: true };
}

export async function deleteComputerMaintenanceLog(id: string, computerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("computer_maintenance_logs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Log Error:", error);
    throw new Error(`Gagal menghapus log perawatan: ${error.message}`);
  }

  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  return { success: true };
}

