"use client";

import React, { useState, useEffect } from "react";
import { getSchedules, saveSchedule, deleteSchedule, getPublicHolidays, Schedule } from "./actions";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Users, Check, Trash2, Info, X, Printer } from "lucide-react";

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
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeNotes, setOvertimeNotes] = useState("");
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
    let totalOvertimeHours = 0;

    periodDays.forEach(dayObj => {
      const s = getDaySchedule(memberName, dayObj.dateStr);
      const status = s ? s.status : (dayObj.isHoliday ? "PH" : "M"); // Match visual default
      if (status === "M") mCount++;
      else if (status === "C") cCount++;
      else if (status === "DP") dpCount++;
      else if (status === "PH") phCount++;
      else if (status === "L") lCount++;

      if (s && s.overtime_hours) {
        totalOvertimeHours += Number(s.overtime_hours);
      }
    });

    return { mCount, cCount, dpCount, phCount, lCount, totalOvertimeHours };
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

  const calculateOvertime = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
    
    let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // night shift
    }
    
    const standardMinutes = 9 * 60; // 8 hours work + 1 hour break
    if (diffMinutes > standardMinutes) {
      return Math.round(((diffMinutes - standardMinutes) / 60) * 10) / 10;
    }
    return 0;
  };

  const handleCheckInChange = (val: string) => {
    setCheckInTime(val);
    const calculated = calculateOvertime(val, checkOutTime);
    setOvertimeHours(calculated);
  };

  const handleCheckOutChange = (val: string) => {
    setCheckOutTime(val);
    const calculated = calculateOvertime(checkInTime, val);
    setOvertimeHours(calculated);
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
    setCheckInTime(existing?.check_in_time || "");
    setCheckOutTime(existing?.check_out_time || "");
    setOvertimeHours(existing?.overtime_hours || 0);
    setOvertimeNotes(existing?.overtime_notes || "");
  };

  // Save or delete schedule
  const handleSaveSchedule = async () => {
    if (!activeCell) return;
    setSaving(true);
    setMessage(null);

    try {
      // Validasi Kuota Libur (L)
      if (selectedStatus === "L" && activeCell.currentStatus !== "L") {
        const totalSundays = periodDays.filter(d => d.isSunday).length;
        const currentStats = getMemberStats(activeCell.memberName);
        if (currentStats.lCount >= totalSundays) {
          setMessage({ type: "error", text: `Maksimal kuota Libur (L) adalah ${totalSundays} hari (Sesuai jumlah hari Minggu pada periode ini).` });
          setSaving(false);
          return;
        }
      }

      // Validasi Kuota Cuti (C)
      if (selectedStatus === "C" && activeCell.currentStatus !== "C") {
        const currentStats = getMemberStats(activeCell.memberName);
        if (currentStats.cCount >= 1) {
          setMessage({ type: "error", text: `Maksimal kuota Cuti (C) hanya diperbolehkan 1 hari dalam 1 periode.` });
          setSaving(false);
          return;
        }
      }

      if (selectedStatus === "DELETE") {
        const res = await deleteSchedule(activeCell.memberName, activeCell.dateStr);
        if (res.error) {
          setMessage({ type: "error", text: res.error });
        } else {
          setMessage({ type: "success", text: "Jadwal berhasil dihapus." });
          fetchSchedules();
        }
      } else {
        const isWorkingStatus = selectedStatus === "M" || selectedStatus === "DP" || selectedStatus === "PH";
        const res = await saveSchedule(
          activeCell.memberName,
          activeCell.dateStr,
          selectedStatus,
          scheduleNotes,
          isWorkingStatus ? (checkInTime || null) : null,
          isWorkingStatus ? (checkOutTime || null) : null,
          isWorkingStatus ? overtimeHours : 0,
          isWorkingStatus ? (overtimeNotes || null) : null
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

  const getPrintTitle = () => {
    if (!isCutoffMode) {
      return `SCHEDULE IT KENPARK ${monthNames[currentMonth - 1].toUpperCase()} ${currentYear}`;
    } else {
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      return `SCHEDULE IT KENPARK ${monthNames[prevM - 1].toUpperCase()} - ${monthNames[currentMonth - 1].toUpperCase()} ${currentYear}`;
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: A4 landscape !important; margin: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .max-w-7xl { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      
      {/* Interactive UI (Hidden on Print) */}
      <div className="space-y-6 print:hidden">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-border no-print">
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
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
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
      <div id="printable-schedule" className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Month Selector Header */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row justify-between items-center gap-4 bg-background/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Schedule Board IT</span>
            </div>
            
            {/* Cutoff / Normal Period Mode Toggle */}
            <div className="flex bg-background border border-border p-1 rounded-lg no-print">
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
            <div className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border text-text-muted font-medium print:border-none print:bg-transparent print:text-black">
              {getPeriodRangeLabel()}
            </div>

            <div className="flex items-center gap-3 no-print">
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
            <table className="w-full border-collapse text-left select-none table-fixed">
              <thead>
                <tr className="bg-background/25 border-b border-border">
                  {/* Sticky First Column for Member Names */}
                  <th className="sticky left-0 z-10 w-32 sm:w-40 bg-surface border-r border-border p-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Anggota Tim IT
                  </th>
                  
                  {/* Render Columns for Days */}
                  {periodDays.map(dayObj => {
                    return (
                      <th
                        key={dayObj.dateStr}
                        title={dayObj.isHoliday ? `${dayObj.holidayName} (Tanggal Merah)` : undefined}
                        className={`p-1 sm:p-2 text-center text-[10px] font-bold border-r border-border transition-colors ${
                          dayObj.isHoliday
                            ? "text-amber-400 bg-amber-500/20 border-b-2 border-b-amber-500/50"
                            : dayObj.isSunday
                            ? "text-rose-400 bg-rose-500/5"
                            : "text-text-muted"
                        }`}
                      >
                        <div className="text-xs">{String(dayObj.dayNum).padStart(2, "0")}</div>
                        <div className="font-medium text-[8px] uppercase hidden sm:block">{dayObj.dayLabel}</div>
                      </th>
                    );
                  })}

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
                        className="lg:opacity-0 lg:group-hover:opacity-100 opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
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
                          className={`p-1 sm:p-1.5 text-center border-r border-border align-middle cursor-pointer transition-all hover:bg-background ${
                            dayObj.isHoliday
                              ? "bg-amber-500/5 hover:bg-amber-500/10"
                              : dayObj.isSunday
                              ? "bg-rose-500/5 hover:bg-rose-500/10"
                              : ""
                          }`}
                        >
                          <div className="w-full h-7 sm:h-8 flex items-center justify-center relative">
                            <span
                              className={`w-7 sm:w-8 h-7 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-extrabold shadow-sm ${getStatusBadgeClass(
                                displayStatus
                              )} ${isDefault ? "opacity-75 border-dashed" : ""}`}
                              title={
                                isDefault
                                  ? (dayObj.isHoliday ? `Default: ${dayObj.holidayName} (Tanggal Merah)` : "Default: Masuk kerja")
                                  : `${getStatusLabel(displayStatus)}${
                                      s.check_in_time && s.check_out_time ? ` (${s.check_in_time} - ${s.check_out_time})` : ""
                                    }${
                                      s.overtime_hours ? `\nLembur: ${s.overtime_hours} Jam (${s.overtime_notes || "-"})` : ""
                                    }${displayNotes ? `\nCatatan: ${displayNotes}` : ""}`
                              }
                            >
                              {displayStatus}
                            </span>
                            {s && s.overtime_hours && s.overtime_hours > 0 ? (
                              <span 
                                className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-amber-500 rounded text-[7px] font-black text-black leading-none ring-1 ring-background"
                                title={`Lembur: ${s.overtime_hours} Jam\nKet: ${s.overtime_notes || '-'}`}
                              >
                                +{s.overtime_hours}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
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

        {/* Summary (Rekapitulasi) */}
        <div className="p-4 border-t border-border bg-surface">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Rekapitulasi Kehadiran
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {members.map(member => {
              const stats = getMemberStats(member);
              return (
                <div key={`summary-${member}`} className="flex flex-col bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-sm mb-3 pb-2 border-b border-border flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">{member.charAt(0)}</div>
                    {member}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center">
                    <div className="flex flex-col items-center p-1 rounded-lg hover:bg-emerald-500/5 transition-colors">
                      <span className="text-[10px] text-text-muted font-bold uppercase mb-1">Tot M</span>
                      <span className="text-sm font-black text-emerald-500">{stats.mCount}</span>
                    </div>
                    <div className="flex flex-col items-center p-1 rounded-lg hover:bg-amber-500/5 transition-colors">
                      <span className="text-[10px] text-text-muted font-bold uppercase mb-1">Tot C</span>
                      <span className="text-sm font-black text-amber-500">{stats.cCount}</span>
                    </div>
                    <div className="flex flex-col items-center p-1 rounded-lg hover:bg-blue-500/5 transition-colors">
                      <span className="text-[10px] text-text-muted font-bold uppercase mb-1">Tot DP</span>
                      <span className="text-sm font-black text-blue-500">{stats.dpCount}</span>
                    </div>
                    <div className="flex flex-col items-center p-1 rounded-lg hover:bg-rose-500/5 transition-colors">
                      <span className="text-[10px] text-text-muted font-bold uppercase mb-1">Tot PH</span>
                      <span className="text-sm font-black text-rose-500">{stats.phCount}</span>
                    </div>
                    <div className="flex flex-col items-center p-1 rounded-lg hover:bg-purple-500/5 transition-colors">
                      <span className="text-[10px] text-text-muted font-bold uppercase mb-1">Tot L</span>
                      <span className="text-sm font-black text-purple-500">{stats.lCount}</span>
                    </div>
                    
                    {/* Total Lembur Row */}
                    <div className="col-span-5 mt-2 pt-2 border-t border-border flex justify-between items-center px-2 text-xs font-semibold bg-amber-500/5 rounded-lg border border-amber-500/10 text-amber-400">
                      <span>Total Lembur:</span>
                      <span className="font-extrabold">{stats.totalOvertimeHours} Jam</span>
                    </div>
                  </div>
                </div>
              );
            })}
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

              {/* Jam Kerja & Lembur (Hanya muncul jika status adalah Masuk (M), Day Off (DP), atau Public Holiday (PH)) */}
              {(selectedStatus === "M" || selectedStatus === "DP" || selectedStatus === "PH") && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Jam Kerja & Lembur (Overtime)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted uppercase">Jam Masuk</label>
                      <input
                        type="time"
                        value={checkInTime}
                        onChange={(e) => handleCheckInChange(e.target.value)}
                        className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted uppercase">Jam Keluar</label>
                      <input
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => handleCheckOutChange(e.target.value)}
                        className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-semibold text-text-muted uppercase">Lembur (Jam)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={overtimeHours || ""}
                        onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                        className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm text-center font-bold text-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-semibold text-text-muted uppercase">Keterangan Lembur</label>
                      <input
                        type="text"
                        placeholder="Contoh: Overtime backup server"
                        value={overtimeNotes}
                        onChange={(e) => setOvertimeNotes(e.target.value)}
                        className="w-full bg-background border border-border focus:border-primary rounded-lg px-3 py-2 text-sm focus:outline-none"
                        disabled={!overtimeHours}
                      />
                    </div>
                  </div>
                </div>
              )}

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

      {/* PRINT ONLY LAYOUT */}
      <div 
        className="hidden print:block bg-white text-black font-sans"
        style={{ width: '100%', maxWidth: 'none', padding: '0 5mm' }}
      >
        <h2 className="text-center font-bold text-[16px] mb-6 uppercase tracking-wider">
          {getPrintTitle()}
        </h2>
        
        {/* Main Matrix */}
        <div className="flex justify-center">
          <table className="w-full max-w-full mx-auto border-collapse border border-black mb-8 text-center text-xs">
            <thead>
              {/* TGL Row */}
              <tr>
                <th className="border border-black bg-[#ffff00] p-1.5 w-[60px] align-middle">TGL</th>
                {periodDays.map(d => (
                  <th key={`print-tgl-${d.dateStr}`} className="border border-black bg-[#ffff00] font-normal p-1.5 align-middle">
                  {d.dayNum}
                </th>
              ))}
            </tr>
              {/* HARI Row */}
              <tr>
                <th className="border border-black bg-[#d9d9d9] p-1.5 align-middle">HARI</th>
                {periodDays.map(d => {
                  const shortDay = ["MG", "SN", "SL", "RB", "KM", "JM", "SB"][new Date(d.year, d.month - 1, d.dayNum).getDay()];
                  return (
                    <th key={`print-hari-${d.dateStr}`} className={`border border-black font-normal p-1.5 align-middle ${d.isSunday ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>
                    {shortDay}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <React.Fragment key={`print-row-${member}`}>
                  {/* JAM Row */}
                  <tr>
                    <td className="border border-black bg-[#a9d08e] uppercase font-bold p-1.5 align-middle">JAM</td>
                    {periodDays.map(d => {
                      const s = getDaySchedule(member, d.dateStr);
                      const jamText = s?.check_in_time && s?.check_out_time 
                        ? `${s.check_in_time}-${s.check_out_time}` 
                        : (member.toLowerCase() === 'fikri' ? '10:00-19:00' : '09:00-18:00');
                      return (
                        <td key={`print-jam-${member}-${d.dateStr}`} className="border border-black bg-[#a9d08e] font-normal p-1.5 align-middle text-[9px]">
                          {jamText}
                        </td>
                      );
                    })}
                  </tr>
                  {/* MEMBER Row */}
                  <tr>
                    <td className="border border-black uppercase font-bold bg-[#e2efda] p-1.5 align-middle">{member}</td>
                    {periodDays.map(d => {
                      const s = getDaySchedule(member, d.dateStr);
                      const status = s ? s.status : (d.isHoliday ? "PH" : "M");
                      let displayStatus = status === "C" ? "CT" : status;
                      let bgClass = "bg-white";
                      let textClass = "text-black";
                      if (status === "L" || (status === "PH" && !d.isSunday)) {
                        bgClass = "bg-red-600";
                        textClass = "text-white";
                      } else if (status === "C") {
                        bgClass = "bg-[#ffc000]";
                      }
                      return (
                        <td key={`print-stat-${member}-${d.dateStr}`} className={`border border-black font-bold p-1.5 align-middle relative ${bgClass} ${textClass}`}>
                          {displayStatus}
                          {s && s.overtime_hours && s.overtime_hours > 0 ? (
                            <div className="text-[8px] font-normal mt-0.5 text-amber-500 print:text-amber-600">
                              +{s.overtime_hours}h
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
              </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
}
