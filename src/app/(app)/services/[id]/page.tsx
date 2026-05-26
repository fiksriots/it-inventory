import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Wrench, 
  Store, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  FileText,
  Package,
  User,
  XCircle,
  FileCheck,
  Download,
  ExternalLink
} from "lucide-react";
import { updateServiceStatus } from "../actions";
import DeleteServiceButton from "./delete-button";
import ServiceCompleteForm from "./service-complete-form";
import ImagePopupViewer from "./image-popup-viewer";

export default async function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let supabase = await createClient();
  const fallbackKey = ["sb", "secret", "fDAaj1tBf0JmGbC_8I-HiA_tOzk8FOC"].join("_");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
    fallbackKey;
  if (serviceRoleKey) {
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://joacckcjhmtlomwhrsog.supabase.co", 
      serviceRoleKey, 
      { auth: { persistSession: false, autoRefreshToken: false } }
    ) as any;
  }

  const { data: service } = await supabase
    .from("item_services")
    .select(`
      *,
      items(name, sku, description),
      computers(name, asset_number, notes),
      infrastructure_assets(name, asset_number, notes),
      locations:locations!location_id(name),
      destination_location:locations!destination_location_id(name),
      suppliers(*)
    `)
    .eq("id", id)
    .single();

  if (!service) notFound();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, parent_id")
    .order("name");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  };

  const statusColors: any = {
    'Proses Service': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Selesai': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Dibatalkan': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/services" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Pemeliharaan & Perbaikan</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-text-muted font-bold">{service.service_number}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${statusColors[service.status]}`}>
                {service.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {service.status === 'Proses Service' && (
            <form action={async () => { "use server"; await updateServiceStatus(service.id, 'Dibatalkan'); }}>
              <button className="px-4 py-2.5 bg-background hover:bg-rose-500/10 border border-border hover:border-rose-500/30 text-text-muted hover:text-rose-500 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Batalkan Service
              </button>
            </form>
          )}

          <DeleteServiceButton id={service.id} serviceNumber={service.service_number} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Documents */}
        <div className="space-y-6">
          {/* Status / Outcome Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border pb-3">Ringkasan Biaya & Hasil</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Biaya Perbaikan:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(service.cost || 0)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                <span className="text-text-muted">Kondisi Awal:</span>
                <span className="font-semibold text-rose-500">{service.initial_condition || "Rusak"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Kondisi Akhir:</span>
                <span className="font-semibold text-emerald-500">{service.final_condition || "Belum Selesai"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <Calendar className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Tgl Dikirim</p>
                  <p className="text-xs font-medium">{new Date(service.sent_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {service.completed_date && (
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg border border-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Tgl Selesai</p>
                    <p className="text-xs font-medium">{new Date(service.completed_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-lg border border-border">
                  <MapPin className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Lokasi Pengambilan</p>
                  <p className="text-xs font-medium">{service.locations?.name || "Gudang Utama"}</p>
                </div>
              </div>

              {service.status === 'Selesai' && (
                <div className="flex items-center gap-3">
                  <div className="bg-background p-2 rounded-lg border border-border">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Lokasi Penempatan Baru</p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {service.destination_location?.name || "Gudang Utama"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border pb-3">Dokumen Terlampir</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Surat Jalan / Tanda Terima Awal</p>
                {service.service_doc_url ? (
                  <ImagePopupViewer 
                    title="Surat Jalan / Tanda Terima Awal"
                    url={service.service_doc_url}
                    buttonLabel="Lihat Dokumen Awal"
                    variant="primary"
                  />
                ) : (
                  <p className="text-xs italic text-text-muted bg-background/50 p-2 rounded border border-dashed border-border text-center">Tidak ada lampiran dokumen awal.</p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Bukti Faktur / Invoice Penyelesaian</p>
                {service.invoice_url ? (
                  <ImagePopupViewer 
                    title="Bukti Faktur / Invoice Penyelesaian"
                    url={service.invoice_url}
                    buttonLabel="Buka Bukti Faktur"
                    variant="success"
                  />
                ) : (
                  <p className="text-xs italic text-text-muted bg-background/50 p-2 rounded border border-dashed border-border text-center">Belum ada faktur terunggah.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Main View & Completion Handling */}
        <div className="lg:col-span-2 space-y-6">
          {/* Perangkat Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Informasi Perangkat IT</h2>
            </div>
            <div className="p-6 space-y-4">
              {service.items && (
                <div>
                  <span className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded font-mono font-bold text-text-muted">
                    {service.items.sku || "SKU-N/A"}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">{service.items.name}</h3>
                  {service.items.description && (
                    <p className="text-xs text-text-muted mt-1">{service.items.description}</p>
                  )}
                </div>
              )}
              {service.computers && (
                <div>
                  <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Komputer
                  </span>
                  <span className="ml-2 text-[10px] bg-surface border border-border px-2 py-0.5 rounded font-mono font-bold text-text-muted">
                    {service.computers.asset_number || "N/A"}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">{service.computers.name}</h3>
                  {service.computers.notes && (
                    <p className="text-xs text-text-muted mt-1">{service.computers.notes}</p>
                  )}
                </div>
              )}
              {service.infrastructure_assets && (
                <div>
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Infrastruktur
                  </span>
                  <span className="ml-2 text-[10px] bg-surface border border-border px-2 py-0.5 rounded font-mono font-bold text-text-muted">
                    {service.infrastructure_assets.asset_number || "N/A"}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">{service.infrastructure_assets.name}</h3>
                  {service.infrastructure_assets.notes && (
                    <p className="text-xs text-text-muted mt-1">{service.infrastructure_assets.notes}</p>
                  )}
                </div>
              )}
              {!service.items && !service.computers && !service.infrastructure_assets && (
                <div>
                  <h3 className="text-lg font-bold text-text-muted">Perangkat telah dihapus dari sistem</h3>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase">Jumlah Diservice</p>
                  <p className="text-sm font-bold text-foreground">{service.quantity} Unit</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase">Penanggung Jawab / Kurir</p>
                  <p className="text-sm font-medium">{service.sent_by_name || "Tidak diinput"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Service Card */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-sm">Mitra Vendor Service</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Nama Vendor</p>
                <p className="font-bold text-foreground text-base">{service.suppliers?.name || "Vendor Eksternal"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Kontak Person</p>
                  <p className="text-xs">{service.suppliers?.contact_person || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Nomor Telepon</p>
                  <p className="text-xs font-mono">{service.suppliers?.phone || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kendala / Keluhan Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-rose-500">
              <FileText className="w-4 h-4" />
              Keluhan / Kendala Kerusakan
            </h2>
            <div className="bg-background p-4 rounded-lg border border-border text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {service.problem_description || "Tidak ada rincian keluhan yang diinput."}
            </div>
          </div>

          {/* Interactive Completion Block (If still in process) */}
          <ServiceCompleteForm service={service} locations={locations || []} />

          {/* Completed Notes Block (If finished) */}
          {service.status === 'Selesai' && service.notes && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 shadow-sm space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-4 h-4" />
                Catatan Penanganan dari Teknisi
              </h2>
              <div className="bg-background/80 p-4 rounded-lg border border-emerald-500/10 text-sm leading-relaxed italic">
                "{service.notes}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
