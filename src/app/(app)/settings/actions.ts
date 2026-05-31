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

    let publicPath = "";
    const isVercel = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;

    if (isVercel) {
      console.log("DEBUG: Vercel environment detected. Converting logo to Base64 Data URL...");
      const base64String = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";
      publicPath = `data:${mimeType};base64,${base64String}`;
    } else {
      try {
        const uploadDir = join(process.cwd(), "public", "uploads", "settings");
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const path = join(uploadDir, fileName);
        publicPath = `/uploads/settings/${fileName}`;

        await writeFile(path, buffer);
      } catch (fsErr) {
        console.warn("DEBUG: Local write failed. Falling back to Base64 Data URL for logo:", fsErr);
        const base64String = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        publicPath = `data:${mimeType};base64,${base64String}`;
      }
    }

    // Upsert database with local path or data URL
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

    let publicPath = "";
    const isVercel = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;

    if (isVercel) {
      console.log("DEBUG: Vercel environment detected. Converting avatar to Base64 Data URL...");
      const base64String = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";
      publicPath = `data:${mimeType};base64,${base64String}`;
    } else {
      try {
        const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
        if (!existsSync(uploadDir)) {
          console.log("DEBUG: Creating local directory:", uploadDir);
          await mkdir(uploadDir, { recursive: true });
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
        const path = join(uploadDir, fileName);
        publicPath = `/uploads/profiles/${fileName}`;

        console.log("DEBUG: Writing file to disk:", path);
        await writeFile(path, buffer);
      } catch (fsErr) {
        console.warn("DEBUG: Local write failed. Falling back to Base64 Data URL for avatar:", fsErr);
        const base64String = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        publicPath = `data:${mimeType};base64,${base64String}`;
      }
    }

    console.log("DEBUG: Attempting UPSERT to profiles table for path:", publicPath.substring(0, 50) + "...");
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_url: publicPath, email: user.email });

    if (updateError) {
      console.error("DEBUG: DATABASE ERROR (profiles):", updateError);
      throw new Error(`Database error: ${updateError.message}`);
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

export async function addUserAccount(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string || "Staff";
  const password = formData.get("password") as string;

  if (!email || !password || !fullName) {
    return { error: "Email, nama lengkap, dan password wajib diisi." };
  }

  if (password.length < 6) {
    return { error: "Password minimal harus 6 karakter." };
  }

  try {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    let userId: string | undefined = undefined;

    if (serviceRoleKey) {
      // 1. Menggunakan Admin API jika Service Role Key tersedia (Melewati rate-limiting & verifikasi email)
      console.log("DEBUG: Mendaftarkan user via Supabase Admin API...");
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        serviceRoleKey, 
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (adminError) {
        console.error("Admin CreateUser Error:", adminError);
        return { error: `Gagal mendaftarkan user (Admin API): ${adminError.message}` };
      }
      userId = adminData?.user?.id;
    } else {
      // 2. Fallback menggunakan Ephemeral Anon Client reguler
      console.log("DEBUG: Mendaftarkan user via Ephemeral Anon Client...");
      const ephemeralClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: authData, error: signUpError } = await ephemeralClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        console.error("SignUp Error:", signUpError);
        return { error: `Gagal mendaftarkan user: ${signUpError.message} (Saran: Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local untuk melewati limitasi Supabase)` };
      }
      userId = authData?.user?.id;
    }

    const supabase = await createClient();

    if (userId) {
      // Pastikan data tersimpan secara mutlak di tabel profiles dengan melakukan UPSERT eksplisit
      console.log("DEBUG: Melakukan UPSERT ke tabel profiles untuk userId:", userId);
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          role,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("CRITICAL UPSERT PROFILE ERROR:", upsertError);
        await supabase.from("profiles").update({ role, full_name: fullName }).eq("email", email);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await supabase.from("profiles").update({ role, full_name: fullName }).eq("email", email);
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Add user exception:", err);
    return { error: `Terjadi kesalahan sistem: ${err.message}` };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { error: `Gagal mengubah hak akses: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  // Coba hapus dari tabel profiles, atau set role menjadi 'Nonaktif' jika terhalang FK logs
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    // Jika gagal hapus karena referensi log, ubah status/role menjadi Nonaktif
    const { error: updateError } = await supabase.from("profiles").update({ role: "Nonaktif" }).eq("id", userId);
    if (updateError) {
      return { success: false, error: `Gagal menonaktifkan pengguna: ${updateError.message}` };
    }
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function generateDatabaseBackup() {
  const supabase = await createClient();
  const tables = [
    "items", "categories", "locations", "suppliers",
    "purchase_orders", "po_items", "item_stocks", "item_transfers", "inventory_logs",
    "infrastructure_assets", "infrastructure_maintenance_logs",
    "computers", "computer_maintenance_logs",
    "it_daily_logs", "it_projects", "it_project_logs", "it_project_rab",
    "item_services", "company_profile", "profiles"
  ];

  const backupData: Record<string, any[]> = {};
  const skippedTables: string[] = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        skippedTables.push(table);
      } else {
        backupData[table] = data || [];
      }
    } catch {
      skippedTables.push(table);
    }
  }

  return { success: true, data: backupData, skipped: skippedTables };
}

export async function restoreDatabaseBackup(backupData: any) {
  const supabase = await createClient();

  // Verifikasi pengguna aktif adalah administrator
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Anda harus login untuk melakukan restore data." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "Administrator") {
    return { error: "Hanya Administrator yang diizinkan melakukan restore data." };
  }

  if (!backupData || typeof backupData !== "object") {
    return { error: "Format data backup tidak valid." };
  }

  // Daftar tabel yang akan dikosongkan (urut terbalik berdasarkan ketergantungan foreign key)
  const tablesToDelete = [
    "item_services",
    "it_project_rab",
    "it_project_logs",
    "it_projects",
    "it_daily_logs",
    "computer_maintenance_logs",
    "computers",
    "infrastructure_maintenance_logs",
    "infrastructure_assets",
    "inventory_logs",
    "item_transfers",
    "po_items",
    "purchase_orders",
    "item_stocks",
    "items",
    "suppliers",
    "locations",
    "categories"
  ];

  try {
    // 1. Kosongkan record yang ada
    for (const table of tablesToDelete) {
      const { error } = await supabase.from(table).delete().not("id", "is", null);
      if (error) {
        console.error(`Error clearing table ${table}:`, error);
        throw new Error(`Gagal mengosongkan tabel ${table}: ${error.message}`);
      }
    }

    // 2. Restore/Upsert company_profile dan profiles
    if (backupData.company_profile && backupData.company_profile.length > 0) {
      const { error } = await supabase.from("company_profile").upsert(backupData.company_profile);
      if (error) throw new Error(`Gagal restore company_profile: ${error.message}`);
    }

    if (backupData.profiles && backupData.profiles.length > 0) {
      const { error } = await supabase.from("profiles").upsert(backupData.profiles);
      if (error) throw new Error(`Gagal restore profiles: ${error.message}`);
    }

    // 3. Restore categories (Two-pass approach untuk self-referencing parent_id)
    if (backupData.categories && backupData.categories.length > 0) {
      const categoriesTemp = backupData.categories.map((c: any) => ({
        ...c,
        parent_id: null
      }));
      const { error: err1 } = await supabase.from("categories").insert(categoriesTemp);
      if (err1) throw new Error(`Gagal restore categories (Pass 1): ${err1.message}`);

      const categoriesToUpdate = backupData.categories.filter((c: any) => c.parent_id !== null);
      for (const cat of categoriesToUpdate) {
        const { error: err2 } = await supabase
          .from("categories")
          .update({ parent_id: cat.parent_id })
          .eq("id", cat.id);
        if (err2) throw new Error(`Gagal restore categories (Pass 2): ${err2.message}`);
      }
    }

    // 4. Restore locations (Two-pass approach untuk self-referencing parent_id)
    if (backupData.locations && backupData.locations.length > 0) {
      const locationsTemp = backupData.locations.map((l: any) => ({
        ...l,
        parent_id: null
      }));
      const { error: err1 } = await supabase.from("locations").insert(locationsTemp);
      if (err1) throw new Error(`Gagal restore locations (Pass 1): ${err1.message}`);

      const locationsToUpdate = backupData.locations.filter((l: any) => l.parent_id !== null);
      for (const loc of locationsToUpdate) {
        const { error: err2 } = await supabase
          .from("locations")
          .update({ parent_id: loc.parent_id })
          .eq("id", loc.id);
        if (err2) throw new Error(`Gagal restore locations (Pass 2): ${err2.message}`);
      }
    }

    // 5. Restore suppliers
    if (backupData.suppliers && backupData.suppliers.length > 0) {
      const { error } = await supabase.from("suppliers").insert(backupData.suppliers);
      if (error) throw new Error(`Gagal restore suppliers: ${error.message}`);
    }

    // 6. Restore items
    if (backupData.items && backupData.items.length > 0) {
      const { error } = await supabase.from("items").insert(backupData.items);
      if (error) throw new Error(`Gagal restore items: ${error.message}`);
    }

    // 7. Restore item_stocks
    if (backupData.item_stocks && backupData.item_stocks.length > 0) {
      const { error } = await supabase.from("item_stocks").insert(backupData.item_stocks);
      if (error) throw new Error(`Gagal restore item_stocks: ${error.message}`);
    }

    // 8. Restore purchase_orders
    if (backupData.purchase_orders && backupData.purchase_orders.length > 0) {
      const { error } = await supabase.from("purchase_orders").insert(backupData.purchase_orders);
      if (error) throw new Error(`Gagal restore purchase_orders: ${error.message}`);
    }

    // 9. Restore po_items
    if (backupData.po_items && backupData.po_items.length > 0) {
      const { error } = await supabase.from("po_items").insert(backupData.po_items);
      if (error) throw new Error(`Gagal restore po_items: ${error.message}`);
    }

    // 10. Restore item_transfers
    if (backupData.item_transfers && backupData.item_transfers.length > 0) {
      const { error } = await supabase.from("item_transfers").insert(backupData.item_transfers);
      if (error) throw new Error(`Gagal restore item_transfers: ${error.message}`);
    }

    // 11. Restore inventory_logs
    if (backupData.inventory_logs && backupData.inventory_logs.length > 0) {
      const { error } = await supabase.from("inventory_logs").insert(backupData.inventory_logs);
      if (error) throw new Error(`Gagal restore inventory_logs: ${error.message}`);
    }

    // 12. Restore infrastructure_assets
    if (backupData.infrastructure_assets && backupData.infrastructure_assets.length > 0) {
      const { error } = await supabase.from("infrastructure_assets").insert(backupData.infrastructure_assets);
      if (error) throw new Error(`Gagal restore infrastructure_assets: ${error.message}`);
    }

    // 13. Restore infrastructure_maintenance_logs
    if (backupData.infrastructure_maintenance_logs && backupData.infrastructure_maintenance_logs.length > 0) {
      const { error } = await supabase.from("infrastructure_maintenance_logs").insert(backupData.infrastructure_maintenance_logs);
      if (error) throw new Error(`Gagal restore infrastructure_maintenance_logs: ${error.message}`);
    }

    // 14. Restore computers
    if (backupData.computers && backupData.computers.length > 0) {
      const { error } = await supabase.from("computers").insert(backupData.computers);
      if (error) throw new Error(`Gagal restore computers: ${error.message}`);
    }

    // 15. Restore computer_maintenance_logs
    if (backupData.computer_maintenance_logs && backupData.computer_maintenance_logs.length > 0) {
      const { error } = await supabase.from("computer_maintenance_logs").insert(backupData.computer_maintenance_logs);
      if (error) throw new Error(`Gagal restore computer_maintenance_logs: ${error.message}`);
    }

    // 16. Restore it_daily_logs
    if (backupData.it_daily_logs && backupData.it_daily_logs.length > 0) {
      const { error } = await supabase.from("it_daily_logs").insert(backupData.it_daily_logs);
      if (error) throw new Error(`Gagal restore it_daily_logs: ${error.message}`);
    }

    // 17. Restore it_projects
    if (backupData.it_projects && backupData.it_projects.length > 0) {
      const { error } = await supabase.from("it_projects").insert(backupData.it_projects);
      if (error) throw new Error(`Gagal restore it_projects: ${error.message}`);
    }

    // 18. Restore it_project_logs
    if (backupData.it_project_logs && backupData.it_project_logs.length > 0) {
      const { error } = await supabase.from("it_project_logs").insert(backupData.it_project_logs);
      if (error) throw new Error(`Gagal restore it_project_logs: ${error.message}`);
    }

    // 19. Restore it_project_rab
    if (backupData.it_project_rab && backupData.it_project_rab.length > 0) {
      const { error } = await supabase.from("it_project_rab").insert(backupData.it_project_rab);
      if (error) throw new Error(`Gagal restore it_project_rab: ${error.message}`);
    }

    // 20. Restore item_services
    if (backupData.item_services && backupData.item_services.length > 0) {
      const { error } = await supabase.from("item_services").insert(backupData.item_services);
      if (error) throw new Error(`Gagal restore item_services: ${error.message}`);
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Critical Restore Error:", err);
    return { error: err.message || "Terjadi kesalahan saat restore data." };
  }
}

export async function resetDatabaseSystem() {
  const supabase = await createClient();

  // Verifikasi pengguna aktif adalah administrator
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Anda harus login untuk melakukan reset sistem." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "Administrator") {
    return { error: "Hanya Administrator yang diizinkan melakukan reset sistem." };
  }

  const tablesToDelete = [
    "item_services",
    "it_project_rab",
    "it_project_logs",
    "it_projects",
    "it_daily_logs",
    "computer_maintenance_logs",
    "computers",
    "infrastructure_maintenance_logs",
    "infrastructure_assets",
    "inventory_logs",
    "item_transfers",
    "po_items",
    "purchase_orders",
    "item_stocks",
    "items",
    "suppliers",
    "locations",
    "categories"
  ];

  try {
    for (const table of tablesToDelete) {
      const { error } = await supabase.from(table).delete().not("id", "is", null);
      if (error) {
        throw new Error(`Gagal mengosongkan tabel ${table}: ${error.message}`);
      }
    }
    
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Reset system error:", err);
    return { error: err.message || "Gagal melakukan reset sistem." };
  }
}

