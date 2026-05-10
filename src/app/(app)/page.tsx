import { Package, Tags, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  // Ambil semua data summary secara paralel
  const [
    { count: totalItems },
    { count: totalCategories },
    { count: totalSuppliers },
    { data: recentItems },
  ] = await Promise.all([
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("items").select("id, name, sku, created_at, categories(name)").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Total Barang", value: totalItems ?? 0, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", href: "/items" },
    { label: "Total Kategori", value: totalCategories ?? 0, icon: Tags, color: "text-violet-500", bg: "bg-violet-500/10", href: "/categories" },
    { label: "Total Supplier", value: totalSuppliers ?? 0, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/suppliers" },
    { label: "Stok Menipis", value: 0, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", href: "/items" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-text-muted mt-1">Ringkasan status inventaris IT Anda secara real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Link key={idx} href={stat.href} className="bg-surface border border-border p-6 rounded-xl shadow-sm hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value.toLocaleString("id-ID")}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barang Terbaru */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Barang Terbaru Ditambahkan</h2>
            <Link href="/items" className="text-sm text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentItems && recentItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="text-xs text-text-muted uppercase bg-background">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Nama Barang</th>
                  <th className="px-6 py-3 text-left font-semibold">SKU</th>
                  <th className="px-6 py-3 text-left font-semibold">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-background/50">
                    <td className="px-6 py-3 font-medium">{item.name}</td>
                    <td className="px-6 py-3 text-text-muted">{item.sku}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-background border border-border rounded text-xs">
                        {(item as any).categories?.name || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <Package className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Belum ada barang yang ditambahkan.</p>
              <Link href="/items/new" className="mt-3 text-primary text-sm hover:underline">
                + Tambah Barang Pertama
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold">Menu Cepat</h2>
          <div className="space-y-2">
            {[
              { label: "Tambah Barang Baru", href: "/items/new", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
              { label: "Tambah Kategori", href: "/categories/new", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
              { label: "Tambah Supplier", href: "/suppliers/new", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
              { label: "Lihat Semua Barang", href: "/items", color: "bg-background text-foreground border border-border" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity ${link.color}`}
              >
                {link.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-text-muted mb-2">Perlu Ditambahkan</h3>
            <div className="space-y-2 text-sm text-text-muted">
              {totalCategories === 0 && <p className="text-amber-500">⚠ Belum ada kategori</p>}
              {totalSuppliers === 0 && <p className="text-amber-500">⚠ Belum ada supplier</p>}
              {totalItems === 0 && <p className="text-amber-500">⚠ Belum ada barang</p>}
              {(totalItems ?? 0) > 0 && (totalCategories ?? 0) > 0 && (totalSuppliers ?? 0) > 0 && (
                <p className="text-emerald-500">✓ Data master sudah lengkap!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
