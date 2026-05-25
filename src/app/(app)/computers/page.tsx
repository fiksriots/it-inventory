import { Plus, Monitor, Calendar, Eye, MapPin, HardDrive, Cpu, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteComputer } from "./actions";
import ExcelImportExport from "@/components/ui/ExcelImportExport";
import { getAllComputersForExport, importComputersBulk } from "@/app/(app)/services/import-export-actions";

const computerTemplate = [
  {
    "Nama Komputer": "PC-DEVELOPMENT-01",
    "Nomor Aset": "-AUTO",
    "Lokasi": "Server Room",
    "User Assigned": "Budi Santoso",
    "Alamat IP": "192.168.2.10",
    "Sistem Operasi": "Windows 11 Pro",
    "Processor": "Intel Core i7-12700",
    "RAM": "16GB DDR4",
    "Storage": "512GB NVMe SSD",
    "Status": "Aktif",
    "Terakhir Maintenance": "2026-05-01",
    "Maintenance Berikutnya": "2026-11-01",
    "Catatan": "Kondisi sangat baik, RAM baru diupgrade."
  },
  {
    "Nama Komputer": "LAPTOP-MARKETING-02",
    "Nomor Aset": "-AUTO",
    "Lokasi": "Lantai 2",
    "User Assigned": "Siti Rahma",
    "Alamat IP": "192.168.2.35",
    "Sistem Operasi": "Windows 11 Pro",
    "Processor": "Intel Core i5-1135G7",
    "RAM": "8GB DDR4",
    "Storage": "256GB SSD",
    "Status": "Aktif",
    "Terakhir Maintenance": "2026-04-10",
    "Maintenance Berikutnya": "2026-10-10",
    "Catatan": "Layar bersih, keyboard normal."
  }
];

