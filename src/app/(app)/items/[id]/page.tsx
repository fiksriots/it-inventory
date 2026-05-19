import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Calendar
} from "lucide-react";
import ItemUsageForm from "./item-usage-form";

export default async function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Item details
  const { data: item } = await supabase
    .from("items")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!item) notFound();

  // Fetch Stock per Location
  const { data: stocks } = await supabase
    .from("item_stocks")
    .select("*, locations(name)")
    .eq("item_id", id);

  // Fetch Mutation Logs
  const { data: logs } = await supabase
    .from("inventory_logs")
    .select("*, locations(name)")
    .eq("item_id", id)
    .order("created_at", { ascending: false });

  // Fetch Transfer Logs
  const { data: transfers } = await supabase
    .from("item_transfers")
    .select("*, from:from_location_id(name), to:to_location_id(name)")
    .eq("item_id", id)
    .order("transfer_date", { ascending: false });

  // Combine and sort history with a unified type to satisfy TypeScript
  const history = [
    ...(logs || []).map(l => ({
      id: l.id,
      type: l.mutation_type as string, // 'INBOUND' or 'OUTBOUND'
      date: new Date(l.created_at),
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
      quantity: t.quantity,
      location: undefined as string | undefined,
      from: (t.from as any)?.name as string | undefined,
      to: (t.to as any)?.name as string | undefined,
      notes: t.notes,
      isTransfer: true
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalStock = stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/items" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
            <span className="font-mono bg-background px-2 py-0.5 border border-border rounded text-xs">{item.sku}</span>
            <span>•</span>
            <span>{item.categories?.name || "Tanpa Kategori"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Stock Distribution */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Stok Tersedia</p>
                <p className="text-3xl font-bold">{totalStock}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Harga Dasar:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Pemakaian Barang */}
          <ItemUsageForm itemId={id} stocks={stocks || []} />

          {/* Stock Distribution */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Sebaran Stok per Lokasi</h2>
            </div>
            <div className="divide-y divide-border">
              {stocks && stocks.length > 0 ? (
                stocks.map((s: any) => (
                  <div key={s.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{s.locations?.name}</p>
                      <p className="text-xs text-text-muted">Terakhir update: {new Date(s.last_updated).toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className="px-3 py-1 bg-background border border-border rounded-lg font-bold text-sm">
                      {s.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-text-muted italic text-sm">
                  Stok belum tersedia di lokasi manapun.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: History Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-xl shadow-sm h-full">
            <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Riwayat Aktivitas Barang</h2>
              </div>
            </div>
            <div className="p-6">
              {history.length > 0 ? (
                <div className="relative border-l-2 border-border ml-3 space-y-8 pb-4">
                  {history.map((h) => (
                    <div key={h.id} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-surface flex items-center justify-center ${
                        h.type === 'INBOUND' ? 'bg-emerald-500' : 
                        h.type === 'OUTBOUND' ? 'bg-rose-500' : 
                        'bg-blue-500'
                      }`}>
                        {h.type === 'INBOUND' && <ArrowDownLeft className="w-3 h-3 text-white" />}
                        {h.type === 'OUTBOUND' && <ArrowUpRight className="w-3 h-3 text-white" />}
                        {h.type === 'TRANSFER' && <ArrowRightLeft className="w-3 h-3 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="bg-background/40 border border-border rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            h.type === 'INBOUND' ? 'bg-emerald-500/10 text-emerald-500' : 
                            h.type === 'OUTBOUND' ? 'bg-rose-500/10 text-rose-500' : 
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {h.type === 'INBOUND' ? 'Barang Masuk' : 
                             h.type === 'OUTBOUND' ? 'Barang Keluar' : 
                             'Transfer Stok'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Calendar className="w-3 h-3" />
                            {formatDate(h.date)}
                          </div>
                        </div>

                        <div className="text-sm">
                          {h.isTransfer ? (
                            <p>
                              Pemindahan <span className="font-bold text-foreground">{h.quantity} unit</span> dari <span className="font-medium text-foreground">{h.from}</span> ke <span className="font-medium text-foreground">{h.to}</span>.
                            </p>
                          ) : (
                            <p>
                              <span className="font-bold text-foreground">{h.quantity} unit</span> {h.type === 'INBOUND' ? 'diterima di' : 'keluar dari'} <span className="font-medium text-foreground">{h.location}</span>.
                            </p>
                          )}
                          {h.notes && (
                            <p className="mt-2 text-text-muted text-xs italic bg-surface/50 p-2 rounded border border-border/50">
                              "{h.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
                  <History className="w-12 h-12 mb-4" />
                  <p>Belum ada riwayat aktivitas untuk barang ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
