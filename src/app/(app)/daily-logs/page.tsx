import { createClient } from "@/utils/supabase/server";
import DailyLogsClient from "./daily-logs-client";

export const metadata = {
  title: "Laporan Kerja Harian - OpsFlow IT",
  description: "Catat dan dokumentasikan seluruh laporan aktivitas kerja IT Support harian.",
};

export default async function DailyLogsPage() {
  const supabase = await createClient();

  let logs: any[] = [];
  let itemsList: any[] = [];
  let locationsList: any[] = [];
  let dbTableMissing = false;

  try {
    // 1. Fetch standalone daily logs
    const { data: dailyData, error: dailyError } = await supabase
      .from("it_daily_logs")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // 2. Fetch project progress logs
    const { data: projectLogs, error: projectError } = await supabase
      .from("it_project_logs")
      .select("*, it_projects(name)")
      .order("created_at", { ascending: false });

    // 3. Fetch items and locations for material usage
    const { data: items } = await supabase.from("items").select("id, name, sku").order("name");
    const { data: locations } = await supabase.from("locations").select("id, name").order("name");
    itemsList = items || [];
    locationsList = locations || [];

    if (dailyError) {
      if (dailyError.code === "42P01") {
        dbTableMissing = true;
      } else {
        throw dailyError;
      }
    }

    const standaloneLogs = (dailyData || []).map((l: any) => ({
      ...l,
      type: "daily"
    }));

    const mappedProjectLogs = (projectLogs || []).map((l: any) => ({
      id: l.id,
      date: l.created_at ? l.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      activity_name: `Progres Project: ${l.it_projects?.name || "Proyek IT"}`,
      details: `${l.content}\n\n(Progres pengerjaan meningkat ke ${l.progress_percent_after}%)`,
      status: "Selesai",
      image_url: l.image_url,
      technician_name: l.technician_name || "Tim IT Support",
      created_at: l.created_at,
      type: "project",
      project_id: l.project_id
    }));

    // Merge and sort chronologically (date desc, time/created_at desc)
    const merged = [...standaloneLogs, ...mappedProjectLogs];
    merged.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;

      const timeA = new Date(a.created_at || a.date).getTime();
      const timeB = new Date(b.created_at || b.date).getTime();
      return timeB - timeA;
    });

    logs = merged;
  } catch (err) {
    console.error("Error loading daily logs:", err);
    dbTableMissing = true;
  }

  return (
    <DailyLogsClient 
      initialLogs={logs} 
      itemsList={itemsList}
      locationsList={locationsList}
      dbTableMissing={dbTableMissing} 
    />
  );
}
