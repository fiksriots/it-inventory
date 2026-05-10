import { ArrowRightLeft, Plus, PackageX } from "lucide-react";
import Link from "next/link";

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutasi & Transfer Stok</h1>
          <p className="text-text-muted mt-1">Catat pergerakan barang masuk (inbound) dan keluar (outbound).</p>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Mutasi
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Inbound (Bulan Ini)", value: "0", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Outbound (Bulan Ini)", value: "0", color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Total Transaksi", value: "0", color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <ArrowRightLeft className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">Belum ada data mutasi stok.</p>
          <p className="text-sm mt-1">Fitur pencatatan mutasi segera hadir.</p>
        </div>
      </div>
    </div>
  );
}
