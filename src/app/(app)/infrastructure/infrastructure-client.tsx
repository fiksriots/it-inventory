"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Filter, Layers, CheckCircle2, AlertTriangle, XCircle, Clock, MapPin, Cctv, Video, Wrench, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import ExcelImportExport from "@/components/ui/ExcelImportExport";
import { getAllInfrastructureForExport, importInfrastructureBulk } from "@/app/(app)/services/import-export-actions";

const infraTemplate = [
  {
    "Nama Fasilitas": "CCTV Lobby Utama",
    "Nomor Aset": "-AUTO",
    "Kategori": "CCTV",
    "Lokasi": "Lobby",
    "Status": "Aktif",
    "Alamat IP": "192.168.2.50",
    "Vendor / Teknisi": "PT Security System Indo",
    "Terakhir Maintenance": "2026-04-15",
    "Maintenance Berikutnya": "2026-10-15",
    "Catatan": "Kamera diganti baru, lensa dibersihkan."
  },
  {
    "Nama Fasilitas": "AC Server Room 1",
    "Nomor Aset": "-AUTO",
    "Kategori": "AC/Pendingin",
    "Lokasi": "Server Room",
    "Status": "Aktif",
    "Alamat IP": "-",
    "Vendor / Teknisi": "Sinar Jaya AC",
    "Terakhir Maintenance": "2026-05-01",
    "Maintenance Berikutnya": "2026-08-01",
    "Catatan": "Pengisian freon dan cuci blower."
  }
];

interface InfrastructureClientProps {
  assets: any[];
  locations: any[];
}

export default function InfrastructureClient({ assets, locations }: InfrastructureClientProps) {
  const searchParams = useSearchParams();
  const locationParam = searchParams?.get("location");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedLocation, setSelectedLocation] = useState(locationParam || "Semua");
  const { toast } = useToast();

  // Ambil kategori unik yang ada di database + kategori default
  const defaultCategories = ["CCTV", "DVR", "Gate/Portal", "AC/Pendingin", "Lainnya"];
  const dbCategories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));
  
  // Gabungkan dan hilangkan duplikasi, urutkan
  const categories = ["Semua", ...Array.from(new Set([...defaultCategories, ...dbCategories]))];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ip_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "Semua" || asset.category === selectedCategory;
    const matchesLocation = selectedLocation === "Semua" || asset.location_id === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Hitung statistik
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'Aktif').length;
  const maintenanceAssets = assets.filter(a => a.status === 'Maintenance').length;
  const brokenAssets = assets.filter(a => a.status === 'Rusak').length;

  // Hitung jumlah perangkat per lokasi
  const assetCountsByLocation: Record<string, number> = {};
  assets.forEach(a => {
    if (a.location_id) {
      assetCountsByLocation[a.location_id] = (assetCountsByLocation[a.location_id] || 0) + 1;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {locationParam && (
            <Link
              href="/locations"
              className="p-2.5 bg-surface hover:bg-background border border-border/80 hover:border-primary/30 rounded-xl text-text-muted hover:text-primary transition-all active:scale-95 shadow-sm flex items-center justify-center shrink-0"
              title="Kembali ke Departemen & Lokasi"
            >
              <ArrowLeft className="w-5.5 h-5.5" />
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <Cctv className="w-7 h-7" />
              </div>
              Infrastruktur & Fasilitas Fisik
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Pantau dan jadwalkan pemeliharaan berkala untuk CCTV, DVR, Portal Gate, serta perangkat fasilitas gedung lainnya.
            </p>
          </div>
        </div>
        <Link
          href="/infrastructure/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Registrasi Fasilitas
        </Link>
      </div>

      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Fasilitas</p>
            <p className="text-2xl font-black text-foreground">{totalAssets}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Beroperasi Aktif</p>
            <p className="text-2xl font-black text-emerald-500">{activeAssets}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Dalam Perawatan</p>
            <p className="text-2xl font-black text-amber-500">{maintenanceAssets}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex items-center gap-4 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Mengalami Kendala</p>
            <p className="text-2xl font-black text-rose-500">{brokenAssets}</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full border-b border-border/30 pb-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const count = cat === "Semua" ? totalAssets : assets.filter(a => a.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-surface text-text-muted border-border hover:bg-background hover:text-foreground"
                }`}
              >
                {cat}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-background text-text-muted"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            toast("Untuk menambah kategori kustom baru, silakan klik 'Registrasi Fasilitas' lalu aktifkan '+ Kategori Kustom' pada form!", "success");
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary shrink-0 hover:scale-105 active:scale-95 sm:ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Kategori Baru
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama fasilitas, ID aset, atau alamat IP..."
            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="w-4 h-4 absolute left-4 top-3.5 text-text-muted" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-foreground cursor-pointer"
          >
            <option value="Semua">Semua Lokasi / Area ({totalAssets} perangkat)</option>
            {locations.map((loc) => {
              const count = assetCountsByLocation[loc.id] || 0;
              return (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({count} perangkat)
                </option>
              );
            })}
          </select>
        </div>
        <div className="w-full md:w-auto shrink-0 flex justify-end">
          <ExcelImportExport
            exportAction={getAllInfrastructureForExport}
            importAction={importInfrastructureBulk}
            templateData={infraTemplate}
            fileName="Data_Infrastruktur"
            buttonLabel="Fasilitas"
          />
        </div>
      </div>

      {/* Facilities Table / Grid */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-background text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
            <tr>
              <th className="px-6 py-4">Informasi Fasilitas</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Penempatan</th>
              <th className="px-6 py-4">Status Operasional</th>
              <th className="px-6 py-4">Jadwal Perawatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => {
                // Tentukan warna status
                const isOverdue = asset.next_maintenance_date && new Date(asset.next_maintenance_date) < new Date();
                
                return (
                  <tr key={asset.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/infrastructure/${asset.id}`} className="block">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-background text-primary border border-primary/20">
                          {asset.asset_number}
                        </span>
                        <p className="font-black text-foreground mt-1 group-hover:text-primary transition-colors">
                          {asset.name}
                        </p>
                        {asset.ip_address && (
                          <p className="text-xs text-text-muted mt-0.5 font-mono">
                            IP: {asset.ip_address}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-background border border-border text-foreground inline-flex items-center gap-1.5">
                        {asset.category === 'CCTV' ? <Cctv className="w-3.5 h-3.5 text-primary" /> :
                         asset.category === 'DVR' ? <Video className="w-3.5 h-3.5 text-blue-500" /> :
                         <Wrench className="w-3.5 h-3.5 text-amber-500" />}
                        {asset.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {asset.locations?.name || "Belum Ditentukan"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
                        asset.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500' :
                        asset.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                        asset.status === 'Rusak' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-background text-text-muted border border-border'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          asset.status === 'Aktif' ? 'bg-emerald-500' :
                          asset.status === 'Maintenance' ? 'bg-amber-500' :
                          asset.status === 'Rusak' ? 'bg-rose-500' :
                          'bg-text-muted'
                        }`}></span>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div className="space-y-1">
                        {asset.next_maintenance_date ? (
                          <div className={`flex items-center gap-1.5 font-bold ${
                            isOverdue ? 'text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/20 inline-flex' : 'text-foreground'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(asset.next_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            {isOverdue && <span className="text-[9px] uppercase tracking-tighter">(Terlewat)</span>}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Belum dijadwalkan</span>
                        )}
                        {asset.last_maintenance_date && (
                          <p className="text-[10px] text-text-muted">
                            Terakhir: {new Date(asset.last_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted italic">
                  Tidak ditemukan fasilitas fisik yang cocok dengan kriteria filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
