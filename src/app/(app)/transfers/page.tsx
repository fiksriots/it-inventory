import { ArrowRightLeft, Plus, PackageX, ArrowDownLeft, ArrowUpRight, Calendar, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function TransfersPage() {
  const supabase = await createClient();

  // Fetch Mutations
  const { data: logs } = await supabase
    .from("inventory_logs")
    .select("*, items(name, sku), locations(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch Transfers
  const { data: transfers } = await supabase
    .from("item_transfers")
    .select("*, items(name, sku), from:from_location_id(name), to:to_location_id(name)")
    .order("transfer_date", { ascending: false })
    .limit(50);

  // Combine and sort with unified shape for TypeScript
  const allActivities = [
    ...(logs || []).map(l => ({
      id: l.id,
      type: l.mutation_type as string,
      date: new Date(l.created_at),
      itemName: l.items?.name as string | undefined,
      itemSku: l.items?.sku as string | undefined,
      quantity: l.quantity,
      location: l.locations?.name as string | undefined,
      from: undefined as string | undefined,
      to: undefined as string | undefined,
      notes: l.notes,
      isTransfer: false
    })),
    ...(transfers || []).map(t => ({
      id: t.id,
      type: 'TRANSFER',
      date: new Date(t.transfer_date),
      itemName: t.items?.name as string | undefined,
      itemSku: t.items?.sku as string | undefined,
      quantity: t.quantity,
      location: undefined as string | undefined,
      from: (t.from as any)?.name as string | undefined,
      to: (t.to as any)?.name as string | undefined,
      notes: t.notes,
      isTransfer: true
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Simple stats calculation
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const inboundCount = logs?.filter(l => l.mutation_type === 'INBOUND' && new Date(l.created_at) >= firstDayOfMonth).length || 0;
  const outboundCount = logs?.filter(l => l.mutation_type === 'OUTBOUND' && new Date(l.created_at) >= firstDayOfMonth).length || 0;
  const totalTransactions = allActivities.length;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutasi & Transfer Stok</h1>
          <p className="text-text-muted mt-1">Catat pergerakan barang masuk (inbound) dan keluar (outbound).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/transfers/new-mutation" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
            <Plus className="w-5 h-5" />
            Tambah Mutasi
          </Link>
          <Link href="/transfers/new-transfer" className="bg-surface border border-border hover:bg-background px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
            <ArrowRightLeft className="w-5 h-5" />
            Transfer Barang
          </Link>
          <Link href="/transfers/new-replacement" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
            <Wrench className="w-5 h-5" />
            Penggantian Unit Rusak
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Inbound (Bulan Ini)", value: inboundCount.toString(), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Outbound (Bulan Ini)", value: outboundCount.toString(), color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Total Transaksi", value: totalTransactions.toString(), color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Activities Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface">
          <div className="relative w-full sm:w-72 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                <th className="px-6 py-4 font-semibold">Barang</th>
                <th className="px-6 py-4 font-semibold">Tipe</th>
                <th className="px-6 py-4 font-semibold">Jumlah</th>
                <th className="px-6 py-4 font-semibold">Lokasi / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allActivities.length > 0 ? (
                allActivities.map((activity, idx) => (
                  <tr key={`${activity.id}-${idx}`} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatDate(activity.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{activity.itemName}</p>
                        <p className="text-xs text-text-muted">{activity.itemSku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        activity.type === 'INBOUND' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        activity.type === 'OUTBOUND' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {activity.type === 'INBOUND' && <ArrowDownLeft className="w-3 h-3" />}
                        {activity.type === 'OUTBOUND' && <ArrowUpRight className="w-3 h-3" />}
                        {activity.type === 'TRANSFER' && <ArrowRightLeft className="w-3 h-3" />}
                        {activity.type === 'INBOUND' ? 'Masuk' : activity.type === 'OUTBOUND' ? 'Keluar' : 'Transfer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {activity.type === 'OUTBOUND' ? '-' : '+'}{activity.quantity}
                    </td>
                    <td className="px-6 py-4">
                      {activity.isTransfer ? (
                        <p className="text-xs">
                          <span className="font-medium">{activity.from}</span> → <span className="font-medium">{activity.to}</span>
                        </p>
                      ) : (
                        <p className="font-medium">{activity.location}</p>
                      )}
                      {activity.notes && (
                        <p className="text-xs text-text-muted italic mt-0.5 truncate max-w-xs" title={activity.notes}>
                          "{activity.notes}"
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <PackageX className="w-12 h-12 mb-3 opacity-20" />
                      <p>Belum ada aktivitas mutasi atau transfer.</p>
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
