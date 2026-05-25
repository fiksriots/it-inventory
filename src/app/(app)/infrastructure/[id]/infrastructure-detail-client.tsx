"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Trash2, Edit3, CheckCircle2, Clock, MapPin, Globe, Users, Cctv, Video, Wrench, AlertTriangle, FileText, Loader2, Calendar, Plus, Trash, PlusCircle, Copy, Check, Image, FileImage, X, Eye, Pencil } from "lucide-react";
import { updateInfrastructure, updateInfraSchedule, deleteInfrastructure, createInfraMaintenanceLog, deleteInfraMaintenanceLog, updateInfraMaintenanceLog } from "../actions";
import { useToast } from "@/components/ui/ToastProvider";

interface InfrastructureDetailClientProps {
  asset: any;
  locations: any[];
  itemsList?: any[];
  maintenanceLogs: any[];
  dbTableMissing?: boolean;
}

export default function InfrastructureDetailClient({ asset, locations, itemsList = [], maintenanceLogs = [], dbTableMissing = false }: InfrastructureDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationParam = searchParams?.get("location") || "Semua";
  const categoryParam = searchParams?.get("category") || "Semua";

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectedCat, setSelectedCat] = useState(asset.category);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [hasPartReplacement, setHasPartReplacement] = useState(false);

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

  // Handle penyelesaian maintenance instan dengan pencatatan log otomatis
  const handleCompleteMaintenance = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Set berikutnya ke 3 bulan ke depan
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      const nextNum = maintenanceLogs.length + 1;
      const defaultTitle = `Maintenance ${nextNum}`;

      if (dbTableMissing) {
        // Fallback jika tabel log belum ada, update jadwal saja agar tidak error
        const formData = new FormData();
        formData.append("last_maintenance_date", today);
        formData.append("next_maintenance_date", nextDateStr);
        formData.append("status", "Aktif");
        await updateInfraSchedule(asset.id, formData);
        toast("Jadwal pemeliharaan diperbarui! (Keterangan: Database log belum dibuat)", "success");
      } else {
        const formData = new FormData();
        formData.append("maintenance_date", today);
        formData.append("maintenance_title", defaultTitle);
        formData.append("notes", "Penyelesaian perawatan berkala cepat (otomatis).");
        formData.append("performed_by", asset.vendor_name || "Internal IT");
        formData.append("status_after", "Aktif");
        formData.append("next_maintenance_date", nextDateStr);

        await createInfraMaintenanceLog(asset.id, formData);
        toast(`Siklus perawatan selesai! Log "${defaultTitle}" dicatat otomatis.`, "success");
      }
      router.refresh();
    } catch (error: any) {
      toast("Gagal mencatat penyelesaian maintenance", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLogSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLogLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      await createInfraMaintenanceLog(asset.id, formData);

      toast("Riwayat pemeliharaan berhasil dicatat!", "success");
      setIsAddingLog(false);
      clearImage();
      router.refresh();
    } catch (error: any) {
      toast(error.message || "Gagal mencatat riwayat pemeliharaan", "error");
    } finally {
      setLogLoading(false);
    }
  };

  const handleEditLogSubmit = async (e: React.FormEvent<HTMLFormElement>, logId: string) => {
    e.preventDefault();
    setLogLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (!imagePreview) {
        formData.append("remove_image", "true");
      }
      await updateInfraMaintenanceLog(logId, asset.id, formData);
      toast("Riwayat pemeliharaan berhasil diperbarui!", "success");
      setEditingLogId(null);
      clearImage();
      router.refresh();
    } catch (error: any) {
      toast(error.message || "Gagal memperbarui riwayat pemeliharaan", "error");
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
    try {
      await deleteInfraMaintenanceLog(logId, asset.id);
      toast("Catatan pemeliharaan berhasil dihapus.", "success");
      router.refresh();
    } catch (error: any) {
      toast("Gagal menghapus catatan pemeliharaan", "error");
    } finally {
      setLogLoading(false);
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
            href={`/infrastructure?location=${locationParam}&category=${categoryParam}`}
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
          {(asset.status === 'Rusak' || asset.status === 'Maintenance') && (
            <a
              href={`/services/new?prefill=infrastructure&prefill_id=${asset.id}&prefill_name=${encodeURIComponent(asset.name)}&prefill_asset_number=${encodeURIComponent(asset.asset_number || '')}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-95"
              title="Kirim Aset Ini ke Service"
            >
              <Wrench className="w-4 h-4" />
              Kirim ke Service
            </a>
          )}
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
                    {asset.locations ? (
                      asset.locations.parent ? (
                        <span>
                          {asset.locations.parent.name} › <span className="font-extrabold text-foreground">{asset.locations.name}</span>
                        </span>
                      ) : (
                        <span>{asset.locations.name}</span>
                      )
                    ) : (
                      "Belum Ditetapkan / Ruang Publik"
                    )}
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
                  <label className="text-xs font-bold text-text-muted uppercase flex justify-between items-center">
                    <span>Kategori</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[9px] text-primary hover:underline font-black uppercase tracking-wider cursor-pointer"
                    >
                      {isCustomCategory ? "Pilih" : "+ Kustom"}
                    </button>
                  </label>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      name="category"
                      required
                      defaultValue={asset.category}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Ketik kategori..."
                    />
                  ) : (
                    <select
                      name="category"
                      value={selectedCat}
                      onChange={(e) => setSelectedCat(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                      <option value="CCTV">CCTV</option>
                      <option value="DVR">DVR</option>
                      <option value="Gate/Portal">Gate/Portal</option>
                      <option value="AC/Pendingin">AC/Pendingin</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted uppercase">Penempatan Lokasi</label>
                  <select
                    name="location_id"
                    defaultValue={asset.location_id || ""}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="">Tanpa Lokasi Spesifik</option>
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

          {/* Panel Riwayat Pemeliharaan (Maintenance Logs) */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Riwayat Pemeliharaan & Perawatan
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Daftar rekam jejak histori perbaikan fasilitas (Maintenance 1, 2, 3).</p>
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
                    <h4 className="text-xs font-black uppercase tracking-wider">Inisialisasi Tabel Riwayat Diperlukan</h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                      Fitur penyimpanan riwayat pemeliharaan memerlukan tabel database baru <code>infrastructure_maintenance_logs</code>. Silakan salin dan jalankan perintah SQL berikut di <strong>SQL Editor Supabase Dashboard</strong> Anda, lalu muat ulang halaman ini.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <pre className="text-[10px] bg-background border border-border p-3.5 rounded-xl overflow-x-auto text-foreground font-mono select-all leading-normal max-h-48 overflow-y-auto">
{`CREATE TABLE IF NOT EXISTS public.infrastructure_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_title TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT,
  status_after TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON TABLE public.infrastructure_maintenance_logs TO anon, authenticated, service_role;
ALTER TABLE public.infrastructure_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.infrastructure_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.infrastructure_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.infrastructure_maintenance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.infrastructure_maintenance_logs FOR DELETE USING (true);
NOTIFY pgrst, 'reload schema';`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.infrastructure_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_title TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT,
  status_after TEXT DEFAULT 'Aktif',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON TABLE public.infrastructure_maintenance_logs TO anon, authenticated, service_role;
ALTER TABLE public.infrastructure_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.infrastructure_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.infrastructure_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.infrastructure_maintenance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.infrastructure_maintenance_logs FOR DELETE USING (true);
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
                          placeholder="Contoh: Maintenance 1, Pembersihan CCTV, Ganti Kabel"
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
                          defaultValue={asset.vendor_name || "Internal IT"}
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
                          <option value="Nonaktif">Nonaktif (Dinonaktifkan)</option>
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
                                {locations.map((loc: any) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>
                            <p className="text-[10px] text-amber-600/70 sm:col-span-3">
                              *Stok di gudang sumber akan dikurangi. Suku cadang lama akan otomatis dipindahkan ke "Gudang Rusak".
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Catatan & Temuan Teknis</label>
                        <textarea
                          name="notes"
                          rows={2}
                          placeholder="Jelaskan apa yang dibersihkan, diperbaiki, atau diperiksa..."
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
                                <option value="Nonaktif">Nonaktif (Dihapus/Nonaktif)</option>
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
                          Catat pemeliharaan pertama untuk CCTV, DVR, atau Portal Gate ini untuk melacak histori kondisinya.
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
        </div>
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
    </div>
  );
}
