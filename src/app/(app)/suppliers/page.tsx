import { Plus, Users, Mail, Phone, MapPin, PackageX, Edit, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteSupplier } from "./actions";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  let query = supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: suppliers, error, count } = await query.range(from, to);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Daftar Supplier</h1>
          <p className="text-text-muted mt-1">Kelola data vendor dan pemasok barang IT Anda.</p>
        </div>
        <Link href="/suppliers/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Tambah Supplier
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <SearchInput placeholder="Cari nama supplier atau kontak..." />
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Nama Perusahaan</th>
                <th className="px-6 py-4 font-bold">Kontak Person</th>
                <th className="px-6 py-4 font-bold">Email & Telepon</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-background/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <Users className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white transition-colors">{supplier.name}</span>
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {supplier.address ? <span className="truncate max-w-[200px]">{supplier.address}</span> : "No Address"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted font-medium">{supplier.contact_person || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
                          <Mail className="w-3.5 h-3.5 text-primary/50" />
                          {supplier.email || "-"}
                        </div>
                        <div className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
                          <Phone className="w-3.5 h-3.5 text-primary/50" />
                          {supplier.phone || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/suppliers/${supplier.id}/edit`}
                          className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <DeleteButton id={supplier.id} label={`supplier "${supplier.name}"`} onDelete={deleteSupplier} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-text-muted bg-background/20">
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
          <p>Total <span className="text-white">{count || 0}</span> supplier ditemukan</p>
        </div>
      </div>
    </div>
  );
}
