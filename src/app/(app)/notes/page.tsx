import { createClient } from "@/utils/supabase/server";
import NotesClient from "./notes-client";

export const metadata = {
  title: "Catatan IT - OpsFlow IT",
  description: "Catatan, memo, sandi, dan pengingat cepat untuk tim IT Support.",
};

export default async function NotesPage() {
  const supabase = await createClient();

  let notes: any[] = [];
  let dbTableMissing = false;

  try {
    const { data, error } = await supabase
      .from("it_notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        dbTableMissing = true;
      } else {
        throw error;
      }
    } else {
      notes = data || [];
    }
  } catch (err) {
    console.error("Error loading IT notes:", err);
    dbTableMissing = true;
  }

  return (
    <NotesClient 
      initialNotes={notes} 
      dbTableMissing={dbTableMissing} 
    />
  );
}
