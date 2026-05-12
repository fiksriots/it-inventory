"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, UploadCloud, FileCheck } from "lucide-react";
import { completeService } from "../actions";
import { useRouter } from "next/navigation";

interface ServiceCompleteFormProps {
  service: any;
}

export default function ServiceCompleteForm({ service }: ServiceCompleteFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await completeService(service.id, formData);
      if (result.error) {
        setError(result.error);
        setIsPending(false);
      } else {
        alert("Perbaikan barang berhasil diselesaikan!");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat memproses penyelesaian perbaikan.");
      setIsPending(false);
    }
  };

  if (service.status !== "Proses Service") return null;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
        <div className="bg-emerald-500/20 p-2 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Penyelesaian Perbaikan (Service Complete)</h3>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-500/50">Lengkapi hasil akhir perbaikan saat barang telah diterima kembali.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-tight">Kondisi Akhir Perangkat</label>
            <input 
              type="text" 
              name="final_condition"
              defaultValue="Normal" 
              required
              placeholder="Misal: Normal / Siap Pakai"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-tight">Total Biaya Akhir (Rp)</label>
            <input 
              type="number" 
              name="cost"
              defaultValue={service.cost || 0}
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-right font-bold text-primary focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-tight">Tanggal Diterima</label>
            <input 
              type="date" 
              name="completed_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-tight">Catatan Penanganan / Teknisi</label>
          <textarea 
            name="notes"
            rows={2}
            placeholder="Tuliskan tindakan yang dilakukan vendor, garansi perbaikan, atau pergantian komponen..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
          ></textarea>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-tight">Upload Bukti Faktur / Invoice</label>
          <div className="relative">
            <input 
              type="file" 
              name="invoice"
              id="invoice-upload-complete" 
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="invoice-upload-complete"
              className="cursor-pointer w-full bg-background border border-dashed border-emerald-500/30 hover:border-emerald-500/60 p-3 rounded-lg flex items-center justify-center gap-2 transition-all group text-center"
            >
              {fileName ? <FileCheck className="w-5 h-5 text-emerald-500" /> : <UploadCloud className="w-5 h-5 text-text-muted group-hover:text-emerald-500 transition-colors" />}
              <span className="text-xs font-medium text-text-muted group-hover:text-foreground transition-colors">
                {fileName ? (
                  <span className="text-emerald-500 font-bold">{fileName}</span>
                ) : (
                  "Unggah file faktur / bukti pembayaran"
                )}
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-emerald-600/20"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isPending ? "Memproses..." : "Selesaikan Perbaikan"}
          </button>
        </div>
      </form>
    </div>
  );
}
