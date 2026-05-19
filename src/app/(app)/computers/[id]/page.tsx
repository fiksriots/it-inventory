import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Monitor, 
  MapPin, 
  Calendar, 
  Cpu, 
  HardDrive, 
  User, 
  FileText,
  AlertTriangle,
  Server,
  Globe,
  Smartphone,
  Shield
} from "lucide-react";
import DeleteButton from "@/components/ui/DeleteButton";
import { deleteComputer } from "../actions";
import MaintenanceScheduleUpdater from "./maintenance-schedule-updater";
import ComputerSpecUpdater from "./computer-spec-updater";

export default async function ComputerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: computer } = await supabase
    .from("computers")
    .select("*, locations(name)")
    .eq("id", id)
    .single();

  if (!computer) notFound();

  // Ambil riwayat pemeliharaan komputer (maintenance history)
  let maintenanceLogs: any[] = [];
  let dbTableMissing = false;

  try {
    const { data: logs, error: logsError } = await supabase
      .from("computer_maintenance_logs")
      .select("*")
      .eq("computer_id", id)
      .order("maintenance_date", { ascending: false });

    if (logsError) {
      if (logsError.code === "PGRST205" || logsError.message.includes("does not exist")) {
        dbTableMissing = true;
      } else {
        console.error("Error fetching computer maintenance logs:", logsError);
      }
    } else {
      maintenanceLogs = logs || [];
    }
  } catch (err) {
    console.error("Failed to query computer maintenance logs:", err);
    dbTableMissing = true;
  }

  const { data: itemsList } = await supabase.from("items").select("id, name, sku").order("name");
  const { data: locationsList } = await supabase.from("locations").select("id, name").order("name");

  const statusColors: any = {
    'Aktif': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Maintenance': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Rusak': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    'Pensiun': 'bg-surface text-text-muted border-border',
  };

  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 14);

  let isUrgent = false;
  if (computer.next_maintenance_date) {
    const nDate = new Date(computer.next_maintenance_date);
    if (nDate <= warningThreshold) isUrgent = true;
  }

  // Periksa keaktifan garansi
  let isWarrantyActive = false;
  let hasWarranty = false;
  if (computer.warranty_expiry_date) {
    hasWarranty = true;
    const wDate = new Date(computer.warranty_expiry_date);
    // Atur jam akhir hari untuk perbandingan adil
    wDate.setHours(23, 59, 59, 999);
    if (wDate >= now) {
      isWarrantyActive = true;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/computers" className="p-2 border border-border rounded-xl hover:bg-background transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" />
              Detail Aset Komputer
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-text-muted font-mono text-xs font-bold">{computer.asset_number}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-widest ${statusColors[computer.status] || ''}`}>
                {computer.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <DeleteButton id={computer.id} label={`komputer ${computer.name}`} onDelete={deleteComputer} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary Presentation */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-primary">
              <Server className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shrink-0">
                PC
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Hostname</p>
                <p className="text-xl font-black text-foreground">{computer.name}</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Lokasi:
                </span>
                <span className="font-bold text-foreground text-right">{computer.locations?.name || "Belum Dipetakan"}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-text-muted font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-text-muted" /> Pengguna:
                </span>
                <span className="font-bold text-foreground text-right">{computer.user_assigned || "Staf Umum"}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-text-muted font-medium flex items-center gap-1.5">
                  <span className="font-mono text-[9px] px-1 bg-surface rounded border">IP</span> Alamat IP:
                </span>
                <span className="font-mono font-bold text-primary">{computer.ip_address || "Belum Ditetapkan"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3.5 text-xs">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Jadwal Perawatan Berikutnya</p>
                <div className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                  isUrgent ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse' : 'bg-background border-border text-foreground'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {computer.next_maintenance_date ? new Date(computer.next_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "Belum Dijadwalkan"}
                  </span>
                  {isUrgent && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
                {isUrgent && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">⚠️ Segera jadwalkan atau lakukan pemeliharaan fisik/software.</p>
                )}
              </div>

              {computer.last_maintenance_date && (
                <div className="flex justify-between items-center text-[11px] text-text-muted pt-1">
                  <span>Siklus Terakhir:</span>
                  <span className="font-bold text-foreground">{new Date(computer.last_maintenance_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Specs Digest */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border pb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              Sistem Tertanam
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Sistem Operasi</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{computer.operating_system || "Tidak diinput"}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Processor</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{computer.processor || "Tidak diinput"}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Memori RAM</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{computer.ram || "Tidak diinput"}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Kapasitas Penyimpanan</p>
                <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-text-muted shrink-0" />
                  {computer.storage || "Tidak diinput"}
                </p>
              </div>
            </div>
          </div>

          {/* Dukungan Enterprise & Identitas Pabrik */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Parameter Enterprise
              </h2>
              {hasWarranty && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  isWarrantyActive 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-surface border-border text-text-muted line-through'
                }`}>
                  {isWarrantyActive ? 'Garansi Aktif' : 'Garansi Habis'}
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">MAC Address</p>
                <p className="font-mono font-bold text-foreground mt-0.5">{computer.mac_address || "-"}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Serial Number / ST</p>
                <p className="font-mono font-bold text-foreground mt-0.5">{computer.serial_number || "-"}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-blue-500" />
                  ID Remote Support
                </p>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">{computer.remote_support_id || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div>
                  <p className="text-[9px] text-text-muted font-bold uppercase">Tgl Beli</p>
                  <p className="text-[11px] font-medium mt-0.5">
                    {computer.purchase_date ? new Date(computer.purchase_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-text-muted font-bold uppercase">Masa Garansi</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${hasWarranty ? (isWarrantyActive ? 'text-emerald-600' : 'text-rose-500') : ''}`}>
                    {computer.warranty_expiry_date ? new Date(computer.warranty_expiry_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Live Updaters */}
        <div className="lg:col-span-2 space-y-6">
          <MaintenanceScheduleUpdater
            computer={computer}
            maintenanceLogs={maintenanceLogs}
            dbTableMissing={dbTableMissing}
            itemsList={itemsList || []}
            locationsList={locationsList || []}
          />
          <ComputerSpecUpdater computer={computer} />
        </div>
      </div>
    </div>
  );
}
