import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ProjectDetailClient from "./project-detail-client";

export const metadata = {
  title: "Project Detail - OpsFlow IT",
  description: "Lihat detail riwayat pengerjaan project, progres pengerjaan, dan dokumentasi foto IT project.",
};

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Project Details
  const { data: project, error: projectError } = await supabase
    .from("it_projects")
    .select("*, it_project_rab(*)")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return notFound();
  }

  // 2. Fetch Project Logs (Progress History & Documentation)
  let logs: any[] = [];
  try {
    const { data } = await supabase
      .from("it_project_logs")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    
    logs = data || [];
  } catch (err) {
    console.error("Error fetching project logs:", err);
  }

  // 3. Fetch Linked Purchase Orders
  let initialPos: any[] = [];
  try {
    const { data } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .order("created_at", { ascending: false });
    
    if (data) {
      initialPos = data.filter((po: any) => po.notes?.includes(`[Project: ${id}]`));
    }
  } catch (err) {
    console.error("Error fetching project POs:", err);
  }

  return (
    <ProjectDetailClient 
      project={project} 
      initialLogs={logs} 
      initialPos={initialPos}
    />
  );
}
