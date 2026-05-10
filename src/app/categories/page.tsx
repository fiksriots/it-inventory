import { Plus, Search, MoreHorizontal, Tags } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  // Dummy data untuk kategori
  const categories = [
    { id: 1, name: "Elektronik", description: "Perangkat elektronik umum seperti laptop dan monitor", count: 24 },
    { id: 2, name: "Jaringan", description: "Peralatan networking seperti router, switch, dan kabel", count: 12 },
    { id: 3, name: "Aksesoris", description: "Mouse, keyboard, headset, dll", count: 45 },
    { id: 4, name: "Software", description: "Lisensi aplikasi dan sistem operasi", count: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Barang</h1>
          <p className="text-text-muted mt-1">Kelola daftar kategori untuk mengelompokkan barang Anda.</p>
        </div>
        <Link href="/categories/new" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Kategori
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
              placeholder="Cari kategori..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Nama Kategori</th>
                <th className="px-6 py-4 font-semibold">Deskripsi</th>
                <th className="px-6 py-4 font-semibold w-32 text-center">Jumlah Barang</th>
                <th className="px-6 py-4 font-semibold text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <Tags className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{category.description}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-surface border border-border rounded-full text-xs font-medium">
                      {category.count} Item
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-text-muted hover:text-foreground rounded-lg hover:bg-background transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
