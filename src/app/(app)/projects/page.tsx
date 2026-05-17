import { createClient } from "@/utils/supabase/server";
import ProjectsClient from "./projects-client";

export const metadata = {
  title: "Project Planning - IT Inventory",
  description: "Kelola perencanaan project, timeline, progres, dan dokumentasi aset IT secara terpusat.",
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  let projects: any[] = [];
  let dbTableMissing = false;

  try {
    const { data, error } = await supabase
      .from("it_projects")
      .select("*, it_project_rab(*)")
      .order("updated_at", { ascending: false });

    if (error) {
      // If table doesn't exist, pg throws code 42P01
      if (error.code === "42P01") {
        dbTableMissing = true;
      } else {
        throw error;
      }
    } else {
      projects = data || [];
    }
  } catch (err) {
    console.error("Error loading projects from database:", err);
    dbTableMissing = true;
  }

  return (
    <ProjectsClient 
      initialProjects={projects} 
      dbTableMissing={dbTableMissing} 
    />
  );
}
