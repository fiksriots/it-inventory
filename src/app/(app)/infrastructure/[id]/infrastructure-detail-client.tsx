"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Edit3, CheckCircle2, Clock, MapPin, Globe, Users, Cctv, Video, Wrench, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { updateInfrastructure, updateInfraSchedule, deleteInfrastructure } from "../actions";
import { useToast } from "@/components/ui/ToastProvider";

interface InfrastructureDetailClientProps {
  asset: any;
  locations: any[];
}

export default function InfrastructureDetailClient({ asset, locations }: InfrastructureDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isOverdue = asset.next_maintenance_date && new Date(asset.next_maintenance_date) < new Date();

  // Handle jadwal perawatan
  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await updateInfraSchedule(asset.id, formData);

      toast("Jadwal pemeliharaan berhasil diperbarui!", "success");
      router.refresh();
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui jadwal", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle penyelesaian maintenance instan
  const handleCompleteMaintenance = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Set berikutnya ke 3 bulan ke depan
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      const formData = new FormData();
      formData.append("last_maintenance_date", today);
      formData.append("next_maintenance_date", nextDateStr);
      formData.append("status", "Aktif");

      await updateInfraSchedule(asset.id, formData);
      toast("Siklus perawatan berhasil diselesaikan! Jadwal berikutnya diset otomatis.", "success");
      router.refresh();
    } catch (error: any) {
      toast("Gagal mencatat penyelesaian maintenance", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle update spesifikasi
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await updateInfrastructure(asset.id, formData);

      toast("Identitas fasilitas berhasil diperbarui!", "success");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui identitas", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle hapus fasilitas
  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data fasilitas ${asset.name}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setDeleteLoading(true);
    try {
      await deleteInfrastructure(asset.id);
      toast("Fasilitas berhasil dihapus dari sistem.", "success");
      router.push("/infrastructure");
    } catch (error: any) {
      toast("Gagal menghapus fasilitas", "error");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upper Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/infrastructure"
            className="p-2.5 bg-background border border-border rounded-xl text-text-muted hover:text-foreground hover:bg-surface transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {asset.asset_number}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 ${asset.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500' :
                  asset.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                    asset.status === 'Rusak' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-background text-text-muted'
                }`}>
                {asset.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground mt-1">{asset.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${isEditing ? "bg-amber-500 text-white" : "bg-background border border-border text-foreground hover:bg-surface"
              }`}
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? "Batal Edit" : "Edit Spesifikasi"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="Hapus Fasilitas"
          >
            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Rincian & Identitas Keras */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted pb-3 border-b border-border/50">
              Profil Perangkat Fisik
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                  {asset.category === 'CCTV' ? <Cctv className="w-4 h-4" /> :
                    asset.category === 'DVR' ? <Video className="w-4 h-4" /> :
                      <Wrench className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Kategori Fasilitas</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{asset.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Penempatan Fisik</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {asset.locations?.name || "Belum Ditetapkan / Ruang Publik"}
                  </p>
                </div>
              </div>

              {asset.ip_address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Alamat IP / Akses Remote</p>
                    <p className="text-sm font-mono font-bold text-foreground mt-0.5">{asset.ip_address}</p>
                  </div>
                </div>
              )}

              {asset.vendor_name && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Penanggung Jawab / Mitra</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{asset.vendor_name}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Catatan Khusus
                </p>
                <p className="text-xs bg-background p-3 rounded-xl border border-border text-foreground whitespace-pre-line leading-relaxed">
                  {asset.notes || "Tidak ada rincian teknis khusus yang disematkan."}
                </p>
              </div>

              <div className="pt-2 text-[10px] text-text-muted text-right">
                Terdaftar: {new Date(asset.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kontrol Jadwal & Pengubah Spesifikasi */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            /* Panel Form Edit Spesifikasi Pokok */
            <form onSubmit={handleEditSubmit} className="bg-surface border border-primary/40 rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in duration-300">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-border">
                <Edit3 className="w-4 h-4" />
                Perbarui Identitas Fasilitas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Nama Fasilitas</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={asset.name}
                    required
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Kategori</label>
                  <select
                    name="category"
                    defaultValue={asset.category}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="CCTV">CCTV</option>
                    <option value="DVR">DVR</option>
                    <option value="Gate/Portal">Gate/Portal</option>
                    <option value="AC/Pendingin">AC/Pendingin</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Penempatan Lokasi</label>
                  <select
                    name="location_id"
                    defaultValue={asset.location_id || ""}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="">Tanpa Lokasi Spesifik</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Status Awal Operasional</label>
                  <select
                    name="status"
                    defaultValue={asset.status}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Alamat IP / Jaringan</label>
                  <input
                    type="text"
                    name="ip_address"
                    defaultValue={asset.ip_address || ""}
                    placeholder="192.168.x.x"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Pihak Vendor / Teknisi</label>
                  <input
                    type="text"
                    name="vendor_name"
                    defaultValue={asset.vendor_name || ""}
                    placeholder="Nama vendor eksternal..."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Catatan Rincian Tambahan</label>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={asset.notes || ""}
                    className="w-full p-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-background border border-border text-xs font-bold rounded-xl hover:bg-surface transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Spesifikasi
                </button>
              </div>
            </form>
          ) : null}

          {/* Panel Kontrol & Riwayat Jadwal Perawatan */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/50">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Manajemen Siklus Perawatan
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Kelola tanggal penyelesaian dan pembaruan berkala fasilitas.</p>
              </div>

              <button
                onClick={handleCompleteMaintenance}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                title="Tandai Selesai & Perpanjang 3 Bulan"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesai Maintenance Hari Ini
              </button>
            </div>

            {/* Status Notifikasi Terlewat */}
            {isOverdue && (
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-start gap-3 text-rose-500 animate-in fade-in duration-300">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">Perhatian: Tanggal Perawatan Telah Lewat!</p>
                  <p className="text-[11px] text-rose-500/80 leading-relaxed">
                    Jadwal perawatan berkala fasilitas ini jatuh pada tanggal <strong>{new Date(asset.next_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Segera lakukan inspeksi teknis untuk menjaga keamanan sistem.
                  </p>
                </div>
              </div>
            )}

            {/* Form Ubah Jadwal Eksplisit */}
            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Perawatan Terakhir</label>
                  <input
                    type="date"
                    name="last_maintenance_date"
                    defaultValue={asset.last_maintenance_date || ""}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Jadwal Perawatan Berikutnya</label>
                  <input
                    type="date"
                    name="next_maintenance_date"
                    defaultValue={asset.next_maintenance_date || ""}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Perbarui Status Operasional</label>
                  <select
                    name="status"
                    defaultValue={asset.status}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="Aktif">Aktif (Kondisi Prima)</option>
                    <option value="Maintenance">Maintenance (Sedang Diperiksa/Diperbaiki)</option>
                    <option value="Rusak">Rusak (Perlu Penggantian Unit)</option>
                    <option value="Nonaktif">Nonaktif (Dihentikan Sementara)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-background hover:bg-surface text-foreground font-bold text-xs rounded-xl border border-border transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 text-amber-500" />}
                  Simpan Perubahan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
