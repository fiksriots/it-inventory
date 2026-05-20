"use client";

import { useState, useTransition, useRef } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Clock, Plus, Trash2, Image, FileImage, 
  X, Loader2, CheckCircle2, AlertTriangle, ChevronRight, Maximize2, FolderKanban, Coins,
  Printer, Download, ChevronDown, FileSpreadsheet, FileText
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { addProjectLog, deleteProjectLog, addProjectRabItem, deleteProjectRabItem } from "../actions";

interface ProjectDetailClientProps {
  project: any;
  initialLogs: any[];
}

export default function ProjectDetailClient({ project, initialLogs }: ProjectDetailClientProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [rabItems, setRabItems] = useState<any[]>(project.it_project_rab || []);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // New Log Form State
  const [content, setContent] = useState("");
  const [progressPercentAfter, setProgressPercentAfter] = useState(project.progress_percent);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // RAB Form States
  const [isRabModalOpen, setIsRabModalOpen] = useState(false);
  const [rabItemName, setRabItemName] = useState("");
  const [rabQuantity, setRabQuantity] = useState(1);
  const [rabUnit, setRabUnit] = useState("pcs");
  const [rabPricePerUnit, setRabPricePerUnit] = useState(0);
  
  // Image Lightbox State
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rabItemName.trim()) return toast("Nama barang/jasa wajib diisi!", "error");
    if (rabQuantity <= 0) return toast("Jumlah harus lebih besar dari 0!", "error");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("project_id", project.id);
      formData.append("item_name", rabItemName);
      formData.append("quantity", String(rabQuantity));
      formData.append("unit", rabUnit);
      formData.append("price_per_unit", String(rabPricePerUnit));

      const res = await addProjectRabItem(null, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Item RAB berhasil ditambahkan!", "success");
        setRabItemName("");
        setRabQuantity(1);
        setRabUnit("pcs");
        setRabPricePerUnit(0);
        setIsRabModalOpen(false);
        
        if (res.rabItem) {
          setRabItems([...rabItems, res.rabItem]);
        }
      }
    });
  };

  const handleDeleteRabItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${itemName}" dari RAB?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProjectRabItem(itemId, project.id);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Item RAB berhasil dihapus!", "success");
        setRabItems(rabItems.filter(item => item.id !== itemId));
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast("Ukuran gambar maksimal 5MB!", "error");
        return;
      }
      setSelectedImage(file);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast("Catatan riwayat wajib diisi!", "error");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("project_id", project.id);
      formData.append("content", content);
      formData.append("progress_percent_after", String(progressPercentAfter));
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const res = await addProjectLog(null, formData);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Catatan riwayat pengerjaan berhasil ditambahkan!", "success");
        setContent("");
        clearImage();
        
        // Store the returned log containing the real database-generated UUID
        if (res.log) {
          setLogs([res.log, ...logs]);
        }
        
        // Update parent project progress locally
        project.progress_percent = progressPercentAfter;
        if (progressPercentAfter >= 100) {
          project.status = "Completed";
        } else if (progressPercentAfter > 0) {
          project.status = "In Progress";
        }
      }
    });
  };

  const handleDeleteLog = async (logId: string) => {
    // Defensive check for stale temporary float IDs left from previous browser sessions before code was updated
    if (logId.includes(".") || logId.length !== 36) {
      toast("Sinkronisasi riwayat... Memuat ulang data terbaru.", "error");
      setLogs(logs.filter(l => l.id !== logId));
      setTimeout(() => {
        window.location.reload();
      }, 600);
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus catatan pengerjaan ini? Progres project akan disesuaikan kembali.")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProjectLog(logId, project.id);
      if (res.error) {
        toast(res.error, "error");
      } else {
        toast("Catatan riwayat berhasil dihapus!", "success");
        setLogs(logs.filter(l => l.id !== logId));
        
        // Recalculate parent progress locally
        const remainingLogs = logs.filter(l => l.id !== logId);
        const lastProgress = remainingLogs.length > 0 ? remainingLogs[0].progress_percent_after : 0;
        project.progress_percent = lastProgress;
        if (lastProgress >= 100) project.status = "Completed";
        else if (lastProgress > 0) project.status = "In Progress";
        else project.status = "Planning";
      }
    });
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const generateExportHtml = (isWord = false) => {
    // Group logs by date
    const groupedLogs: Record<string, any[]> = {};
    logs.forEach(log => {
      const date = formatDateShort(log.created_at);
      if (!groupedLogs[date]) {
        groupedLogs[date] = [];
      }
      groupedLogs[date].push(log);
    });

    const dates = Object.keys(groupedLogs);
    
    let htmlRows = '';
    let no = 1;

    dates.forEach(date => {
      const dayLogs = groupedLogs[date];
      const dateRowspan = dayLogs.length;

      dayLogs.forEach((log, index) => {
        htmlRows += '<tr>';
        if (index === 0) {
          htmlRows += `<td rowspan="${dateRowspan}" style="text-align: center; vertical-align: middle; border: 1px solid #000; padding: 8px;">${no}</td>`;
          htmlRows += `<td rowspan="${dateRowspan}" style="text-align: center; vertical-align: middle; border: 1px solid #000; padding: 8px;">${date}</td>`;
        }
        htmlRows += `<td style="text-align: center; border: 1px solid #000; padding: 8px;">${log.progress_percent_after}%</td>`;
        htmlRows += `<td style="text-align: left; border: 1px solid #000; padding: 8px;">${(log.content || "").replace(/\n/g, "<br>")}</td>`;
        htmlRows += '</tr>';
      });
      no++;
    });

    const dateStr = new Date().toLocaleDateString('id-ID');

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
          <title>Laporan Progres Project</title>
          <style>${commonStyles}</style>
        </head>
        <body>
          <h1>Laporan Progres Project</h1>
          <br>
          <p><strong>Nama Project:</strong> ${project.name}</p>
          <p><strong>Status:</strong> ${project.status}</p>
          <p><strong>Progres Saat Ini:</strong> ${project.progress_percent}%</p>
          <p><strong>Diekspor pada:</strong> ${dateStr}</p>
          
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Tanggal</th>
                <th>Progres</th>
                <th>Detail Pekerjaan</th>
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
        <x:Name>Laporan Project</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>
        <style>${commonStyles}</style>
      </head>
      <body>
        <h1 colspan="4" style="text-align: center; text-decoration: underline; font-size: 24pt;">Laporan Progres Project</h1>
        <br>
        <table>
          <tr><td colspan="2"><strong>Nama Project:</strong></td><td colspan="2">${project.name}</td></tr>
          <tr><td colspan="2"><strong>Status:</strong></td><td colspan="2">${project.status}</td></tr>
          <tr><td colspan="2"><strong>Progres Saat Ini:</strong></td><td colspan="2">${project.progress_percent}%</td></tr>
          <tr><td colspan="2"><strong>Diekspor pada:</strong></td><td colspan="2">${dateStr}</td></tr>
        </table>
        
        <table border="1">
          <thead>
            <tr>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">No.</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Tanggal</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Progres</th>
              <th style="font-weight: bold; text-align: center; border: 1px solid #000;">Detail Pekerjaan</th>
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
    link.download = `Laporan_Project_${project.name.replace(/\\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xls`;
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
    link.download = `Laporan_Project_${project.name.replace(/\\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

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
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-2.5 bg-surface hover:bg-background border border-border/80 hover:border-primary/30 rounded-xl text-text-muted hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">PROJECT PLANNING</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                project.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                project.status === "In Progress" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                project.status === "On Hold" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground mt-0.5">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print">
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-background border border-border text-text-muted hover:text-foreground font-bold rounded-xl transition-all active:scale-95 shrink-0 text-xs shadow-sm"
              title="Ekspor Laporan Project"
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Project Overview & Log Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Project Details Overview Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Detail Informasi Project
            </h3>
            
            <p className="text-xs text-text-muted leading-relaxed">
              {project.description || "Tidak ada deskripsi project."}
            </p>

            {/* Progress Slider Display */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-text-muted">Progres Saat Ini</span>
                <span className="text-primary">{project.progress_percent}%</span>
              </div>
              <div className="w-full bg-background border border-border/40 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    project.status === "Completed" ? "bg-emerald-500" : "bg-primary"
                  }`}
                  style={{ width: `${project.progress_percent}%` }}
                />
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30 text-xs font-bold text-text-muted">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-text-muted/50 mb-0.5">Tanggal Mulai</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-text-muted/60" />
                  <span>{formatDateShort(project.start_date)}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-text-muted/50 mb-0.5">Target Selesai</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-text-muted/60" />
                  <span>{formatDateShort(project.target_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RAB (Rencana Anggaran Biaya) Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                Rencana Anggaran Biaya (RAB)
              </h3>
              <button
                onClick={() => setIsRabModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah RAB
              </button>
            </div>

            {rabItems.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-background border border-border/30">
                <p className="text-text-muted text-xs font-bold">Belum ada anggaran yang dicatat.</p>
                <p className="text-[10px] text-text-muted/65 mt-0.5">Klik "+ Tambah RAB" untuk menyusun anggaran.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {rabItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-background border border-border/40 p-3 rounded-xl gap-2 hover:border-primary/20 transition-colors group/rab">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{item.item_name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 font-medium">
                        {item.quantity} {item.unit} x {formatRupiah(item.price_per_unit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-foreground">
                        {formatRupiah(item.quantity * item.price_per_unit)}
                      </span>
                      <button
                        onClick={() => handleDeleteRabItem(item.id, item.item_name)}
                        className="p-1 hover:bg-rose-500/10 text-text-muted/60 hover:text-rose-500 rounded border border-transparent hover:border-rose-500/20 transition-all opacity-0 group-hover/rab:opacity-100"
                        title="Hapus Anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Budget Banner */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 flex justify-between items-center text-xs font-bold mt-2">
              <span className="text-text-muted">Total Estimasi Biaya</span>
              <span className="text-primary font-black text-sm">
                {formatRupiah(rabItems.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0))}
              </span>
            </div>
          </div>

          {/* Progress Log Submission Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Catat Progres & Pengerjaan Baru
            </h3>
            
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Detail Pekerjaan Yang Selesai <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Jelaskan apa yang sudah dikerjakan... (Misal: Melakukan konfigurasi VLAN, instalasi braket, testing speed link, dll.)"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              {/* Incremental Slider/Number */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <span>Target Progres Baru</span>
                  <span className="text-primary font-black text-xs">{progressPercentAfter}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentAfter}
                    onChange={(e) => setProgressPercentAfter(parseInt(e.target.value))}
                    className="flex-1 accent-primary h-2 bg-background border border-border/55 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercentAfter}
                    onChange={(e) => setProgressPercentAfter(Math.min(100, Math.max(0, parseInt(e.target.value || "0"))))}
                    className="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-center text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Premium Image Upload */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-primary" />
                  Unggah Gambar Dokumentasi (Opsional)
                </label>

                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer bg-background hover:bg-surface transition-all group"
                  >
                    <FileImage className="w-8 h-8 text-text-muted/50 mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-xs font-bold text-text-muted">Klik untuk memilih gambar</p>
                    <p className="text-[10px] text-text-muted/65 mt-0.5">JPEG, PNG, WEBP (Maks 5MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-border overflow-hidden bg-background p-2 flex items-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview upload" 
                      className="w-14 h-14 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{selectedImage?.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{(selectedImage!.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors border border-rose-500/10 active:scale-95"
                    >
                      <X className="w-4 h-4" />
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/10 transition-all active:scale-95 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Mencatat...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    Simpan Catatan Riwayat
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Riwayat Pengerjaan & Progres Project
            </h3>

            {logs.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-background border border-border/40">
                <Clock className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
                <p className="text-text-muted text-xs font-semibold">Belum ada riwayat pengerjaan yang dicatat.</p>
                <p className="text-[10px] text-text-muted/65 mt-0.5">Mulai catat pengerjaan pertama di panel sebelah kiri.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-border/80 ml-3 space-y-8 py-2">
                {logs.map((log, index) => {
                  const hasImage = !!log.image_url;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot Node */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-surface border-2 border-primary flex items-center justify-center shadow-sm group-hover:bg-primary transition-colors">
                        <div className="w-1.5 h-1.5 bg-primary group-hover:bg-surface rounded-full transition-colors" />
                      </div>

                      {/* Log Node Body */}
                      <div className="bg-background border border-border/50 group-hover:border-primary/20 rounded-xl p-4 shadow-sm space-y-3 transition-colors">
                        {/* Title & Metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2">
                          <div className="text-[10px] font-extrabold text-text-muted/80 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-muted/60" />
                            <span>{formatDateTime(log.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded text-[9px] font-extrabold">
                              Progres: {log.progress_percent_after}%
                            </span>
                            
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1 bg-surface hover:bg-rose-500/10 text-text-muted/75 hover:text-rose-500 rounded border border-border/40 hover:border-rose-500/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Hapus Log"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Content text */}
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
                          {log.content}
                        </p>

                        {/* Image Thumbnail Documentation */}
                        {hasImage && (
                          <div className="pt-2">
                            <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border/70 group/thumb cursor-pointer shadow-sm" onClick={() => setSelectedDocImage(log.image_url)}>
                              <img 
                                src={log.image_url} 
                                alt="Dokumentasi project" 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <Maximize2 className="w-4 h-4 text-white animate-in zoom-in-75 duration-200" />
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-text-muted/50 mt-1 block tracking-wider uppercase">DOKUMENTASI FOTO</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Modal: Add RAB Item */}
      {isRabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden" onClick={() => setIsRabModalOpen(false)}>
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Tambah Rencana Anggaran (RAB)
              </h3>
              <button 
                onClick={() => setIsRabModalOpen(false)}
                className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRabSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nama Barang / Jasa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Misal: Cisco Switch Catalyst 9200L"
                  required
                  value={rabItemName}
                  onChange={(e) => setRabItemName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Jumlah <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={rabQuantity}
                    onChange={(e) => setRabQuantity(parseFloat(e.target.value || "1"))}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Satuan</label>
                  <input
                    type="text"
                    placeholder="Misal: Unit, Pcs, Roll, Jasa"
                    value={rabUnit}
                    onChange={(e) => setRabUnit(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Harga Satuan (Rupiah) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">Rp</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rabPricePerUnit}
                    onChange={(e) => setRabPricePerUnit(parseFloat(e.target.value || "0"))}
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsRabModalOpen(false)}
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
                  ) : (
                    "Tambahkan RAB"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print-Only Table View */}
      <div className="hidden print:block w-full p-10">
        <h2 className="text-xl font-bold mb-4 text-center pb-2 border-b-2 border-black underline">Laporan Progres Project</h2>
        
        <div className="mb-6 space-y-1">
          <div className="flex text-sm"><strong className="w-32">Nama Project:</strong> <span>{project.name}</span></div>
          <div className="flex text-sm"><strong className="w-32">Status:</strong> <span>{project.status}</span></div>
          <div className="flex text-sm"><strong className="w-32">Progres Saat Ini:</strong> <span>{project.progress_percent}%</span></div>
          <div className="flex text-sm"><strong className="w-32">Diekspor pada:</strong> <span>{new Date().toLocaleDateString('id-ID')}</span></div>
        </div>

        <table className="w-full text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center w-12 font-bold">No.</th>
              <th className="border border-black p-2 text-center w-28 font-bold">Tanggal</th>
              <th className="border border-black p-2 text-center w-24 font-bold">Progres</th>
              <th className="border border-black p-2 text-center font-bold">Detail Pekerjaan</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const groupedLogs: Record<string, any[]> = {};
              logs.forEach(log => {
                const date = formatDateShort(log.created_at);
                if (!groupedLogs[date]) {
                  groupedLogs[date] = [];
                }
                groupedLogs[date].push(log);
              });

              const dates = Object.keys(groupedLogs);
              
              let no = 1;
              const rows: any[] = [];

              dates.forEach(date => {
                const dayLogs = groupedLogs[date];
                const rowspan = dayLogs.length;

                dayLogs.forEach((log, index) => {
                  rows.push(
                    <tr key={log.id} className="print-break-inside-avoid">
                      {index === 0 && (
                        <>
                          <td className="border border-black p-2 align-middle text-center font-medium" rowSpan={rowspan}>{no}</td>
                          <td className="border border-black p-2 align-middle text-center font-medium" rowSpan={rowspan}>{date}</td>
                        </>
                      )}
                      <td className="border border-black p-2 align-top text-center">{log.progress_percent_after}%</td>
                      <td className="border border-black p-2 align-top text-left whitespace-pre-line">{log.content || '-'}</td>
                    </tr>
                  );
                });
                no++;
              });

              return rows;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
