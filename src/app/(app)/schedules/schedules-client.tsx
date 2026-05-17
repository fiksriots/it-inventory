"use client";

import React, { useState, useEffect } from "react";
import { getSchedules, saveSchedule, deleteSchedule, Schedule } from "./actions";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Users, Check, Trash2, Info, X } from "lucide-react";

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function SchedulesClient() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<string[]>(["Fikri", "Raffa"]);
  const [loading, setLoading] = useState(true);
  
  // State for adding a new member
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);

  // State for active edit modal
  const [activeCell, setActiveCell] = useState<{
    memberName: string;
    dateStr: string;
    dayNum: number;
    currentStatus?: "M" | "C" | "DP" | "PH";
    currentNotes?: string;
  } | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<"M" | "C" | "DP" | "PH" | "DELETE">("M");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch schedules when month or year changes
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

  // Days in selected month helper
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysCount = getDaysInMonth(currentMonth, currentYear);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  // Date formatting helpers
  const getDayName = (day: number) => {
    const d = new Date(currentYear, currentMonth - 1, day);
    return dayNames[d.getDay()];
  };

  const getIsSunday = (day: number) => {
    const d = new Date(currentYear, currentMonth - 1, day);
    return d.getDay() === 0;
  };

  const formatDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // Helper to get schedule for a member and day
  const getDaySchedule = (memberName: string, day: number) => {
    const dateStr = formatDateString(day);
    return schedules.find(s => s.member_name === memberName && s.schedule_date === dateStr);
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

  // Add new member to local state list
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

  // Remove member from local state list
  const handleRemoveMemberFromBoard = (name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}" dari tampilan board bulan ini? (Data riwayat di database tetap tersimpan)`)) {
      setMembers(members.filter(m => m !== name));
    }
  };

  // Open save dialog for a cell
  const handleCellClick = (memberName: string, day: number) => {
    const dateStr = formatDateString(day);
    const existing = getDaySchedule(memberName, day);

    setActiveCell({
      memberName,
      dateStr,
      dayNum: day,
      currentStatus: existing?.status,
      currentNotes: existing?.notes || ""
    });

    setSelectedStatus(existing ? existing.status : "M");
    setScheduleNotes(existing?.notes || "");
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
  const getStatusBadgeClass = (status: "M" | "C" | "DP" | "PH") => {
    switch (status) {
      case "M":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30";
      case "C":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30";
      case "DP":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30";
      case "PH":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: "M" | "C" | "DP" | "PH") => {
    switch (status) {
      case "M": return "Masuk";
      case "C": return "Cuti";
      case "DP": return "Day Off";
      case "PH": return "Holiday";
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
            <p className="text-sm text-text-muted">Kelola jadwal kehadiran, cuti, dan dispensasi tim IT realtime.</p>
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
      <div className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden">
        {/* Month Selector Header */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-background/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Schedule Board IT</span>
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

        {/* Matrix Grid with Horizontal Scroll */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <p className="text-sm">Memuat data jadwal...</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left select-none table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-background/25 border-b border-border">
                  {/* Sticky First Column for Member Names */}
                  <th className="sticky left-0 z-10 w-48 bg-surface border-r border-border p-3 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Anggota Tim IT
                  </th>
                  
                  {/* Render Columns for Days */}
                  {daysArray.map(day => {
                    const sun = getIsSunday(day);
                    const dayLabel = getDayName(day);
                    return (
                      <th
                        key={day}
                        className={`p-2 text-center text-[10px] font-bold border-r border-border min-w-[40px] max-w-[50px] ${
                          sun ? "text-rose-400 bg-rose-500/5" : "text-text-muted"
                        }`}
                      >
                        <div className="text-xs">{String(day).padStart(2, "0")}</div>
                        <div className="font-medium text-[8px] uppercase">{dayLabel}</div>
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
                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                        title={`Hapus ${member} dari board`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Render status cells for each day */}
                    {daysArray.map(day => {
                      const sun = getIsSunday(day);
                      const s = getDaySchedule(member, day);
                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(member, day)}
                          className={`p-1.5 text-center border-r border-border align-middle cursor-pointer transition-all hover:bg-background ${
                            sun ? "bg-rose-500/5 hover:bg-rose-500/10" : ""
                          }`}
                        >
                          <div className="w-full h-8 flex items-center justify-center">
                            {s ? (
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm ${getStatusBadgeClass(
                                  s.status
                                )}`}
                                title={s.notes ? `${getStatusLabel(s.status)}: ${s.notes}` : getStatusLabel(s.status)}
                              >
                                {s.status}
                              </span>
                            ) : (
                              <span className="text-[10px] text-text-muted/40 font-medium">-</span>
                            )}
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
                <p className="text-xs text-text-muted">{activeCell.memberName} — {activeCell.dayNum} {monthNames[currentMonth - 1]} {currentYear}</p>
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
