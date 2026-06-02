"use client";

import { useState } from "react";
import { Calendar, Loader2, CheckCircle2, AlertTriangle, PlusCircle, Users, Trash, Plus, Wrench, Copy, Check, Save, Image, FileImage, X, Eye, Pencil } from "lucide-react";
import { updateMaintenanceSchedule, createComputerMaintenanceLog, deleteComputerMaintenanceLog, updateComputerMaintenanceLog } from "../actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useRef } from "react";

interface MaintenanceScheduleUpdaterProps {
  computer: any;
  maintenanceLogs: any[];
  dbTableMissing?: boolean;
  itemsList?: any[];
  locationsList?: any[];
}

export default function MaintenanceScheduleUpdater({ computer, maintenanceLogs = [], dbTableMissing = false, itemsList = [], locationsList = [] }: MaintenanceScheduleUpdaterProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [hasPartReplacement, setHasPartReplacement] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const lastDate = formData.get("last_maintenance_date") as string || null;
    const nextDate = formData.get("next_maintenance_date") as string || null;
    const status = formData.get("status") as string || "Aktif";

    try {
      if (dbTableMissing) {
        const result = await updateMaintenanceSchedule(computer.id, lastDate, nextDate, status);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMsg("Jadwal dan status aset berhasil diperbarui! (Catatan: Database log belum dibuat)");
          router.refresh();
        }
      } else {
        if (lastDate) {
          // Buat log otomatis untuk pemeliharaan ini
          const defaultTitle = `Maintenance ${maintenanceLogs.length + 1}`;
          const logData = new FormData();
          logData.append("maintenance_date", lastDate);
          logData.append("maintenance_title", defaultTitle);
          logData.append("notes", "Penyelesaian pemeliharaan terjadwal dari panel kontrol.");
          logData.append("performed_by", "Internal IT");
          logData.append("status_after", status);
          if (nextDate) {
            logData.append("next_maintenance_date", nextDate);
          }
          await createComputerMaintenanceLog(computer.id, logData);
          setSuccessMsg(`Jadwal diperbarui & log "${defaultTitle}" dicatat otomatis!`);
        } else {
          const result = await updateMaintenanceSchedule(computer.id, lastDate, nextDate, status);
          if (result.error) {
            setError(result.error);
            return;
          }
          setSuccessMsg("Jadwal pemeliharaan berhasil diperbarui!");
        }
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kesalahan sistem saat memperbarui jadwal.");
    } finally {
      setIsPending(false);
    }
  };

  const handleAddLogSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLogLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      await createComputerMaintenanceLog(computer.id, formData);
      toast("Riwayat pemeliharaan berhasil dicatat!", "success");
      setIsAddingLog(false);
      clearImage();
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Gagal mencatat riwayat pemeliharaan");
    } finally {
      setLogLoading(false);
    }
  };

  const handleEditLogSubmit = async (e: React.FormEvent<HTMLFormElement>, logId: string) => {
    e.preventDefault();
    setLogLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (!imagePreview) {
        formData.append("remove_image", "true");
      }
      await updateComputerMaintenanceLog(logId, computer.id, formData);
      toast("Riwayat pemeliharaan berhasil diperbarui!", "success");
      setEditingLogId(null);
      clearImage();
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Gagal memperbarui riwayat pemeliharaan");
    } finally {
      setLogLoading(false);
    }
  };

  const openEditLog = (log: any) => {
    setEditingLogId(log.id);
    setImagePreview(log.image_url || null);
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteLog = async (logId: string, logTitle: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus catatan "${logTitle}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    setLogLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteComputerMaintenanceLog(logId, computer.id);
      toast("Catatan pemeliharaan berhasil dihapus.", "success");
      router.refresh();
    } catch (error: any) {
      setError("Gagal menghapus catatan pemeliharaan");
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Kendali Jadwal Maintenance & Status</h3>
            <p className="text-xs text-text-muted mt-0.5">Selesaikan perawatan berjalan atau jadwalkan siklus pemeliharaan baru.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status Aset Saat Ini</label>
              <select 
                name="status"
                defaultValue={computer.status || "Aktif"}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="Aktif">Aktif (Operasional)</option>
                <option value="Maintenance">Maintenance (Proses Perawatan)</option>
                <option value="Rusak">Rusak (Perlu Tindakan)</option>
                <option value="Pensiun">Pensiun (Dihapus/Nonaktif)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tgl Perawatan Terakhir</label>
              <input 
                type="date" 
                name="last_maintenance_date"
                defaultValue={computer.last_maintenance_date || ""}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Jadwal Perawatan Berikutnya</label>
              <input 
                type="date" 
                name="next_maintenance_date"
                defaultValue={computer.next_maintenance_date || ""}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Preset Triggers */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector("form") as HTMLFormElement;
                const today = new Date().toISOString().split('T')[0];
                const next3m = new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0];
                if (form) {
                  const lastInp = form.querySelector('input[name="last_maintenance_date"]') as HTMLInputElement;
                  const nextInp = form.querySelector('input[name="next_maintenance_date"]') as HTMLInputElement;
                  const statusSel = form.querySelector('select[name="status"]') as HTMLSelectElement;
                  if (lastInp) lastInp.value = today;
                  if (nextInp) nextInp.value = next3m;
                  if (statusSel) statusSel.value = "Aktif";
                }
              }}
              className="text-[10px] bg-background hover:bg-surface border border-border px-2.5 py-1 rounded-lg font-bold text-text-muted transition-all"
            >
              ⚡ Selesai Hari Ini (+3Bln)
            </button>
            
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector("form") as HTMLFormElement;
                const today = new Date().toISOString().split('T')[0];
                const next6m = new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0];
                if (form) {
                  const lastInp = form.querySelector('input[name="last_maintenance_date"]') as HTMLInputElement;
                  const nextInp = form.querySelector('input[name="next_maintenance_date"]') as HTMLInputElement;
                  const statusSel = form.querySelector('select[name="status"]') as HTMLSelectElement;
                  if (lastInp) lastInp.value = today;
                  if (nextInp) nextInp.value = next6m;
                  if (statusSel) statusSel.value = "Aktif";
                }
              }}
              className="text-[10px] bg-background hover:bg-surface border border-border px-2.5 py-1 rounded-lg font-bold text-text-muted transition-all"
            >
              ⚡ Selesai Hari Ini (+6Bln)
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isPending ? "Memperbarui..." : "Simpan Pembaruan Jadwal"}
            </button>
          </div>
        </form>
      </div>

      {/* Panel Riwayat Pemeliharaan (Maintenance Logs) */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Riwayat Pemeliharaan & Perawatan PC
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Daftar rekam jejak histori perbaikan komputer ini (Maintenance 1, 2, 3).</p>
          </div>

          {!dbTableMissing && !isAddingLog && (
            <button
              type="button"
              onClick={() => setIsAddingLog(true)}
              disabled={logLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl border border-primary/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Catat Perawatan
            </button>
          )}
        </div>

        {dbTableMissing ? (
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-4">
            <div className="flex items-start gap-3 text-amber-500">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Inisialisasi Tabel Riwayat PC Diperlukan</h4>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  Fitur penyimpanan riwayat pemeliharaan memerlukan tabel database baru <code>computer_maintenance_logs</code>. Silakan salin dan jalankan perintah SQL berikut di <strong>SQL Editor Supabase Dashboard</strong> Anda, lalu muat ulang halaman ini.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <pre className="text-[10px] bg-background border border-border p-3.5 rounded-xl overflow-x-auto text-foreground font-mono select-all leading-normal max-h-48 overflow-y-auto">
{`CREATE TABLE IF NOT EXISTS public.computer_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_title TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT,
  status_after TEXT DEFAULT 'Aktif',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON TABLE public.computer_maintenance_logs TO anon, authenticated, service_role;
ALTER TABLE public.computer_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.computer_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.computer_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.computer_maintenance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.computer_maintenance_logs FOR DELETE USING (true);
NOTIFY pgrst, 'reload schema';`}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.computer_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_title TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT,
  status_after TEXT DEFAULT 'Aktif',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON TABLE public.computer_maintenance_logs TO anon, authenticated, service_role;
ALTER TABLE public.computer_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.computer_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.computer_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.computer_maintenance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.computer_maintenance_logs FOR DELETE USING (true);
NOTIFY pgrst, 'reload schema';`);
                  setSqlCopied(true);
                  toast("SQL berhasil disalin!", "success");
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="absolute right-2.5 top-2.5 p-1.5 bg-background hover:bg-surface border border-border rounded-lg text-text-muted hover:text-foreground transition-all"
                title="Salin SQL"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Form Tambah Log */}
            {isAddingLog && (
              <form onSubmit={handleAddLogSubmit} className="p-5 rounded-2xl border border-primary/30 bg-background space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h4 className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" /> Catat Perawatan Baru
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingLog(false)}
                    className="text-[10px] font-bold text-text-muted hover:text-foreground px-2 py-1 rounded bg-surface border border-border"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Nama / Judul Kegiatan</label>
                    <input
                      type="text"
                      name="maintenance_title"
                      defaultValue={`Maintenance ${maintenanceLogs.length + 1}`}
                      placeholder="Contoh: Maintenance 1, Pembersihan Debu, Instal Ulang OS"
                      required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Tanggal Perawatan</label>
                    <input
                      type="date"
                      name="maintenance_date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Teknisi / Pihak Vendor</label>
                    <input
                      type="text"
                      name="performed_by"
                      defaultValue="Internal IT"
                      placeholder="Siapa yang memelihara..."
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Kondisi Setelah Perawatan</label>
                    <select
                      name="status_after"
                      defaultValue="Aktif"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="Aktif">Aktif (Beroperasi Normal)</option>
                      <option value="Maintenance">Maintenance (Sedang Dipantau)</option>
                      <option value="Rusak">Rusak (Butuh Perbaikan Lebih Lanjut)</option>
                      <option value="Pensiun">Pensiun (Dihapus/Nonaktif)</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Siklus Berikutnya (Opsional - Mengupdate Jadwal)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="date"
                        name="next_maintenance_date"
                        defaultValue={(() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + 3);
                          return d.toISOString().slice(0, 10);
                        })()}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                      />
                      <span className="text-[10px] text-text-muted italic flex items-center shrink-0">
                        *Mengatur jadwal berikutnya ke 3 bulan kedepan
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-600 uppercase flex items-center gap-2">
                        <Wrench className="w-4 h-4" /> Ada Pergantian Suku Cadang (Part)?
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={hasPartReplacement} onChange={() => setHasPartReplacement(!hasPartReplacement)} />
                        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                    {hasPartReplacement && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-amber-500/20">
                        <div className="space-y-1 sm:col-span-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Suku Cadang Pengganti</label>
                          <select name="replaced_item_id" required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none">
                            <option value="">-- Pilih Suku Cadang --</option>
                            {itemsList.map((item: any) => (
                              <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Jumlah</label>
                          <input type="number" name="replaced_quantity" min="1" defaultValue="1" required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Ambil dari Gudang</label>
                          <select name="source_location_id" required className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none">
                            <option value="">-- Pilih Sumber Stok --</option>
                            {locationsList.map((loc: any) => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-3 mt-1 pt-1 border-t border-amber-500/10">
                          <input 
                            type="checkbox" 
                            id="comp_discard_old_part" 
                            name="discard_old_part" 
                            value="true"
                            className="rounded border-border text-amber-500 focus:ring-amber-500/20 w-3.5 h-3.5"
                          />
                          <label htmlFor="comp_discard_old_part" className="text-[10px] font-bold text-text-muted cursor-pointer select-none">
                            Buang part lama / Jangan simpan ke Gudang Rusak (misal: pita printer, kabel rusak, dll)
                          </label>
                        </div>
                        <p className="text-[10px] text-amber-600/70 sm:col-span-3">
                          *Stok di gudang sumber akan dikurangi. Part lama akan dipindahkan ke "Gudang Rusak" kecuali jika opsi buang dicentang.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Catatan & Temuan Teknis</label>
                    <textarea
                      name="notes"
                      rows={2}
                      placeholder="Jelaskan apa yang dibersihkan, diperbaiki, diupgrade, atau diperiksa..."
                      className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    ></textarea>
                  </div>

                  {/* Upload Dokumentasi */}
                  <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-primary" />
                      Bukti Dokumentasi (Opsional)
                    </label>

                    {!imagePreview ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer bg-background hover:bg-surface/50 transition-all group"
                      >
                        <FileImage className="w-6 h-6 text-text-muted/50 mx-auto mb-1 group-hover:text-primary transition-colors" />
                        <p className="text-xs font-bold text-text-muted">Pilih atau Seret Foto</p>
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
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingLog(false); clearImage(); }}
                    className="px-4 py-2 bg-background border border-border text-xs font-bold rounded-xl hover:bg-surface transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={logLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {logLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Catat Perawatan
                  </button>
                </div>
              </form>
            )}

            {/* Form Edit Log */}
            {editingLogId && (
              <form 
                onSubmit={(e) => handleEditLogSubmit(e, editingLogId)} 
                className="p-5 rounded-2xl border border-primary/30 bg-background space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
              >
                {(() => {
                  const logToEdit = maintenanceLogs.find(l => l.id === editingLogId);
                  if (!logToEdit) return null;
                  return (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <h4 className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                          <Pencil className="w-4 h-4" /> Edit Perawatan
                        </h4>
                        <button
                          type="button"
                          onClick={() => { setEditingLogId(null); clearImage(); }}
                          className="text-[10px] font-bold text-text-muted hover:text-foreground px-2 py-1 rounded bg-surface border border-border"
                        >
                          Batal
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Nama / Judul Kegiatan</label>
                          <input
                            type="text"
                            name="maintenance_title"
                            defaultValue={logToEdit.maintenance_title}
                            required
                            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Tanggal Perawatan</label>
                          <input
                            type="date"
                            name="maintenance_date"
                            defaultValue={logToEdit.maintenance_date}
                            required
                            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Teknisi / Pihak Vendor</label>
                          <input
                            type="text"
                            name="performed_by"
                            defaultValue={logToEdit.performed_by || ""}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Kondisi Setelah Perawatan</label>
                          <select
                            name="status_after"
                            defaultValue={logToEdit.status_after}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                          >
                            <option value="Aktif">Aktif (Beroperasi Normal)</option>
                            <option value="Maintenance">Maintenance (Sedang Dipantau)</option>
                            <option value="Rusak">Rusak (Butuh Perbaikan Lebih Lanjut)</option>
                            <option value="Pensiun">Pensiun (Dihapus/Nonaktif)</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-bold text-text-muted uppercase">Catatan & Temuan Teknis</label>
                          <textarea
                            name="notes"
                            rows={3}
                            defaultValue={logToEdit.notes || ""}
                            className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          ></textarea>
                        </div>

                        {/* Upload Dokumentasi */}
                        <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Image className="w-3.5 h-3.5 text-primary" />
                            Bukti Dokumentasi
                          </label>

                          {!imagePreview ? (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer bg-background hover:bg-surface/50 transition-all group"
                            >
                              <FileImage className="w-6 h-6 text-text-muted/50 mx-auto mb-1 group-hover:text-primary transition-colors" />
                              <p className="text-xs font-bold text-text-muted">Pilih atau Seret Foto Baru</p>
                            </div>
                          ) : (
                            <div className="relative rounded-xl border border-border overflow-hidden bg-background p-2 flex items-center gap-3">
                              <img 
                                src={imagePreview} 
                                alt="Preview upload" 
                                className="w-12 h-12 object-cover rounded-lg border border-border"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{selectedImage ? selectedImage.name : "Gambar tersimpan"}</p>
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
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setEditingLogId(null); clearImage(); }}
                          className="px-4 py-2 bg-background border border-border text-xs font-bold rounded-xl hover:bg-surface transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={logLoading}
                          className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                        >
                          {logLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Simpan Perubahan
                        </button>
                      </div>
                    </>
                  );
                })()}
              </form>
            )}

            {/* Daftar Log Perawatan */}
            {!isAddingLog && !editingLogId && (
              <div className="space-y-4">
                {maintenanceLogs.length > 0 ? (
                  <div className="relative border-l border-border ml-3 pl-6 space-y-5 py-2">
                    {maintenanceLogs.map((log: any, idx: number) => {
                      const isLogNew = idx === 0;
                      return (
                        <div key={log.id} className="relative group/item animate-in fade-in duration-300">
                          {/* Timeline Indicator Dot */}
                          <span className={`absolute -left-[31px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-surface flex items-center justify-center ${
                            log.status_after === 'Aktif' ? 'bg-emerald-500' :
                            log.status_after === 'Rusak' ? 'bg-rose-500' :
                            log.status_after === 'Maintenance' ? 'bg-amber-500' : 'bg-text-muted'
                          }`}></span>

                          <div className="bg-background border border-border rounded-xl p-4 shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-xs text-foreground">{log.maintenance_title}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    log.status_after === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500' :
                                    log.status_after === 'Rusak' ? 'bg-rose-500/10 text-rose-500' :
                                    log.status_after === 'Maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-text-muted/10 text-text-muted'
                                  }`}>
                                    {log.status_after}
                                  </span>
                                  {isLogNew && (
                                    <span className="bg-primary/10 text-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest">Terbaru</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1.5 font-bold">
                                  <span className="flex items-center gap-1 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                                    {new Date(log.maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </span>
                                  {log.performed_by && (
                                    <span className="flex items-center gap-1 font-bold">
                                      <Users className="w-3.5 h-3.5 text-text-muted" />
                                      Mitra: {log.performed_by}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 lg:opacity-0 lg:group-hover/item:opacity-100 opacity-100 transition-all">
                                {log.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDocImage(log.image_url)}
                                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                                    title="Lihat Bukti Dokumentasi"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditLog(log)}
                                  disabled={logLoading}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50 shrink-0"
                                  title="Edit Catatan Riwayat"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(log.id, log.maintenance_title)}
                                  disabled={logLoading}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-50 shrink-0"
                                  title="Hapus Catatan Riwayat"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {log.notes && (
                              <p className="mt-3 text-xs bg-surface p-3 rounded-lg border border-border/60 text-foreground whitespace-pre-line leading-relaxed">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-background border border-dashed border-border rounded-2xl p-6">
                    <Wrench className="w-10 h-10 text-text-muted/40 mx-auto mb-2.5" />
                    <p className="text-xs font-bold text-text-muted">Belum ada riwayat pemeliharaan</p>
                    <p className="text-[11px] text-text-muted/70 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Catat pemeliharaan pertama untuk PC / komputer ini untuk melacak histori kondisinya.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingLog(true)}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Mulai Catat Riwayat
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Lightbox Modal Popup */}
      {selectedDocImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" 
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
    </>
  );
}