export default async function ComputersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; page?: string }>;
}) {
  const { q, location, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 6;
  const supabase = await createClient();

  let query = supabase
    .from("computers")
    .select("*, locations(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,asset_number.ilike.%${q}%,user_assigned.ilike.%${q}%,ip_address.ilike.%${q}%`);
  }

  if (location) {
    const { data: subLocs } = await supabase
      .from("locations")
      .select("id")
      .eq("parent_id", location);
    
    const locationIds = [location, ...(subLocs?.map(l => l.id) || [])];
    query = query.in("location_id", locationIds);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: computers, count } = await query.range(from, to);

  // Ambil daftar lokasi untuk opsi filter
  const { data: locations } = await supabase.from("locations").select("id, name, parent_id, parent:parent_id(name)").order("name");

  // Ambil data untuk ringkasan metrik dan hitung lokasi
  const { data: allComps } = await supabase.from("computers").select("status, next_maintenance_date, location_id");

  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 14); // 14 hari dari sekarang

  const totalComps = allComps?.length || 0;
  const activeComps = allComps?.filter(c => c.status === 'Aktif').length || 0;
  const maintenanceComps = allComps?.filter(c => c.status === 'Maintenance').length || 0;
  const rusakComps = allComps?.filter(c => c.status === 'Rusak').length || 0;

  // Hitung yang perlu maintenance (status Maintenance atau tanggal mendekati)
  const urgentMaintenance = allComps?.filter(c => {
    if (c.status === 'Maintenance') return true;
    if (c.next_maintenance_date) {
      const nextDate = new Date(c.next_maintenance_date);
      return nextDate <= warningThreshold;
    }
    return false;
  }).length || 0;

  const totalPages = Math.ceil((count || 0) / pageSize);

  // Hitung jumlah komputer per lokasi (termasuk sub-lokasi)
  const computerCountsByLocation: Record<string, number> = {};
  const directComputerCounts: Record<string, number> = {};
  allComps?.forEach(c => {
    if (c.location_id) {
      directComputerCounts[c.location_id] = (directComputerCounts[c.location_id] || 0) + 1;
    }
  });

  locations?.forEach(loc => {
    let count = directComputerCounts[loc.id] || 0;
    const children = locations.filter(l => l.parent_id === loc.id);
    children.forEach(child => {
      count += (directComputerCounts[child.id] || 0);
    });
    computerCountsByLocation[loc.id] = count;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {location && (
            <Link
              href="/locations"
              className="p-2 bg-surface hover:bg-background border border-border rounded-xl text-text-muted hover:text-primary transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0"
              title="Kembali ke Departemen & Lokasi"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary animate-pulse" />
              Data Aset Komputer
            </h1>
            <p className="text-text-muted mt-1">Pemetaan spesifikasi PC/Laptop dan jadwal maintenance berkala.</p>
          </div>
        </div>
        <Link href="/computers/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95">
          <Plus className="w-5 h-5" />
          Registrasi Komputer Baru
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/30 transition-all">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            Total Komputer
          </p>
          <p className="text-3xl font-black mt-2 text-foreground">{totalComps}</p>
          <p className="text-[10px] text-text-muted mt-1 font-medium">{activeComps} unit aktif beroperasi</p>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 shadow-sm group hover:border-emerald-500/30 transition-all">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Status Aktif
          </p>
          <p className="text-3xl font-black mt-2 text-emerald-600">{activeComps}</p>
          <p className="text-[10px] text-emerald-600/70 mt-1 font-medium">Siap digunakan staf</p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 shadow-sm group hover:border-amber-500/30 transition-all">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Perlu Perawatan
          </p>
          <p className="text-3xl font-black mt-2 text-amber-600">{urgentMaintenance}</p>
          <p className="text-[10px] text-amber-600/70 mt-1 font-medium">Jadwal dalam 14 hari ke depan</p>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 shadow-sm group hover:border-rose-500/30 transition-all">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Kondisi Rusak
          </p>
          <p className="text-3xl font-black mt-2 text-rose-600">{rusakComps}</p>
          <p className="text-[10px] text-rose-600/70 mt-1 font-medium">Menunggu perbaikan/penggantian</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-md">
            <div className="flex-1">
              <SearchInput placeholder="Cari nama, nomor aset, pengguna, atau IP..." />
            </div>
            {/* Lokasi Filter Dropdown */}
            {locations && locations.length > 0 && (
              <form method="GET" className="w-full sm:w-auto flex gap-1.5">
                {q && <input type="hidden" name="q" value={q} />}
                <select
                  name="location"
                  defaultValue={location || ""}
                  className="w-full sm:w-48 bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer h-full min-h-[38px]"
                >
                  <option value="">Semua Lokasi ({totalComps} unit)</option>
                  {locations.map((loc) => {
                    const cnt = computerCountsByLocation[loc.id] || 0;
                    const parentObj = loc.parent as any;
                    const parentName = Array.isArray(parentObj) ? parentObj[0]?.name : parentObj?.name;
                    const displayName = parentName ? `${parentName} › ${loc.name}` : loc.name;
                    return (
                      <option key={loc.id} value={loc.id}>
                        {displayName} ({cnt} unit)
                      </option>
                    );
                  })}
                </select>
                <button type="submit" className="px-3 py-2 bg-surface hover:bg-background border border-border rounded-xl text-xs font-bold text-text-muted transition-colors shrink-0">
                  Filter
                </button>
              </form>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <ExcelImportExport
              exportAction={getAllComputersForExport}
              importAction={importComputersBulk}
              templateData={computerTemplate}
              fileName="Data_PC"
              buttonLabel="Komputer"
            />
            <Pagination totalPages={totalPages} currentPage={currentPage} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Identitas Perangkat</th>
                <th className="px-6 py-4 font-bold">Lokasi & Pengguna</th>
                <th className="px-6 py-4 font-bold">Spesifikasi Inti</th>
                <th className="px-6 py-4 font-bold">Alamat IP</th>
                <th className="px-6 py-4 font-bold">Jadwal Maintenance</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {computers && computers.length > 0 ? (
                computers.map((comp: any) => {
                  let isMaintenanceUrgent = false;
                  if (comp.next_maintenance_date) {
                    const nDate = new Date(comp.next_maintenance_date);
                    if (nDate <= warningThreshold) isMaintenanceUrgent = true;
                  }

                  return (
                    <tr key={comp.id} className="hover:bg-background/40 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                            <Monitor className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-foreground group-hover:text-primary transition-colors">{comp.name}</p>
                            <p className="text-xs text-text-muted font-mono mt-0.5">{comp.asset_number}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                          {comp.locations?.name || "Belum Dipetakan"}
                        </p>
                        {comp.user_assigned && (
                          <p className="text-[11px] text-text-muted mt-1 font-medium">User: {comp.user_assigned}</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-xs">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1 truncate" title={comp.operating_system}>
                            <span className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-text-muted font-mono">OS</span>
                            {comp.operating_system || "-"}
                          </p>
                          <p className="text-[11px] text-text-muted flex items-center gap-2 truncate" title={`${comp.processor || ''} | ${comp.ram || ''}`}>
                            <Cpu className="w-3 h-3 text-text-muted shrink-0" />
                            <span>{comp.processor || "-"} | <strong className="text-foreground">{comp.ram || "-"}</strong></span>
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs font-bold text-text-muted">
                        {comp.ip_address ? (
                          <span className="bg-surface px-2 py-1 rounded-md border border-border">{comp.ip_address}</span>
                        ) : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <Calendar className={`w-3.5 h-3.5 ${isMaintenanceUrgent ? 'text-amber-500 animate-bounce' : 'text-text-muted'}`} />
                          <span className={isMaintenanceUrgent ? 'text-amber-600' : 'text-foreground'}>
                            {comp.next_maintenance_date ? new Date(comp.next_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "Belum Dijadwalkan"}
                          </span>
                        </div>
                        {comp.last_maintenance_date && (
                          <p className="text-[10px] text-text-muted mt-0.5">Terakhir: {new Date(comp.last_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest inline-block ${
                          comp.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          comp.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          comp.status === 'Rusak' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-surface text-text-muted border-border'
                        }`}>
                          {comp.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link 
                            href={`/computers/${comp.id}`}
                            className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            title="Detail & Update Jadwal"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <DeleteButton id={comp.id} label={`komputer ${comp.name}`} onDelete={deleteComputer} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <Monitor className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Belum ada aset komputer yang terdaftar</p>
                      <p className="text-sm opacity-50 mt-1">Klik tombol "Registrasi Komputer Baru" untuk memulai pendataan infrastruktur IT.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-muted bg-surface/50 uppercase tracking-widest">
          <p>Total <span className="text-foreground">{count || 0}</span> aset komputer terpetakan</p>
        </div>
      </div>
    </div>
  );
}
