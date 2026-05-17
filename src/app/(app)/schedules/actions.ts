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
  
  // Format start date as 1st of previous month to support both Normal and Cutoff (24th-23rd) periods
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const startDay = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  
  // Get last day of current month
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

export async function getPublicHolidays(year: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout fallback

    const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return (data || []) as { holiday_date: string; holiday_name: string; is_national_holiday: boolean }[];
  } catch (err) {
    console.error("Error fetching public holidays from API:", err);
    return [];
  }
}
