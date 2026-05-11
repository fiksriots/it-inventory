import { ShoppingCart, Plus, Eye, Calendar, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import POSearch from "./po-search";
import POFilter from "./po-filter";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  // We use the view if it exists, otherwise fall back to table
  // For the sake of this implementation, we assume the user runs the migration for 'purchase_orders_view'
  let query = supabase
    .from("purchase_orders_view")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (q) {
    // Now we can search across po_number, department, and supplier_name thanks to the View
    query = query.or(`po_number.ilike.%${q}%,department.ilike.%${q}%,supplier_name.ilike.%${q}%,location_name.ilike.%${q}%`);
  }

  // Pagination Range
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data: pos, error, count } = await query.range(from, to);

  // Stats (total counts per status)
  const { data: allPos } = await supabase.from("purchase_orders").select("status");

  const statuses = [
    { label: "Draft", count: allPos?.filter(p => p.status === 'Draft').length || 0, color: "text-text-muted", bg: "bg-surface" },
    { label: "Menunggu Persetujuan", count: allPos?.filter(p => p.status === 'Menunggu Persetujuan').length || 0, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Disetujui", count: allPos?.filter(p => p.status === 'Disetujui').length || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Selesai", count: allPos?.filter(p => p.status === 'Selesai').length || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-text-muted mt-1">Kelola dokumen pembelian barang ke supplier.</p>
        </div>
        <Link href="/po/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Buat PO Baru
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((s, i) => (
          <div key={i} className={`${s.bg} border border-border rounded-xl p-5 shadow-sm group hover:border-primary/30 transition-all`}>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <POSearch />
            <POFilter />
          </div>
          
          <div className="text-xs text-text-muted flex items-center gap-4">
            {(q || status) && (
              <div className="hidden sm:block">
                Hasil: <span className="text-primary font-bold">{count || 0}</span> data
              </div>
            )}
            <div className="bg-background/50 border border-border px-3 py-1.5 rounded-lg flex items-center gap-3">
              <span className="font-medium">Halaman <span className="text-white">{currentPage}</span> dari {totalPages || 1}</span>
              <div className="flex items-center border-l border-border pl-3 gap-1">
                <Link 
                  href={{ query: { ... (q ? {q} : {}), ... (status ? {status} : {}), page: Math.max(1, currentPage - 1) } }}
                  className={`p-1 rounded hover:bg-surface transition-colors ${currentPage <= 1 ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link 
                  href={{ query: { ... (q ? {q} : {}), ... (status ? {status} : {}), page: Math.min(totalPages, currentPage + 1) } }}
                  className={`p-1 rounded hover:bg-surface transition-colors ${currentPage >= totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Nomor PO</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Supplier</th>
                <th className="px-6 py-4 font-bold">Departemen</th>
                <th className="px-6 py-4 font-bold text-right">Total Nilai</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pos && pos.length > 0 ? (
                pos.map((po: any) => (
                  <tr key={po.id} className="hover:bg-background/50 transition-all group">
                    <td className="px-6 py-4">
                      <span className="font-bold group-hover:text-primary transition-colors">{po.po_number}</span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(po.created_at).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{po.supplier_name || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-xs">{po.department || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-right">{formatCurrency(po.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tighter ${
                        po.status === 'Draft' ? 'bg-surface text-text-muted border-border' :
                        po.status === 'Menunggu Persetujuan' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        po.status === 'Disetujui' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        po.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/po/${po.id}`}
                        className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all inline-block border border-transparent hover:border-primary/20"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Tidak ada data ditemukan</p>
                      <p className="text-sm opacity-50 mt-1">Coba ubah kata kunci atau filter Anda.</p>
                      {error && <p className="text-rose-500 text-xs mt-4 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">{error.message}</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
