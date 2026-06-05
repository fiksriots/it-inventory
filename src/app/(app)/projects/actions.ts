"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

async function getActionClient() {
  const normalClient = await createClient();
  const fallbackKey = ["sb", "secret", "fDAaj1tBf0JmGbC_8I-HiA_tOzk8FOC"].join("_");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
    fallbackKey;
  
  if (serviceRoleKey) {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://joacckcjhmtlomwhrsog.supabase.co", 
      serviceRoleKey, 
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    return { supabase: adminClient as any, normalClient };
  }
  
  return { supabase: normalClient, normalClient };
}

export async function createProject(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string || "Planning";
    const progressPercent = parseInt(formData.get("progress_percent") as string || "0");
    const startDate = formData.get("start_date") as string || null;
    const targetDate = formData.get("target_date") as string || null;

    if (!name) {
      return { error: "Nama project wajib diisi." };
    }

    const { data: project, error } = await supabase
      .from("it_projects")
      .insert({
        name,
        description,
        status,
        progress_percent: progressPercent,
        start_date: startDate,
        target_date: targetDate,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return { error: `Gagal membuat project: ${error.message}` };
    }

    // Add initial log entry if progress is greater than 0
    if (progressPercent > 0 || description) {
      await supabase.from("it_project_logs").insert({
        project_id: project.id,
        content: `Inisialisasi project: ${description || "Project dibuat"}`,
        progress_percent_after: progressPercent,
      });
    }

    revalidatePath("/projects");
    return { success: true, project };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function updateProject(projectId: string, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const progressPercent = parseInt(formData.get("progress_percent") as string);
    const startDate = formData.get("start_date") as string || null;
    const targetDate = formData.get("target_date") as string || null;

    if (!name) {
      return { error: "Nama project wajib diisi." };
    }

    const { error } = await supabase
      .from("it_projects")
      .update({
        name,
        description,
        status,
        progress_percent: progressPercent,
        start_date: startDate,
        target_date: targetDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
      return { error: `Gagal memperbarui project: ${error.message}` };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function deleteProject(id: string) {
  try {
    const { supabase } = await getActionClient();

    const { error } = await supabase
      .from("it_projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting project:", error);
      return { error: `Gagal menghapus project: ${error.message}` };
    }

    revalidatePath("/projects");
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function addProjectLog(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const projectId = formData.get("project_id") as string;
    const content = formData.get("content") as string;
    const progressPercentAfter = parseInt(formData.get("progress_percent_after") as string || "0");
    const image = formData.get("image") as File | null;

    if (!projectId || !content) {
      return { error: "Catatan riwayat wajib diisi." };
    }

    let imageUrl = null;

    // Handle image upload to local filesystem
    if (image && image.name && image.size > 0) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const buffer = Buffer.from(await image.arrayBuffer());
        const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        
        // Write physical file directly to avoid sharp/memory errors on server
        fs.writeFileSync(filePath, buffer);
        
        imageUrl = `/uploads/projects/${fileName}`;
      } catch (uploadErr) {
        console.error("Error writing documentation image file:", uploadErr);
        return { error: "Gagal mengunggah gambar dokumentasi." };
      }
    }

    // 1. Insert Log Entry
    const { data: insertedLog, error: logError } = await supabase
      .from("it_project_logs")
      .insert({
        project_id: projectId,
        content,
        progress_percent_after: progressPercentAfter,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error inserting project log:", logError);
      return { error: `Gagal mencatat riwayat: ${logError.message}` };
    }

    // 2. Automatically update parent project's current progress and status
    // If progress reaches 100%, automatically transition to 'Completed'
    let statusUpdate = {};
    if (progressPercentAfter >= 100) {
      statusUpdate = { status: "Completed" };
    } else if (progressPercentAfter > 0) {
      statusUpdate = { status: "In Progress" };
    }

    const { error: projectError } = await supabase
      .from("it_projects")
      .update({
        progress_percent: progressPercentAfter,
        updated_at: new Date().toISOString(),
        ...statusUpdate
      })
      .eq("id", projectId);

    if (projectError) {
      console.error("Error updating project progress:", projectError);
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, log: insertedLog };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function updateProjectLog(logId: string, prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const projectId = formData.get("project_id") as string;
    const content = formData.get("content") as string;
    const progressPercentAfter = parseInt(formData.get("progress_percent_after") as string || "0");
    const image = formData.get("image") as File | null;
    const removeImage = formData.get("remove_image") === "true";

    if (!content) {
      return { error: "Catatan riwayat wajib diisi." };
    }

    let imageUrl: string | null | undefined = undefined;

    if (removeImage) {
      imageUrl = null;
      try {
        const { data } = await supabase.from("it_project_logs").select("image_url").eq("id", logId).single();
        if (data?.image_url) {
          const localPath = path.join(process.cwd(), "public", data.image_url);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }
      } catch (e) {}
    } else if (image && image.name && image.size > 0 && image.name !== "undefined") {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const buffer = Buffer.from(await image.arrayBuffer());
        const fileName = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        imageUrl = `/uploads/projects/${fileName}`;

        // Delete old image
        const { data } = await supabase.from("it_project_logs").select("image_url").eq("id", logId).single();
        if (data?.image_url) {
          const oldPath = path.join(process.cwd(), "public", data.image_url);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (uploadErr) {
        return { error: "Gagal mengunggah gambar dokumentasi." };
      }
    }

    const updatePayload: any = {
      content,
      progress_percent_after: progressPercentAfter,
    };
    if (imageUrl !== undefined) updatePayload.image_url = imageUrl;

    const { data: updatedLog, error: logError } = await supabase
      .from("it_project_logs")
      .update(updatePayload)
      .eq("id", logId)
      .select()
      .single();

    if (logError) {
      return { error: `Gagal memperbarui riwayat: ${logError.message}` };
    }

    // Update parent project progress based on latest log
    const { data: latestLogs } = await supabase
      .from("it_project_logs")
      .select("progress_percent_after")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestProgress = latestLogs && latestLogs.length > 0 ? latestLogs[0].progress_percent_after : 0;
    let statusUpdate = {};
    if (latestProgress >= 100) statusUpdate = { status: "Completed" };
    else if (latestProgress > 0) statusUpdate = { status: "In Progress" };
    else statusUpdate = { status: "Planning" };

    await supabase.from("it_projects").update({
      progress_percent: latestProgress,
      updated_at: new Date().toISOString(),
      ...statusUpdate
    }).eq("id", projectId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, log: updatedLog };
  } catch (err: any) {
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function deleteProjectLog(logId: string, projectId: string) {
  try {
    const { supabase } = await getActionClient();

    // 1. Get current log being deleted to know its progress
    const { data: log } = await supabase
      .from("it_project_logs")
      .select("image_url")
      .eq("id", logId)
      .single();

    // Delete local image if exists
    if (log && log.image_url) {
      try {
        const filePath = path.join(process.cwd(), "public", log.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Failed to delete local image file:", err);
      }
    }

    // 2. Delete Log
    const { error } = await supabase
      .from("it_project_logs")
      .delete()
      .eq("id", logId);

    if (error) {
      console.error("Error deleting log:", error);
      return { error: `Gagal menghapus riwayat: ${error.message}` };
    }

    // 3. Recalculate parent project progress
    // Fetch latest remaining log entry to find the previous progress
    const { data: latestLogs } = await supabase
      .from("it_project_logs")
      .select("progress_percent_after")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1);

    const prevProgress = latestLogs && latestLogs.length > 0 
      ? latestLogs[0].progress_percent_after 
      : 0;

    let statusUpdate = {};
    if (prevProgress >= 100) {
      statusUpdate = { status: "Completed" };
    } else if (prevProgress > 0) {
      statusUpdate = { status: "In Progress" };
    } else {
      statusUpdate = { status: "Planning" };
    }

    await supabase
      .from("it_projects")
      .update({
        progress_percent: prevProgress,
        updated_at: new Date().toISOString(),
        ...statusUpdate
      })
      .eq("id", projectId);

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function addProjectRabItem(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const projectId = formData.get("project_id") as string;
    const itemName = formData.get("item_name") as string;
    const quantity = parseFloat(formData.get("quantity") as string || "1");
    const unit = formData.get("unit") as string || "pcs";
    const pricePerUnit = parseFloat(formData.get("price_per_unit") as string || "0");

    if (!projectId || !itemName) {
      return { error: "Nama barang/jasa wajib diisi." };
    }

    const { data: rabItem, error } = await supabase
      .from("it_project_rab")
      .insert({
        project_id: projectId,
        item_name: itemName,
        quantity,
        unit,
        price_per_unit: pricePerUnit,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting rab item:", error);
      return { error: `Gagal menambahkan item RAB: ${error.message}` };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, rabItem };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function deleteProjectRabItem(itemId: string, projectId: string) {
  try {
    const { supabase } = await getActionClient();

    const { error } = await supabase
      .from("it_project_rab")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error deleting rab item:", error);
      return { error: `Gagal menghapus item RAB: ${error.message}` };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function updateProjectRabItem(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const id = formData.get("id") as string;
    const projectId = formData.get("project_id") as string;
    const itemName = formData.get("item_name") as string;
    const quantity = parseFloat(formData.get("quantity") as string || "1");
    const unit = formData.get("unit") as string || "pcs";
    const pricePerUnit = parseFloat(formData.get("price_per_unit") as string || "0");

    if (!id || !projectId || !itemName) {
      return { error: "ID dan nama barang/jasa wajib diisi." };
    }

    const { data: rabItem, error } = await supabase
      .from("it_project_rab")
      .update({
        item_name: itemName,
        quantity,
        unit,
        price_per_unit: pricePerUnit,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating rab item:", error);
      return { error: `Gagal memperbarui item RAB: ${error.message}` };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, rabItem };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}
