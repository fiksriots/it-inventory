import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: "Total Barang", value: "2,543", icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Barang Masuk (Bulan Ini)", value: "342", icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Barang Keluar (Bulan Ini)", value: "128", icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Stok Menipis", value: "14", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-text-muted mt-1">Ringkasan pergerakan stok dan status inventaris Anda.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface border border-border p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-muted">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h2>
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <Package className="w-12 h-12 mb-3 opacity-20" />
            <p>Belum ada aktivitas mutasi stok.</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Peringatan Stok</h2>
          <div className="flex flex-col items-center justify-center h-64 text-text-muted">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
            <p>Semua stok aman.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
