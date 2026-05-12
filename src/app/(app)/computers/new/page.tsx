"use client";

import { Save, ArrowLeft, Loader2, Monitor, MapPin, HardDrive, Cpu, Calendar, User, FileText, CheckCircle2, Shield, Key, Smartphone, Globe } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createComputer } from "../actions";
import { createClient } from "@/utils/supabase/client";

export default function NewComputerPage() {
  const [state, formAction, isPending] = useActionState(createComputer, null);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoAsset, setAutoAsset] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("locations").select("id, name").order("name");
      setLocations(data || []);
      setIsLoading(false);
    };
    fetchLocations();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/computers" className="p-2 border border-border rounded-xl hover:bg-background transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            Registrasi Aset Komputer Baru
          </h1>
          <p className="text-text-muted mt-1">Pendataan spesifikasi infrastruktur IT dan jadwal pemeliharaan.</p>
        </div>
      </div>

      {/* Main Form */}
      <form action={formAction} className="space-y-6">
        {/* Identitas & Pemetaan */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
            <Monitor className="w-4 h-4" />
            Identitas Perangkat & Penempatan Lokasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nama Komputer / Hostname <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="Contoh: PC-FINANCE-01, LAPTOP-HRD" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Nomor Aset Referensi</label>
                <button 
                  type="button" 
                  onClick={() => setAutoAsset(!autoAsset)}
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border transition-colors ${autoAsset ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface border-border text-text-muted'}`}
                >
                  {autoAsset ? 'Auto ON' : 'Manual'}
                </button>
              </div>
              <input 
                type="text" 
                name="asset_number"
                required={!autoAsset}
                readOnly={autoAsset}
                defaultValue={autoAsset ? "AUTO" : ""}
                className={`w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${autoAsset ? 'opacity-60 italic font-mono text-xs' : 'font-mono text-xs font-bold'}`} 
                placeholder={autoAsset ? "Sistem otomatis menghasilkan nomor unik" : "Ketik nomor inventaris fisik..."} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary/70" />
                Lokasi / Departemen Penempatan
              </label>
              <select 
                name="location_id" 
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all font-medium cursor-pointer"
              >
                <option value="">-- Pilih Lokasi Departemen --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-muted" />
                Pengguna / Penanggung Jawab
              </label>
              <input 
                type="text" 
                name="user_assigned" 
                placeholder="Nama staf yang mengoperasikan..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-xs"
              />
            </div>
          </div>
        </div>

        {/* Spesifikasi Teknis */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-emerald-500 border-b border-border pb-3">
            <Cpu className="w-4 h-4" />
            Spesifikasi Teknis Inti Sistem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Sistem Operasi</label>
              <input 
                type="text" 
                name="operating_system" 
                placeholder="Contoh: Windows 11 Pro 64-bit" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Model Processor</label>
              <input 
                type="text" 
                name="processor" 
                placeholder="Contoh: Intel Core i7-13700 / Ryzen 5" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Kapasitas RAM</label>
              <input 
                type="text" 
                name="ram" 
                placeholder="Contoh: 16GB DDR4 3200MHz" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                Media Penyimpanan (Storage)
              </label>
              <input 
                type="text" 
                name="storage" 
                placeholder="Contoh: 512GB SSD NVMe + 1TB HDD" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xs"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Alamat IP Jaringan (IP Address)</label>
              <input 
                type="text" 
                name="ip_address" 
                placeholder="Contoh: 192.168.10.45 (Statis/DHCP)" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Parameter Enterprise & Dukungan Jarak Jauh */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-blue-500 border-b border-border pb-3">
            <Globe className="w-4 h-4" />
            Parameter Enterprise & Dukungan Jarak Jauh (Opsional)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Alamat Fisik (MAC Address)</label>
              <input 
                type="text" 
                name="mac_address" 
                placeholder="Contoh: 00:1A:2B:3C:4D:5E" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Serial Number (SN) / Service Tag</label>
              <input 
                type="text" 
                name="serial_number" 
                placeholder="Contoh: PF4B8Z9X / 5CD123456" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-xs font-bold text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                ID Remote Support
              </label>
              <input 
                type="text" 
                name="remote_support_id" 
                placeholder="AnyDesk / TeamViewer ID..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xs font-bold text-blue-600 dark:text-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tanggal Pembelian Unit</label>
              <input 
                type="date" 
                name="purchase_date" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-medium cursor-pointer"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Masa Berakhir Garansi (Warranty Expiry)
              </label>
              <input 
                type="date" 
                name="warranty_expiry_date" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-text-muted mt-1">Sistem akan otomatis memverifikasi keaktifan garansi secara real-time.</p>
            </div>
          </div>
        </div>

        {/* Penjadwalan & Status */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-amber-500 border-b border-border pb-3">
            <Calendar className="w-4 h-4" />
            Penjadwalan Maintenance & Kondisi Aset
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Kondisi / Status Awal</label>
              <select 
                name="status" 
                defaultValue="Aktif"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-bold text-xs cursor-pointer"
              >
                <option value="Aktif">Aktif (Operasional Normal)</option>
                <option value="Maintenance">Maintenance (Sedang Dirawat)</option>
                <option value="Rusak">Rusak (Menunggu Perbaikan)</option>
                <option value="Pensiun">Pensiun (Nonaktif Permanen)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tgl Perawatan Terakhir</label>
              <input 
                type="date" 
                name="last_maintenance_date" 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs font-medium cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Jadwal Perawatan Berikutnya</label>
              <input 
                type="date" 
                name="next_maintenance_date" 
                defaultValue={new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]} // Default 3 bulan ke depan
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs font-bold text-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-text-muted mt-1">Saran: Rutin dijadwalkan per 3 atau 6 bulan.</p>
            </div>

            <div className="space-y-2 md:col-span-3">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-text-muted" />
                Catatan Operasional / Perangkat Lunak Tambahan
              </label>
              <textarea 
                name="notes" 
                rows={3} 
                placeholder="Catat aplikasi khusus yang terinstal (Contoh: SAP, AutoCAD, Adobe CC) atau kelengkapan periferal (UPS, Dual Monitor)..." 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none text-xs resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-bold flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
            {state.error}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <Link href="/computers" className="px-6 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-surface transition-colors text-text-muted active:scale-95">
            Batalkan
          </Link>
          <button 
            type="submit" 
            disabled={isPending || isLoading}
            className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? "Menyimpan Spesifikasi..." : "Simpan Registrasi Komputer"}
          </button>
        </div>
      </form>
    </div>
  );
}
