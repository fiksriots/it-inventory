import { Plus, PackageX, Edit, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteItem } from "./actions";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select("*, categories(name), item_stocks(quantity, condition, locations(name))", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: items, error, count } = await query.range(from, to);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  };

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Barang</h1>
          <p className="text-text-muted mt-1">Kelola data seluruh barang inventaris IT Anda.</p>
        </div>
        <Link href="/items/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Tambah Barang
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <SearchInput placeholder="Cari SKU atau nama barang..." />
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">SKU</th>
                <th className="px-6 py-4 font-bold">Nama Barang</th>
                <th className="px-6 py-4 font-bold">Kategori</th>
                <th className="px-6 py-4 font-bold">Rincian Stok & Kondisi</th>
                <th className="px-6 py-4 font-bold">Harga</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items && items.length > 0 ? (
                items.map((item: any) => {
                  const stocks = item.item_stocks || [];
                  const totalStock = stocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                  const status = totalStock > 10 ? 'Aman' : totalStock > 0 ? 'Menipis' : 'Habis';
                  
                  return (
                    <tr key={item.id} className="hover:bg-background/50 transition-all group">
                      <td className="px-6 py-4 font-bold text-primary">{item.sku}</td>
                      <td className="px-6 py-4">
                        <Link href={`/items/${item.id}`} className="hover:text-primary transition-colors font-bold">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-background border border-border rounded-md text-[10px] font-bold uppercase text-text-muted transition-colors">
                          {item.categories?.name || "No Category"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <p className="font-bold leading-none">{totalStock} <span className="text-[10px] text-text-muted uppercase tracking-tighter">Total Unit</span></p>
                          <div className="flex flex-wrap gap-1">
                            {stocks.map((s: any, idx: number) => (
                              <div key={idx} className="flex items-center bg-background border border-border rounded overflow-hidden">
                                <span className="text-[9px] px-1.5 py-0.5 text-text-muted border-r border-border">
                                  {s.locations?.name}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 font-bold ${
                                  s.condition === 'Baru' ? 'text-emerald-500 bg-emerald-500/5' :
                                  s.condition === 'Normal' ? 'text-blue-500 bg-blue-500/5' :
                                  s.condition?.includes('Rusak (Total)') || s.condition === 'Afkir' ? 'text-rose-500 bg-rose-500/5' :
                                  'text-amber-500 bg-amber-500/5'
                                }`}>
                                  {s.quantity} {s.condition}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-medium">{formatPrice(item.price)}</td>
                      <td className="px-6 py-4 text-center sm:text-left">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tighter ${
                          status === 'Aman' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          status === 'Menipis' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/items/${item.id}/edit`}
                            className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <DeleteButton id={item.id} label={`barang "${item.name}"`} onDelete={deleteItem} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-white/50">Tidak ada data ditemukan</p>
                      <p className="text-sm opacity-50 mt-1">Coba ubah kata kunci atau filter Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-muted bg-surface/50 uppercase tracking-widest">
          <p>Total <span className="text-white">{count || 0}</span> barang ditemukan</p>
        </div>
      </div>
    </div>
  );
}
