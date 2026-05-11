import { Plus, MapPin, PackageX, Edit, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteLocation } from "./actions";
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
    .select("*", { count: "exact" })
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Departemen & Lokasi</h1>
          <p className="text-text-muted mt-1">Kelola daftar departemen atau lokasi penempatan barang.</p>
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
                <th className="px-6 py-4 font-bold w-1/3">Nama Departemen / Lokasi</th>
                <th className="px-6 py-4 font-bold">Alamat / Detail</th>
                <th className="px-6 py-4 font-bold text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locations && locations.length > 0 ? (
                locations.map((location: any) => (
                  <tr key={location.id} className="hover:bg-background/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                          <MapPin className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-bold text-white transition-colors">{location.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-medium">{location.address || "-"}</td>
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
                  <td colSpan={3} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-white/50">Tidak ada data ditemukan</p>
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
          <p>Total <span className="text-white">{count || 0}</span> lokasi ditemukan</p>
        </div>
      </div>
    </div>
  );
}
