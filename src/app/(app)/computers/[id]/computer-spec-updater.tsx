"use client";

import { useState, useEffect } from "react";
import { Cpu, Loader2, Save, MapPin, HardDrive, User, CheckCircle2, Globe, Smartphone, Shield } from "lucide-react";
import { updateComputer } from "../actions";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface ComputerSpecUpdaterProps {
  computer: any;
}

export default function ComputerSpecUpdater({ computer }: ComputerSpecUpdaterProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLocs = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("locations").select("id, name").order("name");
      setLocations(data || []);
    };
    fetchLocs();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    // keep status unchanged from this form
    formData.append("status", computer.status);

    try {
      const result = await updateComputer(computer.id, null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccessMsg("Spesifikasi dan penempatan aset berhasil diperbarui!");
        router.refresh();
      }
    } catch (err: any) {
      setError("Terjadi kesalahan saat menyimpan pembaruan spesifikasi.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">Informasi Perangkat & Spesifikasi Teknis</h3>
          <p className="text-xs text-text-muted mt-0.5">Sesuaikan identitas, penugasan pengguna, dan komponen keras/lunak.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nama Komputer / Hostname <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="name"
              defaultValue={computer.name}
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nomor Aset Referensi</label>
            <input 
              type="text" 
              defaultValue={computer.asset_number}
              disabled
              className="w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-text-muted cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary/70" />
              Lokasi / Departemen
            </label>
            <select 
              name="location_id"
              defaultValue={computer.location_id || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
            >
              <option value="">-- Pilih Lokasi --</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-text-muted" />
              Pengguna / Penanggung Jawab
            </label>
            <input 
              type="text" 
              name="user_assigned"
              defaultValue={computer.user_assigned || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Sistem Operasi</label>
            <input 
              type="text" 
              name="operating_system"
              defaultValue={computer.operating_system || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Model Processor</label>
            <input 
              type="text" 
              name="processor"
              defaultValue={computer.processor || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Kapasitas RAM</label>
            <input 
              type="text" 
              name="ram"
              defaultValue={computer.ram || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              Media Penyimpanan
            </label>
            <input 
              type="text" 
              name="storage"
              defaultValue={computer.storage || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Parameter Enterprise */}
          <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Parameter Enterprise & Pengendali Jarak Jauh
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">MAC Address</label>
            <input 
              type="text" 
              name="mac_address"
              defaultValue={computer.mac_address || ""}
              placeholder="00:1A:2B:3C:4D:5E"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Serial Number / ST</label>
            <input 
              type="text" 
              name="serial_number"
              defaultValue={computer.serial_number || ""}
              placeholder="SN Pabrik..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              ID Remote Support (AnyDesk / TeamViewer)
            </label>
            <input 
              type="text" 
              name="remote_support_id"
              defaultValue={computer.remote_support_id || ""}
              placeholder="Ketik ID Remote Support..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tanggal Pembelian</label>
            <input 
              type="date" 
              name="purchase_date"
              defaultValue={computer.purchase_date || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Masa Garansi
            </label>
            <input 
              type="date" 
              name="warranty_expiry_date"
              defaultValue={computer.warranty_expiry_date || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Alamat IP Jaringan</label>
            <input 
              type="text" 
              name="ip_address"
              defaultValue={computer.ip_address || ""}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Catatan Operasional / Software</label>
            <textarea 
              name="notes"
              defaultValue={computer.notes || ""}
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
            ></textarea>
          </div>
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
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? "Menyimpan Pembaruan..." : "Simpan Spesifikasi Perangkat"}
          </button>
        </div>
      </form>
    </div>
  );
}
