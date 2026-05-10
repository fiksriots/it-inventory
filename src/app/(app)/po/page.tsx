import { ShoppingCart, Plus } from "lucide-react";

export default function PurchaseOrdersPage() {
  const statuses = [
    { label: "Draft", count: 0, color: "text-text-muted", bg: "bg-background" },
    { label: "Menunggu Persetujuan", count: 0, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Disetujui", count: 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Selesai", count: 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-text-muted mt-1">Kelola dokumen pembelian barang ke supplier.</p>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Buat PO Baru
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statuses.map((s, i) => (
          <div key={i} className={`${s.bg} border border-border rounded-xl p-5 shadow-sm`}>
            <p className="text-sm text-text-muted">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Table Placeholder */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">Belum ada Purchase Order.</p>
          <p className="text-sm mt-1">Klik "Buat PO Baru" untuk membuat dokumen pembelian pertama Anda.</p>
        </div>
      </div>
    </div>
  );
}
