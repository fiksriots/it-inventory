"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, Loader2, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/ToastProvider";

interface ExcelImportExportProps {
  exportAction: () => Promise<any[]>;
  importAction: (data: any[]) => Promise<{ success: boolean; count: number }>;
  templateData?: any[];
  templateAction?: () => Promise<string>;
  fileName: string;
  buttonLabel: string;
}

export default function ExcelImportExport({
  exportAction,
  importAction,
  templateData,
  templateAction,
  fileName,
  buttonLabel
}: ExcelImportExportProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 1. HANDLE EXPORT EXCEL
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const data = await exportAction();
      if (!data || data.length === 0) {
        toast("Tidak ada data untuk diexport.", "error");
        setExportLoading(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Auto-fit column width
      const maxLen = data.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, colIdx) => {
          const val = row[key] ? row[key].toString() : "";
          acc[colIdx] = Math.max(acc[colIdx] || 10, val.length + 4, key.length + 4);
        });
        return acc;
      }, []);
      worksheet["!cols"] = maxLen.map((w: number) => ({ wch: w }));

      const dateStr = new Date().toLocaleDateString("id-ID").replace(/\//g, "-");
      XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
      toast(`Berhasil mengexport data ke Excel!`, "success");
    } catch (error: any) {
      console.error(error);
      toast("Gagal mengexport data.", "error");
    } finally {
      setExportLoading(false);
    }
  };

  // 2. DOWNLOAD TEMPLATE IMPORT
  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      if (templateAction) {
        const base64 = await templateAction();
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Template_Import_${fileName}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast("Template Excel berhasil diunduh!", "success");
        return;
      }

      if (!templateData) {
        toast("Template data tidak dikonfigurasi.", "error");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

      // Auto-fit columns
      const maxLen = templateData.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, colIdx) => {
          const val = row[key] ? row[key].toString() : "";
          acc[colIdx] = Math.max(acc[colIdx] || 10, val.length + 4, key.length + 4);
        });
        return acc;
      }, []);
      worksheet["!cols"] = maxLen.map((w: number) => ({ wch: w }));

      XLSX.writeFile(workbook, `Template_Import_${fileName}.xlsx`);
      toast("Template Excel berhasil diunduh!", "success");
    } catch (error) {
      console.error(error);
      toast("Gagal mengunduh template.", "error");
    } finally {
      setTemplateLoading(false);
    }
  };

  // 3. HANDLE IMPORT FILE EXCEL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls" && extension !== "csv") {
      toast("Format berkas tidak valid. Gunakan .xlsx, .xls, atau .csv", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            toast("Berkas Excel kosong atau tidak terbaca.", "error");
            setImportLoading(false);
            return;
          }

          // Kirim data ke Server Action
          const result = await importAction(jsonData);
          
          if (result.success) {
            toast(`Berhasil mengimpor ${result.count} data baru!`, "success");
          } else {
            toast("Gagal mengimpor data. Periksa format kolom Excel Anda.", "error");
          }
        } catch (err: any) {
          console.error(err);
          toast("Gagal membaca atau memproses isi Excel.", "error");
        } finally {
          setImportLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast("Gagal mengunggah berkas.", "error");
      setImportLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tombol Export */}
      <button
        onClick={handleExport}
        disabled={exportLoading || importLoading}
        className="px-4 py-2 bg-surface hover:bg-background border border-border text-foreground hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
        title={`Unduh seluruh data ${buttonLabel} ke format Excel (.xlsx)`}
      >
        {exportLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Export Excel
      </button>

      {/* Tombol Import */}
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={exportLoading || importLoading}
          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          title={`Unggah berkas Excel untuk impor data ${buttonLabel} massal`}
        >
          {importLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Import Excel
        </button>
      </div>

      {/* Tombol Download Template & Petunjuk */}
      <div className="relative flex items-center gap-1">
        <button
          onClick={handleDownloadTemplate}
          disabled={exportLoading || importLoading || templateLoading}
          className="p-2 bg-surface hover:bg-background border border-border rounded-xl text-text-muted hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Unduh Template Format Import Excel"
        >
          {templateLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          className="p-2 bg-surface border border-border rounded-xl text-text-muted hover:text-foreground transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-64 p-3 bg-surface border border-border rounded-2xl shadow-xl z-50 text-[10px] leading-relaxed font-bold text-text-muted animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-foreground border-b border-border/50 pb-1 mb-1.5 uppercase tracking-wider">💡 Petunjuk Import Excel:</p>
            <ol className="list-decimal pl-3.5 space-y-1">
              <li>Klik ikon <FileSpreadsheet className="w-3 h-3 inline text-primary mx-0.5" /> untuk mengunduh template resmi.</li>
              <li>Isi baris data sesuai kolom yang telah disediakan.</li>
              <li>Kolom berkode unik seperti SKU atau Nomor Aset dapat diisi dengan <code className="text-primary font-mono font-black">-AUTO</code> untuk terbit otomatis secara unik.</li>
              <li>Lokasi & Kategori yang diketik bebas akan dibuat otomatis di database jika belum tersedia.</li>
              <li>Klik <code className="text-primary">Import Excel</code> lalu pilih berkas yang sudah diisi.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
