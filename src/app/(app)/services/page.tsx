import { Plus, Wrench, Calendar, Eye, MapPin, Store, HelpCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteService } from "./actions";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  let query = supabase
    .from("item_services")
    .select("*, items(name, sku), locations(name), suppliers(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`service_number.ilike.%${q}%,problem_description.ilike.%${q}%,sent_by_name.ilike.%${q}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: services, error, count } = await query.range(from, to);

  // Fetch all for summary metrics
  const { data: allServices } = await supabase.from("item_services").select("status");
  const safeAllServices = allServices || [];

  const statuses = [
    { label: "Total Perangkat", count: safeAllServices.length, color: "text-primary", bg: "bg-surface" },
    { label: "Proses Service", count: safeAllServices.filter(s => s.status === 'Proses Service').length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Selesai", count: safeAllServices.filter(s => s.status === 'Selesai').length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Dibatalkan", count: safeAllServices.filter(s => s.status === 'Dibatalkan').length, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary animate-bounce-subtle" />
            Service Barang
          </h1>
          <p className="text-text-muted mt-1">Kelola perbaikan dan pemeliharaan perangkat IT secara terintegrasi.</p>
        </div>
        <Link href="/services/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Catat Service Baru
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((s, i) => (
          <div key={i} className={`${s.bg} border border-border rounded-xl p-5 shadow-sm group hover:border-primary/30 transition-all`}>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <SearchInput placeholder="Cari nomor dokumen atau kendala..." />
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Nomor Dokumen</th>
                <th className="px-6 py-4 font-bold">Perangkat / SKU</th>
                <th className="px-6 py-4 font-bold">Lokasi Asal</th>
                <th className="px-6 py-4 font-bold">Vendor Service</th>
                <th className="px-6 py-4 font-bold">Tgl Pengiriman</th>
                <th className="px-6 py-4 font-bold text-right">Biaya</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services && services.length > 0 ? (
                services.map((service: any) => (
                  <tr key={service.id} className="hover:bg-background/50 transition-all group">
                    <td className="px-6 py-4">
                      <span className="font-bold group-hover:text-primary transition-colors">{service.service_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{service.items?.name || "Perangkat Terhapus"}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <span className="bg-background border border-border px-1.5 py-0.5 rounded text-[10px] font-mono">
                          {service.items?.sku || "N/A"}
                        </span>
                        <span className="text-[10px] text-rose-500 font-medium">({service.initial_condition})</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary/70" />
                        <span className="text-xs font-medium">{service.locations?.name || "Gudang Utama"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Store className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-foreground">{service.suppliers?.name || "Vendor Eksternal"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(service.sent_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {service.sent_by_name && (
                        <p className="text-[10px] text-text-muted/70 italic mt-0.5 truncate max-w-[120px]">Kurir: {service.sent_by_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-right text-primary">
                      {formatCurrency(service.cost || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tighter ${
                        service.status === 'Proses Service' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        service.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/services/${service.id}`}
                          className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          title="Lihat Detail & Kelola"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <DeleteButton id={service.id} label={`dokumen service ${service.service_number}`} onDelete={deleteService} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <Wrench className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Belum ada catatan perbaikan barang</p>
                      <p className="text-sm opacity-50 mt-1">Klik tombol "Catat Service Baru" untuk memulai pencatatan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-text-muted bg-surface/50 uppercase tracking-widest">
          <p>Total <span className="text-foreground">{count || 0}</span> dokumen service ditemukan</p>
        </div>
      </div>
    </div>
  );
}
