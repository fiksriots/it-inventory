"use client";

import React, { useState, useEffect } from "react";
import { getSchedules, saveSchedule, deleteSchedule, getPublicHolidays, Schedule } from "./actions";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Users, Check, Trash2, Info, X } from "lucide-react";

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface DayInfo {
  dayNum: number;
  month: number;
  year: number;
  dateStr: string;
  dayLabel: string;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName: string;
}

export default function SchedulesClient() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<string[]>(["Fikri", "Raffa"]);
  const [loading, setLoading] = useState(true);
  
  // Public holiday state
  const [publicHolidays, setPublicHolidays] = useState<{ holiday_date: string; holiday_name: string }[]>([]);

  // Cutoff mode state (Default to true as requested for Cutoff 24)
  const [isCutoffMode, setIsCutoffMode] = useState(true);

  // State for adding a new member
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  // State for active edit modal
  const [activeCell, setActiveCell] = useState<{
    memberName: string;
    dateStr: string;
    dayNum: number;
    month: number;
    year: number;
    currentStatus?: "M" | "C" | "DP" | "PH" | "L";
    currentNotes?: string;
  } | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<"M" | "C" | "DP" | "PH" | "L" | "DELETE">("M");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch public holidays for current and previous year (to support cross-year/cutoff boundaries)
  const fetchHolidays = async () => {
    try {
      const [currentYearHolidays, prevYearHolidays] = await Promise.all([
        getPublicHolidays(currentYear),
        getPublicHolidays(currentYear - 1)
      ]);
      setPublicHolidays([...prevYearHolidays, ...currentYearHolidays]);
    } catch (err) {
      console.error("Failed to fetch public holidays:", err);
    }
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await getSchedules(currentMonth, currentYear);
      setSchedules(data);

      // Collect unique member names and merge with existing ones
      const uniqueNames = Array.from(new Set([
        ...members,
        ...data.map(s => s.member_name)
      ])).filter(name => name.trim() !== "");
      
      setMembers(uniqueNames.length > 0 ? uniqueNames : ["Fikri", "Raffa"]);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal memuat jadwal." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentMonth, currentYear]);

  // Fetch public holidays when currentYear changes
  useEffect(() => {
    fetchHolidays();
  }, [currentYear]);

  // Days in month helper
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Generate the dynamic list of days depending on Normal or Cutoff mode
  const getPeriodDays = (): DayInfo[] => {
    const checkHoliday = (dateStr: string) => {
      const h = publicHolidays.find(item => item.holiday_date === dateStr);
      return {
        isHoliday: !!h,
        holidayName: h ? h.holiday_name : ""
      };
    };

    if (!isCutoffMode) {
      // Normal mode: 1st to last day of currentMonth
      const daysCount = getDaysInMonth(currentMonth, currentYear);
      return Array.from({ length: daysCount }, (_, i) => {
        const day = i + 1;
        const d = new Date(currentYear, currentMonth - 1, day);
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const { isHoliday, holidayName } = checkHoliday(dateStr);
        return {
          dayNum: day,
          month: currentMonth,
          year: currentYear,
          dateStr,
          dayLabel: dayNames[d.getDay()],
          isSunday: d.getDay() === 0,
          isHoliday,
          holidayName
        };
      });
    } else {
      // Cutoff mode: 24th of prevMonth to 23rd of currentMonth
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevDaysCount = getDaysInMonth(prevM, prevY);
      
      const list: DayInfo[] = [];
      
      // Part 1: 24th to end of prevMonth
      for (let day = 24; day <= prevDaysCount; day++) {
        const d = new Date(prevY, prevM - 1, day);
        const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const { isHoliday, holidayName } = checkHoliday(dateStr);
        list.push({
          dayNum: day,
          month: prevM,
          year: prevY,
          dateStr,
          dayLabel: dayNames[d.getDay()],
          isSunday: d.getDay() === 0,
          isHoliday,
          holidayName
        });
      }
      
      // Part 2: 1st to 23rd of currentMonth
      for (let day = 1; day <= 23; day++) {
        const d = new Date(currentYear, currentMonth - 1, day);
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const { isHoliday, holidayName } = checkHoliday(dateStr);
        list.push({
          dayNum: day,
          month: currentMonth,
          year: currentYear,
          dateStr,
          dayLabel: dayNames[d.getDay()],
          isSunday: d.getDay() === 0,
          isHoliday,
          holidayName
        });
      }
      
      return list;
    }
  };

  const periodDays = getPeriodDays();

  const getPeriodRangeLabel = () => {
    if (!isCutoffMode) {
      return `Periode: 1 s/d ${getDaysInMonth(currentMonth, currentYear)} ${monthNames[currentMonth - 1]}`;
    } else {
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      return `Periode Cutoff: 24 ${monthNames[prevM - 1]} s/d 23 ${monthNames[currentMonth - 1]}`;
    }
  };

  // Helper to get schedule for a member and specific date string
  const getDaySchedule = (memberName: string, dateStr: string) => {
    return schedules.find(s => s.member_name === memberName && s.schedule_date === dateStr);
  };

  // Calculate real-time stats (Total M, C, DP, PH, L) for a member in the current period
  const getMemberStats = (memberName: string) => {
    let mCount = 0;
    let cCount = 0;
    let dpCount = 0;
    let phCount = 0;
    let lCount = 0;

    periodDays.forEach(dayObj => {
      const s = getDaySchedule(memberName, dayObj.dateStr);
      const status = s ? s.status : "M"; // Default is "M"
      if (status === "M") mCount++;
      else if (status === "C") cCount++;
      else if (status === "DP") dpCount++;
      else if (status === "PH") phCount++;
      else if (status === "L") lCount++;
    });

    return { mCount, cCount, dpCount, phCount, lCount };
  };

  // Handle month/year navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Add new member to local list
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    if (members.includes(newMemberName.trim())) {
      setMessage({ type: "error", text: "Nama anggota tim sudah terdaftar." });
      return;
    }

    setMembers([...members, newMemberName.trim()]);
    setNewMemberName("");
    setShowAddMember(false);
    setMessage({ type: "success", text: `Anggota tim "${newMemberName}" ditambahkan ke board.` });
  };

  // Remove member from board
  const handleRemoveMemberFromBoard = (name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}" dari tampilan board bulan ini? (Data riwayat di database tetap tersimpan)`)) {
      setMembers(members.filter(m => m !== name));
    }
  };

  // Open edit dialog for a cell
  const handleCellClick = (memberName: string, dayObj: DayInfo) => {
    const existing = getDaySchedule(memberName, dayObj.dateStr);

    // If clicking a public holiday that has no database status yet, default it to "PH" in the modal
    const defaultStatus = existing ? existing.status : (dayObj.isHoliday ? "PH" : "M");
    const defaultNotes = existing ? (existing.notes || "") : (dayObj.isHoliday ? dayObj.holidayName : "");

    setActiveCell({
      memberName,
      dateStr: dayObj.dateStr,
      dayNum: dayObj.dayNum,
      month: dayObj.month,
      year: dayObj.year,
      currentStatus: existing?.status,
      currentNotes: existing?.notes || ""
    });

    setSelectedStatus(defaultStatus);
    setScheduleNotes(defaultNotes);
  };

  // Save or delete schedule
  const handleSaveSchedule = async () => {
    if (!activeCell) return;
    setSaving(true);
    setMessage(null);

    try {
      if (selectedStatus === "DELETE") {
        const res = await deleteSchedule(activeCell.memberName, activeCell.dateStr);
        if (res.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setMessage({ type: "success", text: "Jadwal berhasil dihapus." });
          fetchSchedules();
        }
      } else {
        const res = await saveSchedule(
          activeCell.memberName,
          activeCell.dateStr,
          selectedStatus,
          scheduleNotes
        );
        if (res.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setMessage({ type: "success", text: "Jadwal berhasil disimpan." });
          fetchSchedules();
        }
      }
      setActiveCell(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan sistem saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  // Badge rendering classes mapping
  const getStatusBadgeClass = (status: "M" | "C" | "DP" | "PH" | "L") => {
    switch (status) {
      case "M":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30";
      case "C":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30";
      case "DP":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30";
      case "PH":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30";
      case "L":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: "M" | "C" | "DP" | "PH" | "L") => {
    switch (status) {
      case "M": return "Masuk";
      case "C": return "Cuti";
      case "DP": return "Day Off";
      case "PH": return "Holiday";
      case "L": return "Libur";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Jadwal Kerja Tim IT</h1>
            <p className="text-sm text-text-muted">Kelola jadwal kehadiran, cuti, dispensasi (DP), dan libur nasional (PH) tim IT realtime.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Anggota
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{message.text}</p>
          </div>
          <button onClick={() => setMessage(null)} className="text-text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Member Form inline */}
      {showAddMember && (
        <form onSubmit={handleAddMember} className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3 max-w-md">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nama Anggota Tim IT (contoh: Raffa)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={() => setShowAddMember(false)}
            className="px-3 py-2 bg-background hover:bg-surface text-text-muted rounded-lg text-sm transition-colors border border-border"
          >
            Batal
          </button>
        </form>
      )}

      {/* Main Board Container */}
      <div className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Month Selector Header */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row justify-between items-center gap-4 bg-background/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Schedule Board IT</span>
            </div>
            
            {/* Cutoff / Normal Period Mode Toggle */}
            <div className="flex bg-background border border-border p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsCutoffMode(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !isCutoffMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Normal (1 - Akhir)
              </button>
              <button
                type="button"
                onClick={() => setIsCutoffMode(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isCutoffMode
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Cutoff (24 - 23)
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Period Range info display */}
            <div className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border text-text-muted font-medium">
              {getPeriodRangeLabel()}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-background hover:bg-surface border border-border text-text-muted hover:text-foreground transition-all"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-bold min-w-[150px] text-center">
                {monthNames[currentMonth - 1]} {currentYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-background hover:bg-surface border border-border text-text-muted hover:text-foreground transition-all"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Matrix Grid with Horizontal Scroll */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <p className="text-sm">Memuat data jadwal...</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left select-none table-fixed min-w-[1450px]">
              <thead>
                <tr className="bg-background/25 border-b border-border">
                  {/* Sticky First Column for Member Names */}
                  <th className="sticky left-0 z-10 w-48 bg-surface border-r border-border p-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Anggota Tim IT
                  </th>
                  
                  {/* Render Columns for Days */}
                  {periodDays.map(dayObj => {
                    return (
                      <th
                        key={dayObj.dateStr}
                        title={dayObj.isHoliday ? `${dayObj.holidayName} (Tanggal Merah)` : undefined}
                        className={`p-2 text-center text-[10px] font-bold border-r border-border min-w-[40px] max-w-[50px] transition-colors ${
                          dayObj.isHoliday
                            ? "text-amber-400 bg-amber-500/20 border-b-2 border-b-amber-500/50"
                            : dayObj.isSunday
                            ? "text-rose-400 bg-rose-500/5"
                            : "text-text-muted"
                        }`}
                      >
                        <div className="text-xs">{String(dayObj.dayNum).padStart(2, "0")}</div>
                        <div className="font-medium text-[8px] uppercase">{dayObj.dayLabel}</div>
                      </th>
                    );
                  })}

                  {/* Summary Columns */}
                  <th className="w-12 bg-background/50 border-r border-border p-2 text-center text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                    Tot M
                  </th>
                  <th className="w-12 bg-background/50 border-r border-border p-2 text-center text-[10px] font-black text-amber-400 uppercase tracking-wider">
                    Tot C
                  </th>
                  <th className="w-14 bg-background/50 border-r border-border p-2 text-center text-[10px] font-black text-blue-400 uppercase tracking-wider">
                    Tot DP
                  </th>
                  <th className="w-14 bg-background/50 border-r border-border p-2 text-center text-[10px] font-black text-rose-400 uppercase tracking-wider">
                    Tot PH
                  </th>
                  <th className="w-12 bg-background/55 p-2 text-center text-[10px] font-black text-purple-400 uppercase tracking-wider">
                    Tot L
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member} className="border-b border-border hover:bg-background/10 transition-colors">
                    {/* Sticky Name Column */}
                    <td className="sticky left-0 z-10 bg-surface border-r border-border p-3 flex items-center justify-between group">
                      <span className="font-semibold text-sm truncate">{member}</span>
                      <button
                        onClick={() => handleRemoveMemberFromBoard(member)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                        title={`Hapus ${member} dari board`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Render status cells for each day */}
                    {periodDays.map(dayObj => {
                      const s = getDaySchedule(member, dayObj.dateStr);
                      
                      // Dynamic default status: If it is a Public Holiday API date, default it visually to "PH" (Holiday) instead of "M"!
                      const displayStatus = s ? s.status : (dayObj.isHoliday ? "PH" : "M");
                      const displayNotes = s ? s.notes : (dayObj.isHoliday ? dayObj.holidayName : "");
                      const isDefault = !s;

                      return (
                        <td
                          key={dayObj.dateStr}
                          onClick={() => handleCellClick(member, dayObj)}
                          className={`p-1.5 text-center border-r border-border align-middle cursor-pointer transition-all hover:bg-background ${
                            dayObj.isHoliday
                              ? "bg-amber-500/5 hover:bg-amber-500/10"
                              : dayObj.isSunday
                              ? "bg-rose-500/5 hover:bg-rose-500/10"
                              : ""
                          }`}
                        >
                          <div className="w-full h-8 flex items-center justify-center">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm ${getStatusBadgeClass(
                                displayStatus
                              )} ${isDefault ? "opacity-75 border-dashed" : ""}`}
                              title={
                                isDefault
                                  ? (dayObj.isHoliday ? `Default: ${dayObj.holidayName} (Tanggal Merah)` : "Default: Masuk kerja")
                                  : displayNotes
                                  ? `${getStatusLabel(displayStatus)}: ${displayNotes}`
                                  : getStatusLabel(displayStatus)
                              }
                            >
                              {displayStatus}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Render live real-time stats columns */}
                    {(() => {
                      const stats = getMemberStats(member);
                      return (
                        <>
                          <td className="p-2 border-r border-border text-center align-middle font-black text-xs text-emerald-400 bg-emerald-500/5">
                            {stats.mCount}
                          </td>
                          <td className="p-2 border-r border-border text-center align-middle font-black text-xs text-amber-400 bg-amber-500/5">
                            {stats.cCount}
                          </td>
                          <td className="p-2 border-r border-border text-center align-middle font-black text-xs text-blue-400 bg-blue-500/5">
                            {stats.dpCount}
                          </td>
                          <td className="p-2 border-r border-border text-center align-middle font-black text-xs text-rose-400 bg-rose-500/5" title="Total Hari PH dalam cutoff ini">
                            {stats.phCount}
                          </td>
                          <td className="p-2 text-center align-middle font-black text-xs text-purple-400 bg-purple-500/5" title="Total Libur dalam cutoff ini">
                            {stats.lCount}
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend Footer */}
        <div className="p-4 border-t border-border bg-background/30 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-extrabold text-[10px]">M</span>
            <span className="text-text-muted">Masuk (Work/Attend)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold text-[10px]">C</span>
            <span className="text-text-muted">Cuti (Leave)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-extrabold text-[10px]">DP</span>
            <span className="text-text-muted">Day Off / Libur Pengganti</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-extrabold text-[10px]">PH</span>
            <span className="text-text-muted">Public Holiday / Libur Nasional (Selain Minggu)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-extrabold text-[10px]">L</span>
            <span className="text-text-muted">Libur (Reguler/Biasa)</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-[10px] text-amber-400/80 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse mr-1"></span>
            <span>Kolom Tanggal Kuning Emas menandakan Tanggal Merah Hari Besar Nasional otomatis (API)</span>
          </div>
        </div>
      </div>

      {/* Edit Cell Modal */}
      {activeCell && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-bold text-base">Atur Jadwal Kerja</h3>
                <p className="text-xs text-text-muted">
                  {activeCell.memberName} — {activeCell.dayNum} {monthNames[activeCell.month - 1]} {activeCell.year}
                </p>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="p-1 rounded-lg text-text-muted hover:text-foreground hover:bg-background transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase">Pilih Status Kehadiran</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Status M */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("M")}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedStatus === "M"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold ring-1 ring-emerald-500/20"
                        : "border-border bg-background hover:bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-sm font-black">M</span>
                    <span className="text-[10px]">Masuk Kerja</span>
                  </button>

                  {/* Status C */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("C")}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedStatus === "C"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 font-extrabold ring-1 ring-amber-500/20"
                        : "border-border bg-background hover:bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-sm font-black">C</span>
                    <span className="text-[10px]">Cuti Bersama/Pribadi</span>
                  </button>

                  {/* Status DP */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("DP")}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedStatus === "DP"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400 font-extrabold ring-1 ring-blue-500/20"
                        : "border-border bg-background hover:bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-sm font-black">DP</span>
                    <span className="text-[10px]">Day Off / Pengganti</span>
                  </button>

                  {/* Status PH */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("PH")}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      selectedStatus === "PH"
                        ? "bg-rose-500/20 border-rose-500 text-rose-400 font-extrabold ring-1 ring-rose-500/20"
                        : "border-border bg-background hover:bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-sm font-black">PH</span>
                    <span className="text-[10px]">Public Holiday</span>
                  </button>

                  {/* Status L */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("L")}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all col-span-2 sm:col-span-1 ${
                      selectedStatus === "L"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400 font-extrabold ring-1 ring-purple-500/20"
                        : "border-border bg-background hover:bg-surface text-text-muted"
                    }`}
                  >
                    <span className="text-sm font-black">L</span>
                    <span className="text-[10px]">Libur (Reguler)</span>
                  </button>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Cuti Tahunan, PH Waisak, Dinas Luar (opsional)"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              {/* Delete Existing option */}
              {activeCell.currentStatus && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("DELETE")}
                    className={`w-full py-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                      selectedStatus === "DELETE"
                        ? "bg-rose-500/10 border-rose-500 text-rose-400"
                        : "border-border text-rose-400/80 hover:bg-rose-500/5 hover:text-rose-400"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Jadwal Tanggal Ini
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-background/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="px-4 py-2 text-sm text-text-muted hover:text-foreground bg-background hover:bg-surface border border-border rounded-lg transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary-hover rounded-lg transition-all font-medium flex items-center gap-1.5"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
