import { Plus, MapPin, PackageX, Edit, ShoppingCart, Monitor, Cctv } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteLocation, getLocationItems } from "./actions";
import LocationItemsModal from "./location-items-modal";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  let query = supabase
    .from("locations")
    .select("*, parent:parent_id(name), item_stocks(quantity), computers(id), infrastructure_assets(id)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: locations, error, count } = await query.range(from, to);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departemen & Lokasi</h1>
          <p className="text-text-muted mt-1">Kelola daftar departemen dan lokasi penyimpanan barang.</p>
        </div>
        <Link href="/locations/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Tambah Lokasi
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <SearchInput placeholder="Cari lokasi..." />
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold w-1/4">Nama Departemen / Lokasi</th>
                <th className="px-6 py-4 font-bold">Alamat / Detail</th>
                <th className="px-6 py-4 font-bold text-center">Total Barang</th>
                <th className="px-6 py-4 font-bold text-center">Komputer</th>
                <th className="px-6 py-4 font-bold text-center">Infrastruktur</th>
                <th className="px-6 py-4 font-bold text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locations && locations.length > 0 ? (
                locations.map((location: any) => (
                  <tr key={location.id} className="hover:bg-background/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary transition-all">
                          <MapPin className="w-5 h-5 text-primary transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold transition-colors">{location.name}</span>
                          {location.parent && (
                            <span className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1 font-semibold">
                              <span>Sub dari:</span>
                              <span className="underline decoration-dotted">{location.parent.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-medium">{location.address || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <LocationItemsModal 
                        locationId={location.id} 
                        locationName={location.name}
                        totalItems={location.item_stocks?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/computers?location=${location.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-primary/40 hover:text-primary transition-all text-xs font-bold font-mono"
                      >
                        <Monitor className="w-3.5 h-3.5 text-primary" />
                        <span>{location.computers?.length || 0} Unit</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/infrastructure?location=${location.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-blue-500/40 hover:text-blue-500 transition-all text-xs font-bold font-mono"
                      >
                        <Cctv className="w-3.5 h-3.5 text-blue-500" />
                        <span>{location.infrastructure_assets?.length || 0} Unit</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/locations/${location.id}/edit`}
                          className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <DeleteButton id={location.id} label={`lokasi "${location.name}"`} onDelete={deleteLocation} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Tidak ada data ditemukan</p>
                      <p className="text-sm opacity-50 mt-1">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-muted bg-surface/50 uppercase tracking-widest">
          <p>Total <span className="text-primary font-bold">{count || 0}</span> lokasi ditemukan</p>
        </div>
      </div>
    </div>
  );
}
