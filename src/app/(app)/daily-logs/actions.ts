"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

import sharp from "sharp";

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

        // Standardize file name
        const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.jpg`;

        // Ensure directories exist in workspace
        const uploadDir = path.join(process.cwd(), "public", "uploads", "daily-logs");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        
        // Auto compress image to save disk space and prevent loading issues
        await sharp(buffer)
          .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filePath);

        imageUrl = `/uploads/daily-logs/${fileName}`;
      } catch (uploadErr) {
        console.error("Error uploading physical file:", uploadErr);
        // Fallback to null but don't crash
      }
    }

    // Insert database record
    const { data: log, error } = await supabase
      .from("it_daily_logs")
      .insert({
        activity_name: activityName,
        details,
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
