"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Cctv, MapPin, Tag, Globe, Users, Clock, FileText } from "lucide-react";
import { createInfrastructure } from "../actions";
import { useToast } from "@/components/ui/ToastProvider";

interface InfrastructureFormProps {
  locations: any[];
  initialLocation?: string;
  initialCategory?: string;
}

export default function InfrastructureForm({ 
  locations, 
  initialLocation, 
  initialCategory 
}: InfrastructureFormProps) {
  const [loading, setLoading] = useState(false);
  
  const defaultCategories = ["CCTV", "DVR", "Gate/Portal", "AC/Pendingin", "Lainnya"];
  const isCustom = initialCategory && initialCategory !== "Semua" && !defaultCategories.includes(initialCategory);
  
  const [isCustomCategory, setIsCustomCategory] = useState(!!isCustom);
  const [selectedCat, setSelectedCat] = useState(
    initialCategory && initialCategory !== "Semua" ? initialCategory : "CCTV"
  );
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createInfrastructure(formData);
      
      toast("Fasilitas berhasil didaftarkan ke sistem!", "success");
      router.push(`/infrastructure/${result.id}?location=${initialLocation || "Semua"}&category=${initialCategory || "Semua"}`);
    } catch (error: any) {
      toast(error.message || "Gagal mendaftarkan fasilitas", "error");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/infrastructure?location=${initialLocation || "Semua"}&category=${initialCategory || "Semua"}`}
            className="p-2.5 bg-surface border border-border rounded-xl text-text-muted hover:text-foreground hover:bg-background transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Registrasi Fasilitas Baru</h1>
            <p className="text-xs text-text-muted mt-0.5">Daftarkan perangkat pengamanan, akses, atau utilitas fisik gedung.</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-8">
        {/* Seksi 1: Identitas Pokok */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 pb-2 border-b border-border/50">
            <Tag className="w-4 h-4" />
            Informasi Pokok Fasilitas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Nama Perangkat / Fasilitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: CCTV Pintu Masuk Utama, DVR Ruang Server 1, Portal Gate Selatan"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex justify-between items-center">
                <span>Kategori Fasilitas <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-primary hover:underline font-black uppercase tracking-widest cursor-pointer"
                >
                  {isCustomCategory ? "Pilih dari Daftar" : "+ Kategori Kustom"}
                </button>
              </label>
              {isCustomCategory ? (
                <input
                  type="text"
                  name="category"
                  required
                  placeholder="Ketik kategori baru (contoh: Router, Server, UPS)..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-text-muted/40"
                />
              ) : (
                <select
                  name="category"
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option value="CCTV">CCTV (Kamera Pengawas)</option>
                  <option value="DVR">DVR (Digital Video Recorder / NVR)</option>
                  <option value="Gate/Portal">Gate / Portal Akses Kendaraan</option>
                  <option value="AC/Pendingin">AC / Sistem Pendingin Ruangan</option>
                  <option value="Lainnya">Fasilitas Lainnya</option>
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Lokasi Penempatan
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-4 top-3.5 text-text-muted" />
                <select
                  name="location_id"
                  defaultValue={initialLocation && initialLocation !== "Semua" ? initialLocation : ""}
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Pilih Lokasi / Ruangan...</option>
                  {locations.map((loc) => {
                    const displayName = loc.parent ? `${loc.parent.name} › ${loc.name}` : loc.name;
                    return (
                      <option key={loc.id} value={loc.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Seksi 2: Parameter Jaringan & Pemeliharaan */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 pb-2 border-b border-border/50">
            <Globe className="w-4 h-4" />
            Parameter Jaringan & Penanggung Jawab
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Alamat IP Jaringan (Opsional)
              </label>
              <input
                type="text"
                name="ip_address"
                placeholder="Contoh: 192.168.1.50"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <p className="text-[10px] text-text-muted">Diisi jika perangkat terhubung ke jaringan IP (Smart CCTV/DVR).</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Vendor / Teknisi Penanggung Jawab
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-4 top-3.5 text-text-muted" />
                <input
                  type="text"
                  name="vendor_name"
                  placeholder="Nama mitra atau teknisi internal..."
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seksi 3: Jadwal Pemeliharaan (Maintenance) */}
        <div className="space-y-4 bg-background p-6 rounded-2xl border border-border">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 pb-2 border-b border-border/50">
            <Clock className="w-4 h-4" />
            Siklus Pemeliharaan (Maintenance Schedule)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Tanggal Perawatan Terakhir
              </label>
              <input
                type="date"
                name="last_maintenance_date"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Rencana Perawatan Berikutnya
              </label>
              <input
                type="date"
                name="next_maintenance_date"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-bold text-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
              />
              <p className="text-[10px] text-text-muted">Sistem akan memberi peringatan jika mendekati atau melewati tanggal ini.</p>
            </div>
          </div>
        </div>

        {/* Seksi 4: Catatan Khusus */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-text-muted" />
            Catatan Teknis / Deskripsi Posisi
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Tambahkan informasi spesifik posisi fisik, nomor seri, atau kelengkapan daya..."
            className="w-full p-4 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Fasilitas
          </button>
        </div>
      </form>
    </div>
  );
}
