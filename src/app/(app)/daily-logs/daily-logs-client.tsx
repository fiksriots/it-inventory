"use client";

import { useState, useTransition, useRef } from "react";
import { 
  ClipboardList, Plus, Search, Users, Clock, Calendar, 
  Trash2, Image, FileImage, X, Loader2, CheckCircle2, 
  AlertTriangle, Maximize2, XCircle, Copy, Check, Filter, ExternalLink, Printer, Eye,
  Download, FileText, FileSpreadsheet, ChevronDown
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { createDailyLog, deleteDailyLog, updateDailyLog } from "./actions";

interface DailyLogsClientProps {
  initialLogs: any[];
  itemsList?: any[];
  locationsList?: any[];
  dbTableMissing: boolean;
}

export default function DailyLogsClient({ initialLogs, itemsList = [], locationsList = [], dbTableMissing }: DailyLogsClientProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // Lightbox State
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Form States
  const [activityName, setActivityName] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("Selesai");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [technicianName, setTechnicianName] = useState("Tim IT Support");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasMaterialUsage, setHasMaterialUsage] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sqlCode = `-- Jalankan SQL ini di Supabase SQL Editor Anda untuk mengaktifkan tabel Laporan Harian:

CREATE TABLE IF NOT EXISTS public.it_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_name TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Pending', 'Terhambat')),
    image_url TEXT,
    technician_name TEXT NOT NULL DEFAULT 'Tim IT Support',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select daily logs" ON public.it_daily_logs FOR SELECT USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can insert daily logs" ON public.it_daily_logs FOR INSERT WITH CHECK (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can update daily logs" ON public.it_daily_logs FOR UPDATE USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can delete daily logs" ON public.it_daily_logs FOR DELETE USING (((SELECT auth.role()) = 'authenticated'));`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setSqlCopied(true);
    toast("SQL berhasil disalin!", "success");
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast("Ukuran gambar maksimal 5MB!", "error");
        return;
      }
      setSelectedImage(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
    setEditingLog(null);
    setActivityName("");
    setDetails("");
    setStatus("Selesai");
    setDate(new Date().toISOString().split("T")[0]);
    setTechnicianName("Tim IT Support");
    clearImage();
    setRemoveImage(false);
    setHasMaterialUsage(false);
    setIsModalOpen(true);
  };

  const openEditModal = (log: any) => {
    setEditingLog(log);
    setActivityName(log.activity_name);
    setDetails(log.details);
    setStatus(log.status);
    setDate(log.date);
    setTechnicianName(log.technician_name);
    setSelectedImage(null);
    setImagePreview(log.image_url || null);
    setRemoveImage(false);
    setHasMaterialUsage(false);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) return toast("Judul kegiatan wajib diisi!", "error");
    if (!details.trim()) return toast("Rincian pekerjaan wajib diisi!", "error");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("activity_name", activityName);
      formData.append("details", details);
      formData.append("status", status);
      formData.append("date", date);
      formData.append("technician_name", technicianName);
      
      const formElement = e.target as HTMLFormElement;
      if (hasMaterialUsage) {
        const usedItemId = (formElement.elements.namedItem("used_item_id") as HTMLSelectElement)?.value;
        const usedQuantity = (formElement.elements.namedItem("used_quantity") as HTMLInputElement)?.value;
        const sourceLocationId = (formElement.elements.namedItem("source_location_id") as HTMLSelectElement)?.value;
        if (usedItemId && usedQuantity && sourceLocationId) {
          formData.append("used_item_id", usedItemId);
          formData.append("used_quantity", usedQuantity);
          formData.append("source_location_id", sourceLocationId);
        }
      }

      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      if (removeImage) {
        formData.append("remove_image", "true");
      }

      let res;
      if (editingLog) {
        res = await updateDailyLog(editingLog.id, null, formData);
      } else {
        res = await createDailyLog(null, formData);
      }

      if (res.error) {
        toast(res.error, "error");
      } else {
        toast(editingLog ? "Laporan harian berhasil diperbarui!" : "Laporan harian berhasil disimpan!", "success");
        setIsModalOpen(false);
        if (res.log) {
          if (editingLog) {
            setLogs(logs.map(l => l.id === res.log.id ? res.log : l));
          } else {
            setLogs([res.log, ...logs]);
          }
        }
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const logItem = logs.find(l => l.id === id);
    if (logItem?.type === "project") {
      toast("Laporan ini terhubung dengan Project Planning. Harap hapus langsung dari Detail Project.", "error");
      return;
    }

    // Defensive UUID Self-Healing Check
    if (id.includes(".") || id.length !== 36) {
      toast("Sinkronisasi laporan... Memuat ulang data.", "error");
      setLogs(logs.filter(l => l.id !== id));
      setTimeout(() => {
        window.location.reload();
      }, 600);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus laporan "${name}"? Bukti dokumentasi terkait akan terhapus permanen.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteDailyLog(id);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Laporan berhasil dihapus!", "success");
        setLogs(logs.filter(l => l.id !== id));
      }
    });
  };

  const formatDateFull = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.activity_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.technician_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "Semua" || l.status === selectedStatus;
    const matchesDate = !selectedDate || l.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const generateExportHtml = (isWord = false) => {
    // Group logs by date
    const groupedLogs: Record<string, any[]> = {};
    filteredLogs.forEach(log => {
      const date = log.date || "Tanpa Tanggal";
      if (!groupedLogs[date]) {
        groupedLogs[date] = [];
      }
      groupedLogs[date].push(log);
    });

    const dates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let htmlRows = '';
    let no = 1;

    dates.forEach(date => {
      const dayLogs = groupedLogs[date];
      const dateRowspan = dayLogs.length;

      const techRowspans = new Array(dayLogs.length).fill(1);
      for (let i = dayLogs.length - 1; i > 0; i--) {
        if (dayLogs[i].technician_name === dayLogs[i - 1].technician_name) {
          techRowspans[i - 1] += techRowspans[i];
          techRowspans[i] = 0;
        }
      }

      dayLogs.forEach((log, index) => {
        htmlRows += '<tr>';
        if (index === 0) {
          htmlRows += `<td rowspan="${dateRowspan}" style="text-align: center; vertical-align: middle; border: 1px solid #000; padding: 8px;">${no}</td>`;
          htmlRows += `<td rowspan="${dateRowspan}" style="text-align: center; vertical-align: middle; border: 1px solid #000; padding: 8px;">${date}</td>`;
        }
        if (techRowspans[index] > 0) {
          htmlRows += `<td rowspan="${techRowspans[index]}" style="text-align: center; vertical-align: middle; border: 1px solid #000; padding: 8px;">${log.technician_name || '-'}</td>`;
        }
        htmlRows += `<td style="text-align: center; border: 1px solid #000; padding: 8px;">${log.activity_name || '-'}</td>`;
        htmlRows += `<td style="text-align: center; border: 1px solid #000; padding: 8px;">${(log.details || "").replace(/\n/g, "<br>")}</td>`;
        htmlRows += `<td style="text-align: center; border: 1px solid #000; padding: 8px;">${log.status || '-'}</td>`;
        htmlRows += '</tr>';
      });
      no++;
    });

    // Add empty rows for aesthetics (like in the image)
    for(let i = 0; i < 4; i++) {
       htmlRows += `<tr>
          <td style="text-align: center; border: 1px solid #000; padding: 8px;">${no}</td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
       </tr>`;
       no++;
    }

    const dateStr = new Date().toLocaleDateString('id-ID');
    const total = filteredLogs.length;

    const commonStyles = `
      body { font-family: 'Arial', sans-serif; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; }
      h1 { text-align: center; text-decoration: underline; font-weight: bold; }
    `;

    if (isWord) {
      return `<html xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
          <meta charset="utf-8">
          <title>Laporan Harian IT</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <h1>Laporan Kerja Harian IT</h1>
          <br>
          <p><strong>Diekspor pada:</strong> ${dateStr}</p>
          <p><strong>Jumlah Laporan:</strong> ${total}</p>
          
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Tanggal</th>
                <th>Teknisi</th>
                <th>Aktifitas</th>
                <th>Detail /<br>Catatan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
        </body>
      </html>`;
    }

    return `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Laporan Harian IT</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>
        <style>${commonStyles}</style>
      </head>
      <body>
        <h1 colspan="6" style="text-align: center; text-decoration: underline; font-size: 24pt;">Laporan Kerja Harian IT</h1>
        <br>
        <table>
          <tr>
            <td colspan="2"><strong>Diekspor pada:</strong> ${dateStr}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Jumlah Laporan:</strong> ${total}</td>
          </tr>
        </table>
        
        <table border="1">
          <thead>
            <tr>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">No.</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Tanggal</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Teknisi</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Aktifitas</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Detail /<br>Catatan</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body>
    </html>`;
  };

  const exportToExcel = () => {
    const tableStr = generateExportHtml(false);
    
    const blob = new Blob([tableStr], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Harian_IT_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const exportToWord = () => {
    const docStr = generateExportHtml(true);

    const blob = new Blob(['\ufeff', docStr], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Harian_IT_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  if (dbTableMissing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-foreground">Tabel Laporan Harian IT Belum Diinisialisasi</h2>
          <p className="text-sm text-text-muted max-w-lg">
            Tabel basis data \`it_daily_logs\` belum terdeteksi. Silakan salin script SQL di bawah ini dan jalankan di **Supabase SQL Editor** Anda untuk mengaktifkan fitur pencatatan laporan harian.
          </p>

          <div className="w-full relative bg-[#0d1117] border border-border/60 rounded-xl overflow-hidden mt-2">
            <div className="flex justify-between items-center px-4 py-2 border-b border-border/40 bg-surface/50">
              <span className="text-xs text-text-muted font-mono font-semibold">20260517150000_create_it_daily_logs.sql</span>
              <button
                onClick={copySql}
                className="flex items-center gap-1.5 px-3 py-1 bg-surface hover:bg-background border border-border/80 rounded-lg text-xs font-bold text-text-muted hover:text-foreground transition-all"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {sqlCopied ? "Disalin!" : "Salin SQL"}
              </button>
            </div>
            <pre className="p-4 text-left text-xs font-mono overflow-x-auto text-emerald-400/90 leading-relaxed max-h-80 overflow-y-auto">
              <code>{sqlCode}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <style type="text/css">
        {`
          @media print {
            @page { margin: 0; }
            body { padding: 1.5cm; }
          }
        `}
      </style>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ClipboardList className="w-7 h-7" />
            </div>
            Laporan Kerja Harian IT
          </h1>
          <p className="text-sm text-text-muted mt-1 no-print">
            Catat agenda, perbaikan, instalasi, dan penanganan gangguan yang dilakukan oleh IT Support setiap harinya.
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-background border border-border text-text-muted hover:text-foreground font-bold rounded-xl transition-all active:scale-95 shrink-0 text-xs shadow-sm"
              title="Ekspor Laporan"
            >
              <Download className="w-4.5 h-4.5" />
              Ekspor Data
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-text-muted hover:text-foreground hover:bg-surface transition-colors border-b border-border"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-text-muted hover:text-foreground hover:bg-surface transition-colors border-b border-border"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Ekspor ke Excel
                </button>
                <button
                  onClick={exportToWord}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  Ekspor ke Word (Doc)
                </button>
              </div>
            )}
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0 text-xs"
          >
            <Plus className="w-4.5 h-4.5" />
            Buat Laporan
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["Semua", "Selesai", "Pending", "Terhambat"].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => setSelectedStatus(statusOption)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  selectedStatus === statusOption
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "bg-background border border-border text-text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {statusOption === "Semua" ? "Semua Status" : statusOption}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Date Quick Filter */}
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-44 pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors text-text-muted"
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground p-0.5 rounded-full hover:bg-surface"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Cari tugas, deskripsi, teknisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-xs placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Listing */}
      {filteredLogs.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-surface border border-border/40 shadow-sm print:hidden">
          <ClipboardList className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
          <p className="text-text-muted text-sm font-semibold">Tidak ada laporan harian yang ditemukan.</p>
          <p className="text-xs text-text-muted/65 mt-1">Buat laporan harian pertama Anda untuk mendokumentasikan kerja hari ini.</p>
        </div>
      ) : (
        <>
          <div className="space-y-5 pl-4 border-l-2 border-border/70 ml-2 py-2 print:hidden">
            {filteredLogs.map((log) => {
              const hasImage = !!log.image_url;
            return (
              <div key={log.id} className="relative group animate-in fade-in duration-300 print-break-inside-avoid mb-6">
                {/* Timeline dot */}
                <div className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-primary flex items-center justify-center shadow-sm group-hover:bg-primary transition-colors no-print">
                  <div className="w-1 h-1 bg-primary group-hover:bg-surface rounded-full transition-colors" />
                </div>

                <div className="space-y-1.5">
                  {/* Date Tag */}
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                    {formatDateFull(log.date)}
                  </span>

                  {/* Log Card Body */}
                  <div className="bg-surface border border-border hover:border-primary/30 rounded-xl p-3 sm:p-4 shadow-sm space-y-2.5 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                      <div>
                        {log.type === "project" ? (
                          <div 
                            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                            onClick={() => window.location.href = `/projects/${log.project_id}`}
                            title="Buka detail project"
                          >
                            <h3 className="font-extrabold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1">
                              {log.activity_name}
                              <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                            </h3>
                          </div>
                        ) : (
                          <h3 className="font-extrabold text-sm text-foreground">{log.activity_name}</h3>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-text-muted">
                          <Users className="w-3.5 h-3.5 text-text-muted/60" />
                          <span>Teknisi: <strong className="text-foreground">{log.technician_name}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          log.type === "project" 
                            ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {log.type === "project" ? "Project" : "Mandiri"}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          log.status === "Selesai" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                          log.status === "Pending" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                          "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        }`}>
                          {log.status}
                        </span>

                        {hasImage && (
                          <button
                            onClick={() => setSelectedDocImage(log.image_url)}
                            className="p-1.5 bg-background hover:bg-primary/10 text-text-muted/60 hover:text-primary rounded-lg border border-border hover:border-primary/20 transition-all active:scale-95 no-print"
                            title="Lihat Foto Dokumentasi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {log.type !== "project" && (
                          <>
                            <button
                              onClick={() => openEditModal(log)}
                              className="p-1.5 bg-background hover:bg-amber-500/10 text-text-muted/60 hover:text-amber-500 rounded-lg border border-border hover:border-amber-500/20 transition-all opacity-0 group-hover:opacity-100 active:scale-95 no-print"
                              title="Edit Laporan"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(log.id, log.activity_name)}
                              className="p-1.5 bg-background hover:bg-rose-500/10 text-text-muted/60 hover:text-rose-500 rounded-lg border border-border hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100 active:scale-95 no-print"
                              title="Hapus Laporan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Details content */}
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
                      {log.details}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Print-Only Table View */}
      <div className="hidden print:block w-full p-10">
        <h2 className="text-xl font-bold mb-4 text-center pb-2 border-b-2 border-black">Rekapan Laporan Kerja Harian IT</h2>
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-center w-12">No.</th>
                <th className="border border-black p-2 text-center w-24">Tanggal</th>
                <th className="border border-black p-2 text-center w-32">Teknisi</th>
                <th className="border border-black p-2 text-center w-48">Aktifitas</th>
                <th className="border border-black p-2 text-center">Detail /<br/>Catatan</th>
                <th className="border border-black p-2 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const groupedLogs: Record<string, any[]> = {};
                filteredLogs.forEach(log => {
                  const date = log.date || "Tanpa Tanggal";
                  if (!groupedLogs[date]) {
                    groupedLogs[date] = [];
                  }
                  groupedLogs[date].push(log);
                });

                const dates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                
                let no = 1;
                const rows: any[] = [];

                dates.forEach(date => {
                  const dayLogs = groupedLogs[date];
                  const dateRowspan = dayLogs.length;

                  const techRowspans = new Array(dayLogs.length).fill(1);
                  for (let i = dayLogs.length - 1; i > 0; i--) {
                    if (dayLogs[i].technician_name === dayLogs[i - 1].technician_name) {
                      techRowspans[i - 1] += techRowspans[i];
                      techRowspans[i] = 0;
                    }
                  }

                  dayLogs.forEach((log, index) => {
                    rows.push(
                      <tr key={log.id} className="print-break-inside-avoid">
                        {index === 0 && (
                          <>
                            <td className="border border-black p-2 align-middle text-center font-medium" rowSpan={dateRowspan}>{no}</td>
                            <td className="border border-black p-2 align-middle text-center font-medium" rowSpan={dateRowspan}>{date}</td>
                          </>
                        )}
                        {techRowspans[index] > 0 && (
                          <td className="border border-black p-2 align-middle text-center" rowSpan={techRowspans[index]}>{log.technician_name || '-'}</td>
                        )}
                        <td className="border border-black p-2 align-top text-center font-bold">{log.activity_name || '-'}</td>
                        <td className="border border-black p-2 align-top text-center whitespace-pre-line">{log.details || '-'}</td>
                        <td className="border border-black p-2 align-top text-center uppercase text-[10px] font-bold">{log.status || '-'}</td>
                      </tr>
                    );
                  });
                  no++;
                });

                for (let i = 0; i < 4; i++) {
                  rows.push(
                    <tr key={`empty-${i}`} className="print-break-inside-avoid">
                      <td className="border border-black p-2 align-middle text-center font-medium h-8">{no}</td>
                      <td className="border border-black p-2 align-middle text-center font-medium"></td>
                      <td className="border border-black p-2 align-top text-center"></td>
                      <td className="border border-black p-2 align-top text-center font-bold"></td>
                      <td className="border border-black p-2 align-top text-center whitespace-pre-line"></td>
                      <td className="border border-black p-2 align-top text-center uppercase text-[10px] font-bold"></td>
                    </tr>
                  );
                  no++;
                }

                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </>
      )}

      {/* Modal: New Activity Log */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {editingLog ? "Edit Laporan Kerja Harian" : "Buat Laporan Kerja Harian"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Tanggal Kerja <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nama Teknisi <span className="text-rose-500">*</span></label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="Tim IT Support">Tim IT Support</option>
                    <option value="Ahmad Dzakiyul Fikri">Fikri</option>
                    <option value="Raffa">Raffa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Judul Aktivitas / Gangguan <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Misal: Perbaikan Gangguan Koneksi Internet HRD"
                  required
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rincian Pekerjaan <span className="text-rose-500">*</span></label>
                <textarea
                  placeholder="Jelaskan secara mendetail apa saja yang dikerjakan... (Misal: Melakukan reboot router, crimping ulang kabel LAN RG45, testing ping, hasil koneksi kembali normal.)"
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Status Penyelesaian</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="Selesai">Selesai (Done)</option>
                  <option value="Pending">Pending (Dalam Antrean)</option>
                  <option value="Terhambat">Terhambat (Blocker)</option>
                </select>
              </div>

              {/* Material Usage Section */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5 tracking-wider">
                    <ClipboardList className="w-3.5 h-3.5" /> Ada Penggunaan Material/Barang?
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={hasMaterialUsage} onChange={() => setHasMaterialUsage(!hasMaterialUsage)} />
                    <div className="w-8 h-4 bg-border rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {hasMaterialUsage && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Pilih Barang</label>
                      <select name="used_item_id" required className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="">-- Barang --</option>
                        {itemsList.map((item: any) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Jumlah</label>
                      <input type="number" name="used_quantity" min="1" defaultValue="1" required className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Ambil Dari</label>
                      <select name="source_location_id" required className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none">
                        <option value="">-- Gudang --</option>
                        {locationsList.map((loc: any) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[9px] text-emerald-600/80 sm:col-span-3 italic">
                      *Stok akan otomatis terpotong saat laporan ini disimpan.
                    </p>
                  </div>
                )}
              </div>

              {/* Documentation Image */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-primary" />
                  Bukti Dokumentasi Pekerjaan (Opsional)
                </label>

                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer bg-background hover:bg-surface/50 transition-all group"
                  >
                    <FileImage className="w-8 h-8 text-text-muted/50 mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-xs font-bold text-text-muted">Klik untuk memilih gambar</p>
                    <p className="text-[9px] text-text-muted/65 mt-0.5">JPEG, PNG, WEBP (Maks 5MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-border overflow-hidden bg-background p-2 flex items-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview upload" 
                      className="w-12 h-12 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{selectedImage?.name}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{(selectedImage!.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors border border-rose-500/10 active:scale-95 animate-in"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-background border border-border text-text-muted font-bold rounded-xl text-xs transition-all hover:bg-surface active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs shadow-md shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : editingLog ? (
                    "Simpan Pembaruan"
                  ) : (
                    "Simpan Laporan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal Popup */}
      {selectedDocImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" 
          onClick={() => setSelectedDocImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedDocImage} 
              alt="Dokumentasi Full" 
              className="max-w-full max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain animate-in zoom-in-95 duration-200" 
            />
            <button 
              onClick={() => setSelectedDocImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
