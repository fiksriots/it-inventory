"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

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
  
  const imageFile = formData.get("image") as File | null;

  if (!maintenance_date || !maintenance_title) {
    throw new Error("Tanggal Perawatan dan Judul wajib diisi.");
  }

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    try {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads", "maintenance-logs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      imageUrl = `/uploads/maintenance-logs/${fileName}`;
    } catch (uploadErr: any) {
      console.error("Error uploading physical file:", uploadErr);
      throw new Error(`Gagal menyimpan gambar di server: ${uploadErr.message}`);
    }
  }

  const replaced_item_id = formData.get("replaced_item_id") as string;
  const replaced_quantity_str = formData.get("replaced_quantity") as string;
  const source_location_id = formData.get("source_location_id") as string;
  const replaced_quantity = replaced_quantity_str ? parseInt(replaced_quantity_str) : 0;

  let partReplacementNote = "";

  if (replaced_item_id && replaced_quantity > 0 && source_location_id) {
    // 1. Pastikan "Gudang Rusak" ada
    let { data: rusakLocation } = await supabase.from("locations").select("id").eq("name", "Gudang Rusak").single();
    if (!rusakLocation) {
      const { data: newLoc } = await supabase.from("locations").insert([{ name: "Gudang Rusak", address: "Penampungan Barang Rusak" }]).select().single();
      rusakLocation = newLoc;
    }

    if (rusakLocation) {
      // 2. Kurangi dari source location
      const { data: sourceStock } = await supabase.from("item_stocks").select("quantity").eq("item_id", replaced_item_id).eq("location_id", source_location_id).single();
      if (!sourceStock || sourceStock.quantity < replaced_quantity) {
        throw new Error("Stok suku cadang di gudang sumber tidak mencukupi untuk pergantian.");
      }
      await supabase.from("item_stocks").update({ quantity: sourceStock.quantity - replaced_quantity, last_updated: new Date().toISOString() }).eq("item_id", replaced_item_id).eq("location_id", source_location_id);

      // 3. Tambah di Gudang Rusak
      const { data: rusakStock } = await supabase.from("item_stocks").select("quantity").eq("item_id", replaced_item_id).eq("location_id", rusakLocation.id).single();
      if (rusakStock) {
        await supabase.from("item_stocks").update({ quantity: rusakStock.quantity + replaced_quantity, last_updated: new Date().toISOString() }).eq("item_id", replaced_item_id).eq("location_id", rusakLocation.id);
      } else {
        await supabase.from("item_stocks").insert([{ item_id: replaced_item_id, location_id: rusakLocation.id, quantity: replaced_quantity }]);
      }

      // 4. Catat ke inventory_logs
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      await supabase.from("inventory_logs").insert([
        {
          item_id: replaced_item_id,
          location_id: source_location_id,
          mutation_type: "OUTBOUND",
          quantity: replaced_quantity,
          notes: `Pergantian suku cadang untuk pemeliharaan komputer (ID: ${computerId})`,
          user_id: userId
        },
        {
          item_id: replaced_item_id,
          location_id: rusakLocation.id,
          mutation_type: "INBOUND",
          quantity: replaced_quantity,
          notes: `Sisa komponen rusak dari pemeliharaan komputer (ID: ${computerId})`,
          user_id: userId
        }
      ]);

      const { data: itemData } = await supabase.from("items").select("name").eq("id", replaced_item_id).single();
      partReplacementNote = `\n\n[Sistem] Pergantian Part: ${itemData?.name || 'Item'} (x${replaced_quantity}). Part lama dimasukkan ke Gudang Rusak.`;
    }
  }

  // 1. Insert ke tabel log
  const logPayload = {
    computer_id: computerId,
    maintenance_date,
    maintenance_title,
    notes: (notes || "") + partReplacementNote,
    performed_by,
    status_after,
    image_url: imageUrl
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

  // 3. Tambahkan ke laporan harian otomatis
  const { data: computerData } = await supabase.from("computers").select("name, asset_number").eq("id", computerId).single();
  const computerName = computerData?.name ? `${computerData.name} (${computerData.asset_number})` : "Komputer";
  
  await supabase.from("it_daily_logs").insert({
    activity_name: `Maintenance: ${computerName}`,
    details: `${maintenance_title}\n\nNotes: ${notes || "-"}`,
    status: status_after === "Aktif" ? "Selesai" : "Pending",
    date: maintenance_date,
    technician_name: performed_by || "Tim IT Support",
    image_url: imageUrl
  });

  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  return { success: true };
}

export async function deleteComputerMaintenanceLog(id: string, computerId: string) {
  const supabase = await createClient();

  // Optionally find file and delete it locally
  try {
    const { data } = await supabase
      .from("computer_maintenance_logs")
      .select("image_url")
      .eq("id", id)
      .single();
      
    if (data?.image_url) {
      const localPath = path.join(process.cwd(), "public", data.image_url);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  } catch (err) {
    console.error("Error removing physical file:", err);
  }

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

export async function updateComputerMaintenanceLog(logId: string, computerId: string, formData: FormData) {
  const supabase = await createClient();

  const maintenance_title = formData.get("maintenance_title") as string;
  const maintenance_date = formData.get("maintenance_date") as string;
  const notes = formData.get("notes") as string;
  const performed_by = formData.get("performed_by") as string;
  const status_after = formData.get("status_after") as string;
  
  const imageFile = formData.get("image") as File | null;
  const removeImage = formData.get("remove_image") === "true";

  if (!maintenance_title || !maintenance_date) {
    throw new Error("Tanggal Perawatan dan Judul wajib diisi.");
  }

  const payload: any = {
    maintenance_title,
    maintenance_date,
    notes: notes || null,
    performed_by: performed_by || null,
    status_after: status_after || "Aktif",
  };

  // Handle image upload
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    try {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads", "maintenance-logs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      payload.image_url = `/uploads/maintenance-logs/${fileName}`;
      
      // Attempt to delete old file
      const { data: oldData } = await supabase.from("computer_maintenance_logs").select("image_url").eq("id", logId).single();
      if (oldData?.image_url) {
        const oldPath = path.join(process.cwd(), "public", oldData.image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } catch (uploadErr: any) {
      console.error("Error uploading physical file:", uploadErr);
      throw new Error(`Gagal menyimpan gambar di server: ${uploadErr.message}`);
    }
  } else if (removeImage) {
    payload.image_url = null;
    try {
      const { data: oldData } = await supabase.from("computer_maintenance_logs").select("image_url").eq("id", logId).single();
      if (oldData?.image_url) {
        const oldPath = path.join(process.cwd(), "public", oldData.image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } catch (err) {}
  }

  const { error } = await supabase
    .from("computer_maintenance_logs")
    .update(payload)
    .eq("id", logId);

  if (error) {
    console.error("Update Log Error:", error);
    throw new Error(`Gagal memperbarui log perawatan: ${error.message}`);
  }

  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  return { success: true };
}
