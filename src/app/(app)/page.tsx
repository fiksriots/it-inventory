import { Package, Tags, Users, AlertTriangle, ArrowRight, ShoppingCart, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, History, Activity, PlusCircle, ArrowLeftRight, PackagePlus, FolderKanban, ClipboardList, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  // Fetch counts and recent data
  const [
    { count: totalItems },
    { count: totalCategories },
    { count: totalSuppliers },
    { count: totalPO },
    { data: recentItems },
    { data: recentPO },
    { data: lowStockItems },
    { data: recentLogs },
    { data: allStocks },
  ] = await Promise.all([
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("purchase_orders").select("*", { count: "exact", head: true }),
    supabase.from("items").select("id, name, sku, created_at, categories(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("purchase_orders").select("id, po_number, status, created_at, total_amount, suppliers(name)").order("created_at", { ascending: false }).limit(5),
    // Query for Low Stock (sum across locations < 5)
    supabase.from("item_stocks").select("quantity, items(name, sku)").lt("quantity", 5).limit(5),
    // Query for Recent Logs
    supabase.from("inventory_logs").select("*, items(name), locations(name)").order("created_at", { ascending: false }).limit(5),
    // Query all stocks for total value and condition breakdown
    supabase.from("item_stocks").select("quantity, condition, items(price)"),
  ]);

  // Calculate Asset Value and Conditions
  const totalValue = allStocks?.reduce((acc, curr) => acc + (curr.quantity * (curr.items as any)?.price || 0), 0) || 0;
  const conditionStats = allStocks?.reduce((acc: any, curr) => {
    const cond = curr.condition || "Normal";
    if (cond.includes("Rusak")) {
      acc.Rusak = (acc.Rusak || 0) + curr.quantity;
    } else {
      acc[cond] = (acc[cond] || 0) + curr.quantity;
    }
    return acc;
  }, { Normal: 0, Baru: 0, Rusak: 0 });

  // Operations Defensive Queries
  let activeProjectsCount = 0;
  let activeProjects: any[] = [];
  let todayLogsCount = 0;
  let dutyStaff: string[] = [];
  let hasProjectsTable = true;
  let hasDailyLogsTable = true;
  let hasSchedulesTable = true;

  try {
    const { count } = await supabase.from("it_projects").select("*", { count: "exact", head: true }).neq("status", "Completed");
    activeProjectsCount = count || 0;

    const { data } = await supabase.from("it_projects").select("id, name, status, progress").neq("status", "Completed").order("progress", { ascending: true }).limit(3);
    activeProjects = data || [];
  } catch (err) {
    hasProjectsTable = false;
  }

  try {
    const { count } = await supabase.from("it_daily_logs").select("*", { count: "exact", head: true }).eq("date", new Date().toISOString().split("T")[0]);
    todayLogsCount = count || 0;
  } catch (err) {
    hasDailyLogsTable = false;
  }

  try {
    const todayDay = new Date().getDate().toString();
    const currentMonthStr = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    const { data: schedulesData } = await supabase
      .from("it_schedules")
      .select("technician_name, schedules")
      .eq("month", currentMonthStr);

    if (schedulesData) {
      schedulesData.forEach((row: any) => {
        const schedMap = row.schedules || {};
        const todayCode = schedMap[todayDay];
        if (todayCode === "M" || todayCode === "DP") {
          dutyStaff.push(row.technician_name);
        }
      });
    }
  } catch (err) {
    hasSchedulesTable = false;
  }

  const stats = [
    { label: "Total Aset Inventaris", value: `Rp. ${totalValue.toLocaleString("id-ID")}`, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", href: "/items" },
    { label: "Project IT Aktif", value: hasProjectsTable ? activeProjectsCount : 0, icon: FolderKanban, color: "text-violet-500", bg: "bg-violet-500/10", href: "/projects" },
    { label: "Laporan Harian (Hari Ini)", value: hasDailyLogsTable ? todayLogsCount : 0, icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/daily-logs" },
    { label: "Total PO Pengadaan", value: totalPO ?? 0, icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-500/10", href: "/po" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">OpsFlow IT Overview</h1>
          <p className="text-sm text-text-muted mt-1">Ringkasan status operasional, perencanaan project, dan inventaris IT real-time.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => {
          const valueStr = stat.value.toString();
          const getFontSize = (str: string) => {
            if (str.length > 15) return "text-base md:text-lg lg:text-xl";
            if (str.length > 12) return "text-lg md:text-xl lg:text-2xl";
            return "text-2xl md:text-3xl lg:text-3xl";
          };

          return (
            <Link key={idx} href={stat.href} className="bg-surface border border-border p-5 md:p-6 rounded-2xl shadow-sm hover:border-primary/50 transition-all hover:shadow-md group active:scale-95">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] md:text-xs font-black text-text-muted uppercase tracking-widest truncate">{stat.label}</p>
                  <h3 className={`${getFontSize(valueStr)} font-black mt-1 md:mt-2 text-foreground tracking-tighter transition-all leading-tight whitespace-nowrap`}>
                    {stat.value}
                  </h3>
                </div>
                <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tables & Project Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects Tracker */}
          {hasProjectsTable && activeProjects.length > 0 && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4.5 h-4.5 text-primary" />
                  <h2 className="text-base font-semibold">Progres IT Project Planning</h2>
                </div>
                <Link href="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Lihat Semua Project <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-6 space-y-4">
                {activeProjects.map((proj) => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="block group p-4 bg-background border border-border rounded-xl hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between gap-4 mb-2.5">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-xs md:max-w-md">{proj.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        proj.status === "In Progress" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        proj.status === "On Hold" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-text-muted">
                        <span>Progress Pekerjaan</span>
                        <span className="text-foreground">{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-background border border-border h-2 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-500" 
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PO Terbaru */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4.5 h-4.5 text-primary" />
                <h2 className="text-base font-semibold">Purchase Order Terbaru</h2>
              </div>
              <Link href="/po" className="text-sm text-primary hover:underline flex items-center gap-1">
                Lihat Semua PO <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recentPO && recentPO.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="text-xs text-text-muted uppercase bg-background">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Nomor PO</th>
                    <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPO.map((po: any) => (
                    <tr key={po.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-primary">
                        <Link href={`/po/${po.id}`}>{po.po_number}</Link>
                      </td>
                      <td className="px-6 py-3 text-text-muted font-medium truncate max-w-[150px]">
                        {(po as any).suppliers?.name || "-"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {po.status === 'Selesai' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : 
                          po.status === 'Ditolak' ? <XCircle className="w-3 h-3 text-rose-500" /> : 
                          <Clock className="w-3 h-3 text-amber-500" />}
                          <span className="text-[10px] font-bold uppercase">{po.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-bold">
                        Rp. {(po.total_amount || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Belum ada PO yang dibuat.</p>
              </div>
            )}
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <History className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold">Mutasi Logistik Terakhir</h2>
            </div>
            <div className="p-4 space-y-4">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: any, idx) => (
                  <div key={idx} className="relative pl-6 pb-4 border-l-2 border-border last:pb-0">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${log.mutation_type === 'INBOUND' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      {log.mutation_type === 'INBOUND' ? <ArrowUpRight className="w-2 h-2 text-white" /> : <ArrowDownRight className="w-2 h-2 text-white" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold truncate max-w-md">{(log as any).items?.name}</p>
                        <span className="text-[10px] text-text-muted">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {log.mutation_type === 'INBOUND' ? 'Masuk' : 'Keluar'} <span className="font-bold text-foreground">{log.quantity} Unit</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Activity className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-20" />
                  <p className="text-xs text-text-muted">Belum ada aktivitas logistik.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* IT Support On Duty */}
          {hasSchedulesTable && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-emerald-500/5">
                <Calendar className="w-4.5 h-4.5 text-emerald-500" />
                <h2 className="text-base font-semibold text-emerald-700 dark:text-emerald-400">IT Support On Duty</h2>
              </div>
              <div className="p-5 space-y-4">
                {dutyStaff.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">Teknisi Piket Hari Ini ({new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long" })}):</p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {dutyStaff.map((staff, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          {staff}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-text-muted">
                    <p className="text-xs italic bg-background border border-dashed border-border p-3 rounded-lg">Tidak ada teknisi terjadwal piksel masuk hari ini.</p>
                  </div>
                )}
                <div className="pt-3 border-t border-border/80">
                  <Link href="/schedules" className="text-xs text-primary font-bold hover:underline flex items-center justify-between group">
                    <span>Lihat Seluruh Kalender Jadwal</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <PlusCircle className="w-4.5 h-4.5 text-primary" />
              Akses Cepat
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Kelola Project IT", sub: "RAB & progress plan", href: "/projects", icon: FolderKanban, color: "bg-violet-500/10 text-violet-600", border: "hover:border-violet-500/50" },
                { label: "Laporan Harian", sub: "Catat & unggah foto", href: "/daily-logs", icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-600", border: "hover:border-emerald-500/50" },
                { label: "Jadwal Shift Kerja", sub: "Duty calendar & shift", href: "/schedules", icon: Calendar, color: "bg-rose-500/10 text-rose-600", border: "hover:border-rose-500/50" },
                { label: "Tambah Barang", sub: "Input aset IT baru", href: "/items/new", icon: PackagePlus, color: "bg-blue-500/10 text-blue-600", border: "hover:border-blue-500/50" },
                { label: "Buat PO Baru", sub: "Proses pengadaan", href: "/po/new", icon: ShoppingCart, color: "bg-amber-500/10 text-amber-600", border: "hover:border-amber-500/50" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background/50 transition-all group ${link.border} hover:shadow-md hover:-translate-y-0.5 hover:bg-surface`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${link.color}`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{link.label}</p>
                    <p className="text-[10px] text-text-muted font-medium mt-0.5">{link.sub}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-xs font-bold text-text-muted mb-4 uppercase tracking-widest">Status Data Master</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Kategori Terdaftar</span>
                  <span className={totalCategories === 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                    {totalCategories === 0 ? "⚠️ Kosong" : `${totalCategories}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Supplier Aktif</span>
                  <span className={totalSuppliers === 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                    {totalSuppliers === 0 ? "⚠️ Kosong" : `${totalSuppliers}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Total Jenis Barang</span>
                  <span className={totalItems === 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                    {totalItems === 0 ? "⚠️ Kosong" : `${totalItems}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stok Menipis */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-rose-500/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h2 className="text-base font-semibold text-rose-700 dark:text-rose-400">Stok Menipis</h2>
              </div>
              <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">Critical</span>
            </div>
            <div className="p-4 space-y-3">
              {lowStockItems && lowStockItems.length > 0 ? (
                lowStockItems.map((stock: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-rose-500/50 transition-all">
                    <div>
                      <p className="text-sm font-bold">{(stock as any).items?.name}</p>
                      <p className="text-[10px] text-text-muted font-mono uppercase">{(stock as any).items?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-500">{stock.quantity}</p>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">Sisa</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-20" />
                  <p className="text-xs text-text-muted">Stok aman.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

