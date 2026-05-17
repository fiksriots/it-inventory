import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingCart, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertCircle,
  Globe,
  MapPin,
  Store,
  Edit
} from "lucide-react";
import { updatePOStatus } from "../actions";
import POClientView from "./po-client-view";
import DeletePOButton from "./delete-button";

export default async function PODetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch PO with supplier info and location info
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(*), locations(name)")
    .eq("id", id)
    .single();

  if (!po) notFound();

  // Fetch PO Items
  const { data: items } = await supabase
    .from("po_items")
    .select("*, items(name, sku, description)")
    .eq("po_id", id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const statusColors: any = {
    'Draft': 'bg-surface text-text-muted border-border',
    'Menunggu Persetujuan': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Disetujui': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Selesai': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Ditolak': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/po" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Purchase Order</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-text-muted">{po.po_number}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[po.status]}`}>
                {po.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions (Update Status) */}
        <div className="flex flex-wrap gap-2">
          {po.status === 'Draft' && (
            <form action={async () => { "use server"; await updatePOStatus(po.id, 'Menunggu Persetujuan'); }}>
              <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
                Ajukan Persetujuan
              </button>
            </form>
          )}
          {po.status === 'Menunggu Persetujuan' && (
            <>
              <form action={async () => { "use server"; await updatePOStatus(po.id, 'Disetujui'); }}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                  Setujui PO
                </button>
              </form>
              <form action={async () => { "use server"; await updatePOStatus(po.id, 'Ditolak'); }}>
                <button className="px-4 py-2 border border-rose-500/50 text-rose-500 rounded-lg text-sm font-bold hover:bg-rose-500 hover:text-white transition-all">
                  Tolak
                </button>
              </form>
            </>
          )}
          {po.status === 'Disetujui' && (
            <form action={async () => { "use server"; await updatePOStatus(po.id, 'Selesai'); }}>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                <CheckCircle2 className="w-4 h-4" />
                Selesaikan PO
              </button>
            </form>
          )}

          {/* Revisi PO Button */}
          {po.status !== 'Selesai' && (
            <Link 
              href={`/po/${po.id}/edit`} 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Edit className="w-4 h-4 text-primary" />
              Revisi PO
            </Link>
          )}

          {/* Delete Button (Always show) */}
          <DeletePOButton id={po.id} status={po.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Cards */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border pb-3">Ringkasan PO</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Pembelian:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(po.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                <span className="text-text-muted">Subtotal Items:</span>
                <span className="font-medium">{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Pajak/Biaya/Layanan:</span>
                <span className="font-medium">{formatCurrency(po.admin_fee + po.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-500">
                <span>Diskon:</span>
                <span className="font-medium">-{formatCurrency(po.discount_amount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <Calendar className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Tanggal Buat</p>
                  <p className="text-sm font-medium">{new Date(po.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <User className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Pemohon</p>
                  <p className="text-sm font-medium">{po.requested_by || "Tidak dicatat"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <Building2 className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Departemen</p>
                  <p className="text-sm font-medium">{po.department || "Tidak dicatat"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <MapPin className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Lokasi Tujuan Akhir</p>
                  <p className="text-sm font-medium">{po.locations?.name || "Tidak dicatat"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Supplier</h2>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${po.supplier_type === 'Online' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {po.supplier_type}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Nama Perusahaan</p>
                <p className="font-bold text-white text-base">{po.suppliers?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Kontak</p>
                  <p className="text-sm">{po.suppliers?.contact_person || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Telepon</p>
                  <p className="text-sm">{po.suppliers?.phone || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Content */}
        <div className="lg:col-span-2 space-y-6">
          <POClientView po={po} items={items || []} />

          {/* Items Table */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Daftar Barang Dipesan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-background/80 text-text-muted text-[10px] uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">Barang</th>
                    <th className="px-6 py-4 font-bold text-center w-24">Satuan</th>
                    <th className="px-6 py-4 font-bold text-center w-24">Jumlah</th>
                    <th className="px-6 py-4 font-bold">Harga Satuan</th>
                    <th className="px-6 py-4 font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-background/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold">{item.item_id ? item.items?.name : item.custom_item_name}</p>
                        <p className="text-[10px] text-text-muted flex items-center gap-1">
                          {item.item_id ? (
                            <span className="bg-surface border border-border px-1.5 py-0.5 rounded tracking-tighter">{item.items?.sku}</span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20 text-[8px] font-bold uppercase">Manual Input</span>
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-background border border-border px-2 py-0.5 rounded text-[10px] font-medium text-text-muted">
                          {item.unit || "PCS"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">{item.quantity}</td>
                      <td className="px-6 py-4 text-text-muted">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-background/50 font-bold border-t border-border">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right uppercase text-[10px] tracking-widest text-text-muted">Total Akhir Dokumen</td>
                    <td className="px-6 py-4 text-right text-lg text-primary">{formatCurrency(po.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
