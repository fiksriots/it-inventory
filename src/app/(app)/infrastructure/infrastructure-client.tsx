"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Search, Filter, Layers, CheckCircle2, AlertTriangle, XCircle, Clock, MapPin, Cctv, Video, Wrench, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import ExcelImportExport from "@/components/ui/ExcelImportExport";
import { getAllInfrastructureForExport, importInfrastructureBulk } from "@/app/(app)/services/import-export-actions";
import { updateAssetsCategory } from "./actions";

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
  const locationParam = searchParams?.get("location") || "Semua";
  const categoryParam = searchParams?.get("category") || "Semua";
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedLocation, setSelectedLocation] = useState(locationParam);
  const { toast } = useToast();

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "Semua") {
      params.set("category", selectedCategory);
    }
    if (selectedLocation && selectedLocation !== "Semua") {
      params.set("location", selectedLocation);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [selectedCategory, selectedLocation, pathname, router]);

  // Sync state from URL (handles back/forward navigation)
  useEffect(() => {
    setSelectedCategory(searchParams?.get("category") || "Semua");
    setSelectedLocation(searchParams?.get("location") || "Semua");
  }, [searchParams]);

  const [localCustomCategories, setLocalCustomCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load custom categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("infra_custom_categories");
    if (saved) {
      try {
        setLocalCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Ambil kategori unik yang ada di database + kategori default
  const defaultCategories = ["CCTV", "DVR", "Gate/Portal", "AC/Pendingin", "Lainnya"];
  const dbCategories = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));
  
  // Gabungkan dan hilangkan duplikasi, urutkan
  const categories = [
    "Semua",
    ...Array.from(new Set([...defaultCategories, ...dbCategories, ...localCustomCategories]))
  ];

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    
    // Check if category already exists
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      toast("Kategori sudah ada!", "error");
      return;
    }

    const updated = [...localCustomCategories, name];
    setLocalCustomCategories(updated);
    localStorage.setItem("infra_custom_categories", JSON.stringify(updated));
    setSelectedCategory(name);
    setNewCategoryName("");
    setIsAddCategoryOpen(false);
    toast(`Kategori "${name}" berhasil ditambahkan!`, "success");
  };

  const handleDeleteCategory = async () => {
    if (selectedCategory === "Semua") return;

    // Check if assets are using it
    const affectedAssets = assets.filter(a => a.category === selectedCategory);
    const count = affectedAssets.length;

    let confirmMsg = `Apakah Anda yakin ingin menghapus kategori "${selectedCategory}"?`;
    if (count > 0) {
      confirmMsg = `Kategori "${selectedCategory}" sedang digunakan oleh ${count} perangkat. Menghapus kategori ini akan memindahkan perangkat-perangkat tersebut ke kategori "Lainnya". Apakah Anda yakin?`;
    }

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        if (count > 0) {
          // Panggil server action untuk update database
          await updateAssetsCategory(selectedCategory, "Lainnya");
        }

        // Hapus dari localStorage/local state jika ada
        const updated = localCustomCategories.filter(c => c !== selectedCategory);
        setLocalCustomCategories(updated);
        localStorage.setItem("infra_custom_categories", JSON.stringify(updated));

        setSelectedCategory("Semua");
        toast(`Kategori "${selectedCategory}" berhasil dihapus!`, "success");
        router.refresh();
      } catch (err: any) {
        toast(err.message || "Gagal menghapus kategori", "error");
      }
    });
  };

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
          href={`/infrastructure/new?location=${selectedLocation}&category=${selectedCategory}`}
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

      {/* Category Dropdown & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full border-b border-border/30 pb-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-72 relative">
            <Layers className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-surface border border-border rounded-xl text-sm font-bold text-foreground cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
            >
              {categories.map((cat) => {
                const count = cat === "Semua" ? totalAssets : assets.filter(a => a.category === cat).length;
                return (
                  <option key={cat} value={cat} className="bg-surface text-foreground font-semibold">
                    Kategori: {cat} ({count})
                  </option>
                );
              })}
            </select>
            {/* Custom Chevron Down */}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.576 0 0.436 0.445 0.408 1.197 0 1.615l-4.695 4.502c-0.218 0.209-0.507 0.313-0.789 0.313s-0.571-0.104-0.789-0.313l-4.695-4.502c-0.408-0.418-0.436-1.17 0-1.615z"/>
              </svg>
            </div>
          </div>

          {/* Add Category Button */}
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="p-3 bg-surface hover:bg-primary/5 border border-border hover:border-primary/20 rounded-xl text-text-muted hover:text-primary transition-all active:scale-95 shrink-0 flex items-center gap-1.5 font-bold text-xs"
            title="Tambah Kategori Baru"
          >
            <Plus className="w-4.5 h-4.5 text-primary" />
            <span>Tambah</span>
          </button>

          {/* Delete Category Button */}
          {selectedCategory !== "Semua" && (
            <button
              onClick={handleDeleteCategory}
              disabled={isPending}
              className="p-3 bg-surface hover:bg-rose-500/10 border border-border hover:border-rose-500/20 rounded-xl text-text-muted hover:text-rose-500 transition-all active:scale-95 shrink-0 flex items-center gap-1.5 font-bold text-xs disabled:opacity-50"
              title={`Hapus Kategori "${selectedCategory}"`}
            >
              {isPending ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Trash2 className="w-4.5 h-4.5 text-rose-500" />
              )}
              <span>Hapus</span>
            </button>
          )}
        </div>
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
              const displayName = loc.parent ? `${loc.parent.name} › ${loc.name}` : loc.name;
              return (
                <option key={loc.id} value={loc.id}>
                  {displayName} ({count} perangkat)
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
                        {asset.locations ? (
                          asset.locations.parent ? (
                            <span>
                              {asset.locations.parent.name} › <span className="text-foreground font-semibold">{asset.locations.name}</span>
                            </span>
                          ) : (
                            <span>{asset.locations.name}</span>
                          )
                        ) : (
                          "Belum Ditentukan"
                        )}
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

      {/* Modal Tambah Kategori */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Tambah Kategori Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 text-text-muted hover:text-foreground rounded-lg hover:bg-background transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Router, Server, UPS, Access Point"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-text-muted/40"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2.5 bg-background border border-border text-text-muted hover:text-foreground rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10"
                >
                  Tambah Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
