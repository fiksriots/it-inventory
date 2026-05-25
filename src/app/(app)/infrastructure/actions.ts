"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

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
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const catPrefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "INF");
  const prefix = `${catPrefix}-${dateStr}-`;

  const { data: todayAssets } = await supabase
    .from("infrastructure_assets")
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
  const asset_number = `${prefix}${seq}`;

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

export async function createInfraMaintenanceLog(assetId: string, formData: FormData) {
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
      // 2. Kurangi dari source location (cari yang kondisinya non-Rusak)
      const { data: sourceStocks } = await supabase
        .from("item_stocks")
        .select("condition, quantity")
        .eq("item_id", replaced_item_id)
        .eq("location_id", source_location_id)
        .neq("condition", "Rusak");

      const sourceStock = sourceStocks?.find(s => s.quantity >= replaced_quantity);
      if (!sourceStock) {
        throw new Error("Stok suku cadang aktif (non-Rusak) di gudang sumber tidak mencukupi untuk pergantian.");
      }
      const sourceCondition = sourceStock.condition || "Normal";

      await supabase
        .from("item_stocks")
        .update({ quantity: sourceStock.quantity - replaced_quantity, last_updated: new Date().toISOString() })
        .eq("item_id", replaced_item_id)
        .eq("location_id", source_location_id)
        .eq("condition", sourceCondition);

      // 3. Tambah di Gudang Rusak dengan kondisi 'Rusak'
      const { data: rusakStock } = await supabase
        .from("item_stocks")
        .select("quantity")
        .eq("item_id", replaced_item_id)
        .eq("location_id", rusakLocation.id)
        .eq("condition", "Rusak")
        .maybeSingle();

      if (rusakStock) {
        await supabase
          .from("item_stocks")
          .update({ quantity: rusakStock.quantity + replaced_quantity, last_updated: new Date().toISOString() })
          .eq("item_id", replaced_item_id)
          .eq("location_id", rusakLocation.id)
          .eq("condition", "Rusak");
      } else {
        await supabase
          .from("item_stocks")
          .insert([{ item_id: replaced_item_id, location_id: rusakLocation.id, quantity: replaced_quantity, condition: "Rusak" }]);
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
          notes: `Suku cadang bagus (${sourceCondition}) digunakan untuk pemeliharaan infrastruktur. Catatan: ${notes || '-'}`,
          user_id: userId
        },
        {
          item_id: replaced_item_id,
          location_id: rusakLocation.id,
          mutation_type: "INBOUND",
          quantity: replaced_quantity,
          notes: `Komponen rusak diganti dari pemeliharaan infrastruktur. Alasan kerusakan: ${notes || '-'}`,
          user_id: userId
        }
      ]);

      const { data: itemData } = await supabase.from("items").select("name").eq("id", replaced_item_id).single();
      partReplacementNote = `\n\n[Sistem] Pergantian Part: ${itemData?.name || 'Item'} (x${replaced_quantity}). Part lama dimasukkan ke Gudang Rusak dengan status Rusak.`;
    }
  }

  // 1. Insert ke tabel log
  const logPayload = {
    asset_id: assetId,
    maintenance_date,
    maintenance_title,
    notes: (notes || "") + partReplacementNote,
    performed_by,
    status_after,
    image_url: imageUrl
  };

  const { error: logError } = await supabase
    .from("infrastructure_maintenance_logs")
    .insert([logPayload]);

  if (logError) {
    console.error("Insert Log Error Details:", logError);
    throw new Error(`Gagal menyimpan log perawatan: ${logError.message}`);
  }

  // 2. Update tanggal terakhir perawatan, tanggal berikutnya (opsional), dan status pada aset
  const assetPayload: any = {
    last_maintenance_date: maintenance_date,
    status: status_after
  };

  const rawNextDate = formData.get("next_maintenance_date") as string;
  if (rawNextDate && rawNextDate.trim() !== "") {
    assetPayload.next_maintenance_date = rawNextDate.trim();
  }

  const { error: assetError } = await supabase
    .from("infrastructure_assets")
    .update(assetPayload)
    .eq("id", assetId);

  if (assetError) {
    console.error("Update Asset Error Details:", assetError);
  }

  // 3. Tambahkan ke laporan harian otomatis
  const { data: assetData } = await supabase.from("infrastructure_assets").select("name, asset_number").eq("id", assetId).single();
  const assetName = assetData?.name ? `${assetData.name} (${assetData.asset_number})` : "Infrastruktur";

  await supabase.from("it_daily_logs").insert({
    activity_name: `Maintenance: ${assetName}`,
    details: `${maintenance_title}\n\nNotes: ${notes || "-"}`,
    status: status_after === "Aktif" ? "Selesai" : "Pending",
    date: maintenance_date,
    technician_name: performed_by || "Tim IT Support"
  });

  revalidatePath("/infrastructure");
  revalidatePath(`/infrastructure/${assetId}`);
  return { success: true };
}

export async function deleteInfraMaintenanceLog(id: string, assetId: string) {
  const supabase = await createClient();

  // Optionally find file and delete it locally
  try {
    const { data } = await supabase
      .from("infrastructure_maintenance_logs")
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
    .from("infrastructure_maintenance_logs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Log Error:", error);
    throw new Error(`Gagal menghapus log perawatan: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  revalidatePath(`/infrastructure/${assetId}`);
  return { success: true };
}

export async function updateInfraMaintenanceLog(logId: string, assetId: string, formData: FormData) {
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
      const { data: oldData } = await supabase.from("infrastructure_maintenance_logs").select("image_url").eq("id", logId).single();
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
      const { data: oldData } = await supabase.from("infrastructure_maintenance_logs").select("image_url").eq("id", logId).single();
      if (oldData?.image_url) {
        const oldPath = path.join(process.cwd(), "public", oldData.image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } catch (err) {}
  }

  const { error } = await supabase
    .from("infrastructure_maintenance_logs")
    .update(payload)
    .eq("id", logId);

  if (error) {
    console.error("Update Log Error:", error);
    throw new Error(`Gagal memperbarui log perawatan: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  revalidatePath(`/infrastructure/${assetId}`);
  return { success: true };
}

export async function updateAssetsCategory(oldCategory: string, newCategory: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("infrastructure_assets")
    .update({ category: newCategory })
    .eq("category", oldCategory);

  if (error) {
    console.error("Update Assets Category Error:", error);
    throw new Error(`Gagal memperbarui kategori aset: ${error.message}`);
  }

  revalidatePath("/infrastructure");
  return { success: true };
}

