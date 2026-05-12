"use client";

import { useState } from "react";
import { Calendar, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateMaintenanceSchedule } from "../actions";
import { useRouter } from "next/navigation";

interface MaintenanceScheduleUpdaterProps {
  computer: any;
}

export default function MaintenanceScheduleUpdater({ computer }: MaintenanceScheduleUpdaterProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

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
      const result = await updateMaintenanceSchedule(computer.id, lastDate, nextDate, status);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMsg("Jadwal dan status aset berhasil diperbarui!");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kesalahan sistem saat memperbarui jadwal.");
    } finally {
      setIsPending(false);
    }
  };

  return (
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
  );
}
