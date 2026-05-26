"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function getActionClient() {
  const supabase = await createClient();
  return { supabase };
}

export async function createNote(prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const title = (formData.get("title") as string) || "";
    const content = (formData.get("content") as string) || "";
    const color = (formData.get("color") as string) || "default";
    const isPinned = formData.get("is_pinned") === "true";

    if (!title.trim() && !content.trim()) {
      return { error: "Judul atau isi catatan wajib diisi!" };
    }

    const { data: note, error } = await supabase
      .from("it_notes")
      .insert({
        title: title.trim(),
        content: content.trim(),
        color,
        is_pinned: isPinned,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      return { error: `Gagal menyimpan catatan: ${error.message}` };
    }

    revalidatePath("/notes");
    return { success: true, note };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function updateNote(id: string, prevState: any, formData: FormData) {
  try {
    const { supabase } = await getActionClient();

    const title = (formData.get("title") as string) || "";
    const content = (formData.get("content") as string) || "";
    const color = (formData.get("color") as string) || "default";
    const isPinned = formData.get("is_pinned") === "true";

    if (!title.trim() && !content.trim()) {
      return { error: "Judul atau isi catatan wajib diisi!" };
    }

    const { data: note, error } = await supabase
      .from("it_notes")
      .update({
        title: title.trim(),
        content: content.trim(),
        color,
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating note:", error);
      return { error: `Gagal memperbarui catatan: ${error.message}` };
    }

    revalidatePath("/notes");
    return { success: true, note };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function togglePinNote(id: string, isPinned: boolean) {
  try {
    const { supabase } = await getActionClient();

    const { error } = await supabase
      .from("it_notes")
      .update({ is_pinned: isPinned })
      .eq("id", id);

    if (error) {
      console.error("Error toggling pin note:", error);
      return { error: `Gagal mengubah status pin: ${error.message}` };
    }

    revalidatePath("/notes");
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function updateNoteColor(id: string, color: string) {
  try {
    const { supabase } = await getActionClient();

    const { error } = await supabase
      .from("it_notes")
      .update({ color })
      .eq("id", id);

    if (error) {
      console.error("Error updating note color:", error);
      return { error: `Gagal mengubah warna: ${error.message}` };
    }

    revalidatePath("/notes");
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}

export async function deleteNote(id: string) {
  try {
    const { supabase } = await getActionClient();

    const { error } = await supabase
      .from("it_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
      return { error: `Gagal menghapus catatan: ${error.message}` };
    }

    revalidatePath("/notes");
    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { error: "Terjadi kesalahan sistem internal." };
  }
}
