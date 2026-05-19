"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Helper to get administrative service client or standard server action client
async function getActionClient() {
  const supabase = await createClient();
  return { supabase };
}

export async function createDailyLog(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const activityName = formData.get("activity_name") as string;
    const details = formData.get("details") as string;
    const status = formData.get("status") as string || "Selesai";
    const date = formData.get("date") as string || new Date().toISOString().split("T")[0];
    const technicianName = formData.get("technician_name") as string || "Tim IT Support";
    const imageFile = formData.get("image") as File | null;

    if (!activityName || !details) {
      return { error: "Judul kegiatan dan rincian pekerjaan wajib diisi!" };
    }

    let imageUrl: string | null = null;

    // Handle physical file upload locally
    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;

        // Ensure directories exist in workspace
        const uploadDir = path.join(process.cwd(), "public", "uploads", "daily-logs");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        
        // Write physical file directly to avoid sharp/memory errors on server
        fs.writeFileSync(filePath, buffer);

        imageUrl = `/uploads/daily-logs/${fileName}`;
      } catch (uploadErr) {
        console.error("Error uploading physical file:", uploadErr);
        // Fallback to null but don't crash
      }
    }

    // Process Material Usage
    const usedItemId = formData.get("used_item_id") as string;
    const usedQuantityStr = formData.get("used_quantity") as string;
    const sourceLocationId = formData.get("source_location_id") as string;
    const usedQuantity = usedQuantityStr ? parseInt(usedQuantityStr) : 0;
    
    let materialNote = "";

    if (usedItemId && usedQuantity > 0 && sourceLocationId) {
      // 1. Cek stok
      const { data: sourceStock } = await supabase
        .from("item_stocks")
        .select("quantity")
        .eq("item_id", usedItemId)
        .eq("location_id", sourceLocationId)
        .single();
        
      if (!sourceStock || sourceStock.quantity < usedQuantity) {
        return { error: "Stok material di gudang sumber tidak mencukupi untuk penggunaan." };
      }

      // 2. Kurangi stok
      await supabase
        .from("item_stocks")
        .update({ quantity: sourceStock.quantity - usedQuantity, last_updated: new Date().toISOString() })
        .eq("item_id", usedItemId)
        .eq("location_id", sourceLocationId);

      // 3. Catat mutasi log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("inventory_logs").insert([{
        item_id: usedItemId,
        location_id: sourceLocationId,
        mutation_type: "OUTBOUND",
        quantity: usedQuantity,
        notes: `Penggunaan material untuk Laporan Harian IT: ${activityName}`,
        user_id: user?.id
      }]);

      // 4. Update rincian pekerjaan
      const { data: itemData } = await supabase.from("items").select("name").eq("id", usedItemId).single();
      materialNote = `\n\n[Sistem] Material Digunakan: ${itemData?.name || 'Item'} (x${usedQuantity}).`;
    }

    // Insert database record
    const { data: log, error } = await supabase
      .from("it_daily_logs")
      .insert({
        activity_name: activityName,
        details: details + materialNote,
        status,
        date,
        technician_name: technicianName,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating daily log:", error);
      return { error: `Gagal menyimpan laporan harian: ${error.message}` };
    }

    revalidatePath("/daily-logs");
    return { success: true, log };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function deleteDailyLog(id: string) {
  try {
    const { supabase } = await getActionClient();

    // Optionally find file and delete it locally
    try {
      const { data } = await supabase
        .from("it_daily_logs")
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
      .from("it_daily_logs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting daily log:", error);
      return { error: `Gagal menghapus laporan: ${error.message}` };
    }

    revalidatePath("/daily-logs");
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}
