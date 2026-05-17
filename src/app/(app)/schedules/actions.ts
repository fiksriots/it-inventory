"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface Schedule {
  id: string;
  member_name: string;
  schedule_date: string;
  status: "M" | "C" | "DP" | "PH";
  notes: string | null;
  created_at: string;
}

export async function getSchedules(month: number, year: number) {
  const supabase = await createClient();
  
  // Format start and end date for filtering
  const startDay = `${year}-${String(month).padStart(2, "0")}-01`;
  // Get last day of month
  const lastDayVal = new Date(year, month, 0).getDate();
  const endDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDayVal).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("it_schedules")
    .select("*")
    .gte("schedule_date", startDay)
    .lte("schedule_date", endDay);

  if (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }

  return (data || []) as Schedule[];
}

export async function saveSchedule(
  memberName: string,
  scheduleDate: string,
  status: "M" | "C" | "DP" | "PH",
  notes?: string
) {
  if (!memberName || !scheduleDate || !status) {
    return { error: "Semua data wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("it_schedules")
    .upsert(
      {
        member_name: memberName,
        schedule_date: scheduleDate,
        status,
        notes: notes || null,
      },
      { onConflict: "member_name,schedule_date" }
    );

  if (error) {
    console.error("Error saving schedule:", error);
    return { error: `Gagal menyimpan jadwal: ${error.message}` };
  }

  revalidatePath("/schedules");
  return { success: true };
}

export async function deleteSchedule(memberName: string, scheduleDate: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("it_schedules")
    .delete()
    .eq("member_name", memberName)
    .eq("schedule_date", scheduleDate);

  if (error) {
    console.error("Error deleting schedule:", error);
    return { error: `Gagal menghapus jadwal: ${error.message}` };
  }

  revalidatePath("/schedules");
  return { success: true };
}
