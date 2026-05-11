"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function updateCompanyProfile(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  
  const { error } = await supabase
    .from("company_profile")
    .upsert({
      id: 1, // Ensure we always target/create the single row
      name,
      address,
      phone,
      email,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Profile Upsert Error:", error);
    throw error;
  }
  
  revalidatePath("/settings");
  return { success: true };
}

export async function uploadCompanyLogo(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("logo") as File;
  
  if (!file) return { error: "No file provided" };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "settings");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const path = join(uploadDir, fileName);
    const publicPath = `/uploads/settings/${fileName}`;

    // Write file to local disk
    await writeFile(path, buffer);

    // Upsert database with local path
    const { error: updateError } = await supabase
      .from("company_profile")
      .upsert({ id: 1, logo_url: publicPath });

    if (updateError) {
      console.error("Database upsert error:", updateError);
      throw updateError;
    }

    revalidatePath("/settings");
    return { success: true, url: publicPath };
  } catch (error: any) {
    console.error("CRITICAL UPLOAD ERROR:", error);
    throw new Error(`Gagal mengunggah file: ${error.message}`);
  }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password || !confirmPassword) {
    throw new Error("Semua field password wajib diisi.");
  }

  if (password !== confirmPassword) {
    throw new Error("Password konfirmasi tidak cocok.");
  }

  if (password.length < 6) {
    throw new Error("Password minimal harus 6 karakter.");
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) throw error;

  return { success: true };
}

export async function uploadProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("avatar") as File;
  
  if (!file) return { error: "No file provided" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Anda harus login untuk mengubah foto profil.");

  console.log("DEBUG: Processing avatar for user:", user.id);

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
    if (!existsSync(uploadDir)) {
      console.log("DEBUG: Creating local directory:", uploadDir);
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
    const path = join(uploadDir, fileName);
    const publicPath = `/uploads/profiles/${fileName}`;

    console.log("DEBUG: Writing file to disk:", path);
    await writeFile(path, buffer);

    console.log("DEBUG: Attempting UPSERT to profiles table for path:", publicPath);
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_url: publicPath, email: user.email });

    if (updateError) {
      console.error("DEBUG: DATABASE ERROR (profiles):", updateError);
      throw new Error(`Database error: ${updateError.message} (Hint: Cek apakah tabel 'profiles' sudah ada di Supabase)`);
    }

    console.log("DEBUG: Profile photo updated successfully!");
    revalidatePath("/settings");
    return { success: true, url: publicPath };
  } catch (error: any) {
    console.error("CRITICAL PROFILE ERROR:", error);
    throw new Error(`Gagal: ${error.message}`);
  }
}

export async function updateProfileName(formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get("full_name") as string;
  
  if (!fullName || fullName.trim() === "") {
    throw new Error("Nama tidak boleh kosong.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Anda harus login untuk mengubah nama profil.");

  console.log("DEBUG: Updating name for user:", user.id, "to:", fullName);

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName.trim(), updated_at: new Date().toISOString(), email: user.email });

  if (error) {
    console.error("DEBUG: DATABASE ERROR (name):", error);
    throw new Error(`Database error: ${error.message}`);
  }

  console.log("DEBUG: Profile name updated successfully!");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateNotificationSettings(formData: FormData) {
  const supabase = await createClient();
  const threshold = parseInt(formData.get("low_stock_threshold") as string);
  const enable = formData.get("enable_notifications") === "on";

  const { error } = await supabase
    .from("company_profile")
    .upsert({ 
      id: 1, 
      low_stock_threshold: threshold,
      enable_notifications: enable,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
  
  revalidatePath("/settings");
  return { success: true };
}

