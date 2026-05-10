import { Plus, Search, Filter, MoreHorizontal, PackageX } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function ItemsPage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("items")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Barang</h1>
          <p className="text-text-muted mt-1">Kelola data seluruh barang inventaris IT Anda.</p>
        </div>
        <Link href="/items/new" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Barang
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface">
          <div className="relative w-full sm:w-72 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari SKU atau nama barang..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button className="w-full sm:w-auto px-4 py-2 border border-border rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-text-muted hover:text-foreground hover:bg-background transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Nama Barang</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Stok Total</th>
                <th className="px-6 py-4 font-semibold">Harga Dasar</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items && items.length > 0 ? (
                items.map((item: any) => {
                  // TODO: Implement actual stock calculation using item_stocks table
                  const stock = 0; 
                  const status = stock > 10 ? 'Aman' : stock > 0 ? 'Menipis' : 'Habis';
                  
                  return (
                    <tr key={item.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.sku}</td>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-medium">
                          {item.categories?.name || "Tidak ada kategori"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{stock}</td>
                      <td className="px-6 py-4">{formatPrice(item.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          status === 'Aman' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          status === 'Menipis' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-text-muted hover:text-foreground rounded-lg hover:bg-background transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <PackageX className="w-12 h-12 mb-3 opacity-20" />
                      <p>Belum ada barang yang ditambahkan.</p>
                      {error && <p className="text-rose-500 text-xs mt-2">{error.message}</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Status */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-text-muted bg-surface">
          <p>Total {items?.length || 0} barang</p>
        </div>
      </div>
    </div>
  );
}
