"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Package, 
  Wrench, 
  AlertTriangle, 
  MapPin, 
  Monitor, 
  Calendar, 
  Search, 
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { formatStock } from "@/utils/unit";

interface ReportsClientProps {
  items: any[];
  infrastructureAssets: any[];
  computers: any[];
  locations: any[];
  pos: any[];
}

export default function ReportsClient({
  items,
  infrastructureAssets,
  computers,
  locations,
  pos
}: ReportsClientProps) {
  // Tab aktif: 'stok' | 'maintenance_infra' | 'rusak' | 'lokasi' | 'pc' | 'po'
  const [activeTab, setActiveTab] = useState<string>("stok");

  // State Kustomisasi Cetak Laporan (Tersimpan di localStorage)
  const [companyName, setCompanyName] = useState<string>("PT. INVENTARIS TEKNOLOGI UTAMA");
  const [companySlogan, setCompanySlogan] = useState<string>("Pusat Pengelolaan Manajemen Aset, Sarana Infrastruktur & Fasilitas Komputer");

  const [signer1Name, setSigner1Name] = useState<string>("Admin Operasional");
  const [signer1Role, setSigner1Role] = useState<string>("Staf IT Inventory");

  const [signer2Name, setSigner2Name] = useState<string>("Kepala Bagian IT");
  const [signer2Role, setSigner2Role] = useState<string>("Manager Infrastruktur");

  const [signer3Name, setSigner3Name] = useState<string>("Direktur Keuangan");
  const [signer3Role, setSigner3Role] = useState<string>("Eksekutif Manajemen");

  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("report_print_settings");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.companyName) setCompanyName(p.companyName);
        if (p.companySlogan) setCompanySlogan(p.companySlogan);
        if (p.signer1Name) setSigner1Name(p.signer1Name);
        if (p.signer1Role) setSigner1Role(p.signer1Role);
        if (p.signer2Name) setSigner2Name(p.signer2Name);
        if (p.signer2Role) setSigner2Role(p.signer2Role);
        if (p.signer3Name) setSigner3Name(p.signer3Name);
        if (p.signer3Role) setSigner3Role(p.signer3Role);
      } catch (e) {
        console.error("Gagal membaca pengaturan kop surat:", e);
      }
    }
  }, []);

  const saveConfig = (updated: any) => {
    localStorage.setItem("report_print_settings", JSON.stringify(updated));
  };

  const resetConfig = () => {
    const defaults = {
      companyName: "PT. INVENTARIS TEKNOLOGI UTAMA",
      companySlogan: "Pusat Pengelolaan Manajemen Aset, Sarana Infrastruktur & Fasilitas Komputer",
      signer1Name: "Admin Operasional",
      signer1Role: "Staf IT Inventory",
      signer2Name: "Kepala Bagian IT",
      signer2Role: "Manager Infrastruktur",
      signer3Name: "Direktur Keuangan",
      signer3Role: "Eksekutif Manajemen"
    };
    setCompanyName(defaults.companyName);
    setCompanySlogan(defaults.companySlogan);
    setSigner1Name(defaults.signer1Name);
    setSigner1Role(defaults.signer1Role);
    setSigner2Name(defaults.signer2Name);
    setSigner2Role(defaults.signer2Role);
    setSigner3Name(defaults.signer3Name);
    setSigner3Role(defaults.signer3Role);
    localStorage.setItem("report_print_settings", JSON.stringify(defaults));
  };

  // State Filter Lokasi
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    locations.length > 0 ? locations[0].id : ""
  );

  // State Filter Perangkat / Jenis Aset (Hanya aktif saat tab Lokasi dipilih)
  const [deviceFilter, setDeviceFilter] = useState<string>("Semua");

  // State Filter Tanggal PO (Default: Awal bulan ini sampai hari ini)
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [poDepartment, setPoDepartment] = useState<string>("");

  // Format Angka Rupiah / Kuantitas
  const formatNum = (num: number) => {
    if (!num) return "0";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const formatCurr = (amount: number) => {
    if (!amount) return "Rp 0";
    return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // 1. DATA STOK BARANG
  const stockReportData = useMemo(() => {
    const list: any[] = [];
    items.forEach(item => {
      const totalQty = item.item_stocks?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
      const goodQty = item.item_stocks?.filter((s: any) => !(s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir")).reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
      const badQty = item.item_stocks?.filter((s: any) => s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir").reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
      const locNames = Array.from(new Set(item.item_stocks?.map((s: any) => s.locations?.name).filter(Boolean))).join(", ");
      list.push({
        sku: item.sku || "-",
        name: item.name,
        category: item.categories?.name || "-",
        quantity: totalQty,
        goodQuantity: goodQty,
        badQuantity: badQty,
        unit: item.unit || "PCS",
        has_conversion: item.has_conversion,
        conversion_unit: item.conversion_unit,
        conversion_rate: item.conversion_rate,
        locations: locNames || "Gudang Utama"
      });
    });
    return list;
  }, [items]);

  // 2. DATA MAINTENANCE INFRASTRUKTUR
  const infraReportData = useMemo(() => {
    return infrastructureAssets.map(asset => ({
      asset_number: asset.asset_number,
      name: asset.name,
      category: asset.category,
      location: asset.locations?.name || "-",
      status: asset.status,
      last_maintenance: asset.last_maintenance_date,
      next_maintenance: asset.next_maintenance_date,
      vendor: asset.vendor_name || "-"
    }));
  }, [infrastructureAssets]);

  // 3. DATA BARANG & ASET RUSAK
  const damagedReportData = useMemo(() => {
    const list: any[] = [];

    // Dari Item Stocks
    items.forEach(item => {
      item.item_stocks?.forEach((st: any) => {
        if (st.condition?.toLowerCase().includes("rusak")) {
          list.push({
            type: "Barang Inventaris",
            code: item.sku || "-",
            name: item.name,
            location: st.locations?.name || "-",
            detail: `Kondisi: ${st.condition} (${formatStock(st.quantity, item.unit, item.has_conversion, item.conversion_unit, item.conversion_rate)})`
          });
        }
      });
    });

    // Dari Komputer
    computers.forEach(pc => {
      if (pc.status?.toLowerCase().includes("rusak")) {
        list.push({
          type: "Unit Komputer",
          code: pc.asset_number || "-",
          name: pc.name,
          location: pc.locations?.name || "-",
          detail: `Pengguna: ${pc.user_assigned || "-"} | Catatan: ${pc.notes || "Perangkat Rusak"}`
        });
      }
    });

    // Dari Infrastruktur
    infrastructureAssets.forEach(infra => {
      if (infra.status?.toLowerCase().includes("rusak")) {
        list.push({
          type: "Fasilitas Fisik",
          code: infra.asset_number || "-",
          name: infra.name,
          location: infra.locations?.name || "-",
          detail: `Kategori: ${infra.category} | Vendor: ${infra.vendor_name || "-"}`
        });
      }
    });

    return list;
  }, [items, computers, infrastructureAssets]);

  // 4. DATA BARANG DI LOKASI TERTENTU (DENGAN FILTER JENIS PERANGKAT)
  const locationReportData = useMemo(() => {
    if (!selectedLocationId) return { items: [], computers: [], infra: [], locName: "", deviceFilter };
    
    const targetLoc = locations.find(l => l.id === selectedLocationId);
    const locName = targetLoc ? targetLoc.name : "";

    // Items di lokasi
    const locItems: any[] = [];
    if (deviceFilter === "Semua" || deviceFilter === "Barang") {
      items.forEach(item => {
        const stocksInLoc = item.item_stocks?.filter((s: any) => s.location_id === selectedLocationId) || [];
        const qty = stocksInLoc.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
        if (qty > 0) {
          locItems.push({
            sku: item.sku || "-",
            name: item.name,
            category: item.categories?.name || "-",
            quantity: qty,
            unit: item.unit || "PCS",
            has_conversion: item.has_conversion,
            conversion_unit: item.conversion_unit,
            conversion_rate: item.conversion_rate
          });
        }
      });
    }

    // Komputer di lokasi
    let locPcs: any[] = [];
    if (deviceFilter === "Semua" || deviceFilter === "PC") {
      locPcs = computers.filter(pc => pc.location_id === selectedLocationId);
    }
    
    // Infra di lokasi
    let locInfra: any[] = [];
    if (deviceFilter === "Semua" || !["Semua", "Barang", "PC"].includes(deviceFilter)) {
      locInfra = infrastructureAssets.filter(inf => inf.location_id === selectedLocationId);
      
      if (deviceFilter === "Gate") {
        locInfra = locInfra.filter(inf => inf.category?.toLowerCase().includes("gate"));
      } else if (deviceFilter === "CCTV") {
        locInfra = locInfra.filter(inf => inf.category?.toLowerCase().includes("cctv"));
      } else if (deviceFilter === "DVR") {
        locInfra = locInfra.filter(inf => inf.category?.toLowerCase().includes("dvr"));
      } else if (deviceFilter === "AC") {
        locInfra = locInfra.filter(inf => inf.category?.toLowerCase().includes("ac") || inf.category?.toLowerCase().includes("pendingin"));
      } else if (deviceFilter === "Lainnya") {
        locInfra = locInfra.filter(inf => inf.category?.toLowerCase().includes("lainnya"));
      }
    }

    return {
      items: locItems,
      computers: locPcs,
      infra: locInfra,
      locName,
      deviceFilter
    };
  }, [selectedLocationId, deviceFilter, locations, items, computers, infrastructureAssets]);

  // 5. DATA MAINTENANCE PC
  const pcReportData = useMemo(() => {
    return computers.map(pc => ({
      asset_number: pc.asset_number,
      name: pc.name,
      user_assigned: pc.user_assigned || "-",
      location: pc.locations?.name || "-",
      ip_address: pc.ip_address || "-",
      status: pc.status || "Aktif",
      last_maintenance: pc.last_maintenance_date,
      next_maintenance: pc.next_maintenance_date
    }));
  }, [computers]);

  // Extract unique departments for PO report filter
  const poDepartments = useMemo(() => {
    return Array.from(new Set(pos.map(po => po.department).filter(Boolean))).sort();
  }, [pos]);

  // 6. DATA PO RENTANG TANGGAL & DEPARTEMEN
  const poReportData = useMemo(() => {
    return pos.filter(po => {
      if (!po.created_at) return false;
      const poDate = po.created_at.split('T')[0];
      const startOk = startDate ? poDate >= startDate : true;
      const endOk = endDate ? poDate <= endDate : true;
      const departmentOk = poDepartment ? po.department === poDepartment : true;
      return startOk && endOk && departmentOk;
    });
  }, [pos, startDate, endDate, poDepartment]);

  // Memicu Print
  const handlePrint = () => {
    window.print();
  };

  // Judul Laporan Dinamis
  const getReportTitle = () => {
    switch(activeTab) {
      case "stok": return "Laporan Daftar Stok Barang Inventaris";
      case "maintenance_infra": return "Laporan Jadwal Pemeliharaan Infrastruktur & Fasilitas";
      case "rusak": return "Laporan Rincian Barang & Aset Rusak";
      case "lokasi": return `Laporan Inventaris Aset Lokasi: ${locationReportData.locName || "-"}`;
      case "pc": return "Laporan Jadwal Pemeliharaan Unit Komputer & PC";
      case "po": return "Rekapitulasi Transaksi Purchase Orders (PO)";
      default: return "Laporan Sistem IT Inventory";
    }
  };

  return (
    <div className="space-y-6">
      {/* CSS KHUSUS PENCETAKAN LAPORAN FORMAL (PIXEL PERFECT) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #report-printable-area, #report-printable-area * {
            visibility: visible;
          }
          #report-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 15mm !important;
            box-sizing: border-box;
            background: white;
            color: black;
            display: block !important;
            font-family: "Times New Roman", Times, serif, Arial !important;
          }
          .no-print {
            display: none !important;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 20px;
            font-size: 11px !important;
          }
          .report-table th, .report-table td {
            border: 1px solid black !important;
            padding: 6px 8px !important;
            text-align: left;
          }
          .report-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
            text-align: center;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          @page {
            size: A4 portrait;
            margin: 0mm !important; /* Menghapus tanggal, URL, dan nomor halaman bawaan header/footer peramban secara mutlak */
          }
        }
      `}} />

      {/* Header Dashboard Laporan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Laporan & Cetak</h1>
          <p className="text-text-muted mt-1">Hasilkan rekapitulasi data operasional siap cetak untuk manajemen.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all shrink-0 ${
              showCustomizer 
                ? "bg-primary/10 border-primary text-primary" 
                : "bg-surface border-border hover:border-primary/50 text-text-muted hover:text-foreground"
            }`}
            title="Kustomisasi Kop Surat & Tanda Tangan"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Atur Kop & TTD</span>
            {showCustomizer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0 flex-1 sm:flex-initial justify-center"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak Laporan Resmi</span>
          </button>
        </div>
      </div>

      {/* Tab Navigasi Pilihan Laporan */}
      <div className="bg-surface border border-border p-2 rounded-xl flex flex-wrap gap-1.5 no-print">
        {[
          { id: "stok", label: "Stok Barang", icon: Package },
          { id: "maintenance_infra", label: "Maintenance Fasilitas", icon: Wrench },
          { id: "rusak", label: "Barang Rusak", icon: AlertTriangle },
          { id: "lokasi", label: "Filter Lokasi", icon: MapPin },
          { id: "pc", label: "Maintenance PC", icon: Monitor },
          { id: "po", label: "Rekap Data PO", icon: Calendar }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
                isActive 
                  ? "bg-primary text-white shadow" 
                  : "text-text-muted hover:text-foreground hover:bg-background/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rangkuman Cepat Barang Rusak & Aktif (Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-text-muted text-xs font-semibold uppercase">Stok Barang Bagus</span>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">
              {formatNum(
                 items.reduce((acc, item) => {
                  const goodQty = item.item_stocks?.filter((s: any) => !(s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir")).reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                  return acc + goodQty;
                }, 0)
              )}
              <span className="text-xs font-normal text-text-muted ml-1">Unit</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-text-muted text-xs font-semibold uppercase">Stok Barang Rusak</span>
            <h3 className="text-2xl font-black text-rose-500 mt-1">
              {formatNum(
                items.reduce((acc, item) => {
                  const badQty = item.item_stocks?.filter((s: any) => s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir").reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                  return acc + badQty;
                }, 0)
              )}
              <span className="text-xs font-normal text-text-muted ml-1">Unit</span>
            </h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-text-muted text-xs font-semibold uppercase">Komputer Rusak</span>
            <h3 className="text-2xl font-black text-purple-500 mt-1">
              {formatNum(computers.filter(pc => pc.status?.toLowerCase().includes("rusak")).length)}
              <span className="text-xs font-normal text-text-muted ml-1">Unit</span>
            </h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-text-muted text-xs font-semibold uppercase">Infrastruktur Rusak</span>
            <h3 className="text-2xl font-black text-amber-500 mt-1">
              {formatNum(infrastructureAssets.filter(inf => inf.status?.toLowerCase().includes("rusak")).length)}
              <span className="text-xs font-normal text-text-muted ml-1">Aset</span>
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Drawer Live Customizer Kop & TTD */}
      {showCustomizer && (
        <div className="bg-surface border-2 border-primary/40 rounded-xl p-6 no-print space-y-6 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Settings className="w-4 h-4" />
              <h3>Konfigurasi Kop Surat & Penandatangan Resmi</h3>
            </div>
            <button
              onClick={resetConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:border-rose-500 hover:text-rose-500 rounded-lg text-xs font-bold transition-all"
              title="Kembalikan ke Nama & Slogan Standar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Kop Bagian Perusahaan */}
            <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
              <h4 className="font-bold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Bagian Identitas Header
              </h4>
              
              <div>
                <label className="block text-text-muted font-bold mb-1">Nama Perusahaan / Organisasi</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    saveConfig({ companyName: e.target.value, companySlogan, signer1Name, signer1Role, signer2Name, signer2Role, signer3Name, signer3Role });
                  }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 font-bold text-foreground focus:outline-none focus:border-primary"
                  placeholder="PT. INVENTARIS TEKNOLOGI UTAMA"
                />
              </div>

              <div>
                <label className="block text-text-muted font-bold mb-1">Slogan / Keterangan Unit Kerja</label>
                <input
                  type="text"
                  value={companySlogan}
                  onChange={(e) => {
                    setCompanySlogan(e.target.value);
                    saveConfig({ companyName, companySlogan: e.target.value, signer1Name, signer1Role, signer2Name, signer2Role, signer3Name, signer3Role });
                  }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-muted focus:outline-none focus:border-primary"
                  placeholder="Pusat Pengelolaan Manajemen Aset..."
                />
              </div>
            </div>

            {/* Bagian Kolom Tanda Tangan */}
            <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border">
              <h4 className="font-bold text-text-muted uppercase tracking-wider text-[10px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" /> Kolom Tanda Tangan Footer
              </h4>

              <div className="grid grid-cols-3 gap-3">
                {/* Kolom 1 */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-primary">Kiri (Disiapkan)</span>
                  <input
                    type="text"
                    value={signer1Name}
                    onChange={(e) => {
                      setSigner1Name(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name: e.target.value, signer1Role, signer2Name, signer2Role, signer3Name, signer3Role });
                    }}
                    placeholder="Nama Staf"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 font-bold focus:outline-none focus:border-primary text-center text-xs"
                  />
                  <input
                    type="text"
                    value={signer1Role}
                    onChange={(e) => {
                      setSigner1Role(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name, signer1Role: e.target.value, signer2Name, signer2Role, signer3Name, signer3Role });
                    }}
                    placeholder="Jabatan"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-text-muted text-[10px] focus:outline-none focus:border-primary text-center"
                  />
                </div>

                {/* Kolom 2 */}
                <div className="space-y-2.5 border-x border-border/60 px-2">
                  <span className="block text-[10px] font-bold text-primary">Tengah (Diperiksa)</span>
                  <input
                    type="text"
                    value={signer2Name}
                    onChange={(e) => {
                      setSigner2Name(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name, signer1Role, signer2Name: e.target.value, signer2Role, signer3Name, signer3Role });
                    }}
                    placeholder="Nama Manager"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 font-bold focus:outline-none focus:border-primary text-center text-xs"
                  />
                  <input
                    type="text"
                    value={signer2Role}
                    onChange={(e) => {
                      setSigner2Role(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name, signer1Role, signer2Name, signer2Role: e.target.value, signer3Name, signer3Role });
                    }}
                    placeholder="Jabatan"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-text-muted text-[10px] focus:outline-none focus:border-primary text-center"
                  />
                </div>

                {/* Kolom 3 */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-primary">Kanan (Disetujui)</span>
                  <input
                    type="text"
                    value={signer3Name}
                    onChange={(e) => {
                      setSigner3Name(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name, signer1Role, signer2Name, signer2Role, signer3Name: e.target.value, signer3Role });
                    }}
                    placeholder="Nama Direktur"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 font-bold focus:outline-none focus:border-primary text-center text-xs"
                  />
                  <input
                    type="text"
                    value={signer3Role}
                    onChange={(e) => {
                      setSigner3Role(e.target.value);
                      saveConfig({ companyName, companySlogan, signer1Name, signer1Role, signer2Name, signer2Role, signer3Name, signer3Role: e.target.value });
                    }}
                    placeholder="Jabatan"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-text-muted text-[10px] focus:outline-none focus:border-primary text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-text-muted italic text-center border-t border-border pt-2">
            💡 Setiap perubahan otomatis disimpan di penyimpanan lokal peramban Anda secara instan dan langsung aktif saat tombol Cetak ditekan.
          </p>
        </div>
      )}

      {/* Kontrol Tambahan Berdasarkan Tab Aktif */}
      <div className="no-print">
        {activeTab === "lokasi" && (
          <div className="p-4 bg-surface border border-border rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in duration-200 justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 font-bold text-sm text-primary shrink-0">
                <Building2 className="w-4 h-4" />
                <span>Lokasi:</span>
              </div>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium w-full sm:w-56 focus:outline-none focus:border-primary"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border">
              <div className="flex items-center gap-2 font-bold text-sm text-primary shrink-0">
                <Wrench className="w-4 h-4" />
                <span>Filter Jenis Perangkat:</span>
              </div>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium w-full sm:w-56 focus:outline-none focus:border-primary text-amber-500 font-bold"
              >
                <option value="Semua">Semua Aset & Barang</option>
                <option value="Barang">📦 Stok Barang Gudang</option>
                <option value="PC">💻 Komputer & PC</option>
                <option value="Gate">🚧 Portal / Gate</option>
                <option value="CCTV">📹 Fasilitas CCTV</option>
                <option value="DVR">📼 Perangkat DVR</option>
                <option value="AC">❄️ AC / Pendingin</option>
                <option value="Lainnya">🔧 Fasilitas Lainnya</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "po" && (
          <div className="p-4 bg-surface border border-border rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in duration-200 justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-between">
              {/* Rentang Tanggal */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 font-bold text-sm text-primary shrink-0">
                  <Calendar className="w-4 h-4" />
                  <span>Filter Rentang Tanggal PO:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Mulai:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Sampai:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Departemen */}
              <div className="flex items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                <div className="flex items-center gap-2 font-bold text-sm text-primary shrink-0">
                  <Building2 className="w-4 h-4" />
                  <span>Filter Departemen:</span>
                </div>
                <select
                  value={poDepartment}
                  onChange={(e) => setPoDepartment(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium w-full sm:w-48 focus:outline-none focus:border-primary text-amber-500 font-bold"
                >
                  <option value="">Semua Departemen</option>
                  {poDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pratinjau Langsung (Live Preview) di Layar Monitor */}
      <div className="bg-surface border border-border rounded-xl p-6 no-print space-y-4">
        <div className="border-b border-border pb-3 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary">
            📋 Pratinjau Tampilan Laporan
          </h3>
          <span className="text-xs text-text-muted italic">Format kertas A4 Portrait</span>
        </div>

        {/* Tabel Layar (Screen Table) */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {activeTab === "stok" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-background/80 border-b border-border sticky top-0 uppercase text-[10px] text-text-muted font-bold">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-center">Stok Bagus</th>
                  <th className="p-3 text-center">Stok Rusak</th>
                  <th className="p-3 text-center">Total Stok</th>
                  <th className="p-3">Lokasi / Distribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockReportData.map((row, i) => (
                  <tr key={i} className="hover:bg-background/30">
                    <td className="p-3 font-mono">{row.sku}</td>
                    <td className="p-3 font-bold">{row.name}</td>
                    <td className="p-3 text-text-muted">{row.category}</td>
                    <td className="p-3 text-center font-bold text-emerald-500">{formatStock(row.goodQuantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                    <td className="p-3 text-center font-bold text-rose-500">{formatStock(row.badQuantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                    <td className="p-3 text-center font-bold text-primary">{formatStock(row.quantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                    <td className="p-3 text-text-muted">{row.locations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "maintenance_infra" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-background/80 border-b border-border sticky top-0 uppercase text-[10px] text-text-muted font-bold">
                <tr>
                  <th className="p-3">No. Aset</th>
                  <th className="p-3">Nama Fasilitas</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Jadwal Perawatan</th>
                  <th className="p-3">Vendor / Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {infraReportData.map((row, i) => (
                  <tr key={i} className="hover:bg-background/30">
                    <td className="p-3 font-mono">{row.asset_number}</td>
                    <td className="p-3 font-bold">{row.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border font-medium">
                        {row.category}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted">{row.location}</td>
                    <td className="p-3 font-medium text-amber-500">
                      {formatDate(row.next_maintenance)}
                    </td>
                    <td className="p-3 text-text-muted">{row.vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "rusak" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/40 p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <span className="text-text-muted text-[10px] font-bold uppercase">Total Barang Inventaris Rusak</span>
                  <p className="text-lg font-black text-rose-500">
                    {formatNum(
                      items.reduce((acc, item) => {
                        const badQty = item.item_stocks?.filter((s: any) => s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir").reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                        return acc + badQty;
                      }, 0)
                    )} Unit
                  </p>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 sm:border-x border-border/60 sm:px-4">
                  <span className="text-text-muted text-[10px] font-bold uppercase">Total Komputer Rusak</span>
                  <p className="text-lg font-black text-purple-500">
                    {formatNum(computers.filter(pc => pc.status?.toLowerCase().includes("rusak")).length)} Unit
                  </p>
                </div>
                <div className="space-y-1 sm:pl-2">
                  <span className="text-text-muted text-[10px] font-bold uppercase">Total Infrastruktur Rusak</span>
                  <p className="text-lg font-black text-amber-500">
                    {formatNum(infrastructureAssets.filter(inf => inf.status?.toLowerCase().includes("rusak")).length)} Aset
                  </p>
                </div>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-background/80 border-b border-border sticky top-0 uppercase text-[10px] text-text-muted font-bold">
                  <tr>
                    <th className="p-3">Kelompok</th>
                    <th className="p-3">Kode / Referensi</th>
                    <th className="p-3">Nama Perangkat / Aset</th>
                    <th className="p-3">Lokasi</th>
                    <th className="p-3">Keterangan Kerusakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {damagedReportData.length > 0 ? (
                    damagedReportData.map((row, i) => (
                      <tr key={i} className="hover:bg-background/30">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.type === 'Barang Inventaris' ? 'bg-blue-500/10 text-blue-500' :
                            row.type === 'Unit Komputer' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{row.code}</td>
                        <td className="p-3 font-bold text-rose-500">{row.name}</td>
                        <td className="p-3 text-text-muted">{row.location}</td>
                        <td className="p-3 italic text-text-muted">{row.detail}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-muted">
                        🎉 Luar biasa! Tidak ada catatan barang atau aset fisik yang berstatus rusak saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "lokasi" && (
            <div className="space-y-6">
              {/* Rincian Items */}
              {(deviceFilter === "Semua" || deviceFilter === "Barang") && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-text-muted mb-2 bg-background/50 p-2 rounded">
                    📦 Rincian Stok Barang Gudang
                  </h4>
                  {locationReportData.items.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="border-b border-border text-[10px] text-text-muted font-bold">
                        <tr>
                          <th className="p-2">SKU</th>
                          <th className="p-2">Nama Barang</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2 text-center">Kuantitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {locationReportData.items.map((it, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{it.sku}</td>
                            <td className="p-2 font-medium">{it.name}</td>
                            <td className="p-2 text-text-muted">{it.category}</td>
                            <td className="p-2 text-center font-bold text-primary">{formatStock(it.quantity, it.unit, it.has_conversion, it.conversion_unit, it.conversion_rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-text-muted italic px-2">Tidak ada barang inventaris di lokasi ini.</p>
                  )}
                </div>
              )}

              {/* Rincian Komputer */}
              {(deviceFilter === "Semua" || deviceFilter === "PC") && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-text-muted mb-2 bg-background/50 p-2 rounded">
                    💻 Perangkat Komputer & PC
                  </h4>
                  {locationReportData.computers.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="border-b border-border text-[10px] text-text-muted font-bold">
                        <tr>
                          <th className="p-2">No. Aset</th>
                          <th className="p-2">Nama Komputer</th>
                          <th className="p-2">Pengguna</th>
                          <th className="p-2">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {locationReportData.computers.map((pc, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{pc.asset_number}</td>
                            <td className="p-2 font-medium">{pc.name}</td>
                            <td className="p-2 text-text-muted">{pc.user_assigned || "-"}</td>
                            <td className="p-2 font-mono text-text-muted">{pc.ip_address || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-text-muted italic px-2">Tidak ada unit komputer di lokasi ini.</p>
                  )}
                </div>
              )}

              {/* Rincian Infrastruktur */}
              {(deviceFilter === "Semua" || !["Semua", "Barang", "PC"].includes(deviceFilter)) && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-text-muted mb-2 bg-background/50 p-2 rounded">
                    🔧 Fasilitas Fisik & Infrastruktur
                  </h4>
                  {locationReportData.infra.length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="border-b border-border text-[10px] text-text-muted font-bold">
                        <tr>
                          <th className="p-2">No. Aset</th>
                          <th className="p-2">Nama Fasilitas</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {locationReportData.infra.map((inf, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono">{inf.asset_number}</td>
                            <td className="p-2 font-medium">{inf.name}</td>
                            <td className="p-2 text-text-muted">{inf.category}</td>
                            <td className="p-2 font-bold text-emerald-500">{inf.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-text-muted italic px-2">Tidak ada fasilitas fisik di lokasi ini.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "pc" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-background/80 border-b border-border sticky top-0 uppercase text-[10px] text-text-muted font-bold">
                <tr>
                  <th className="p-3">No. Aset</th>
                  <th className="p-3">Nama Hostname</th>
                  <th className="p-3">Penanggung Jawab</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3 text-center">Jadwal Perawatan</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pcReportData.map((row, i) => (
                  <tr key={i} className="hover:bg-background/30">
                    <td className="p-3 font-mono">{row.asset_number}</td>
                    <td className="p-3 font-bold">{row.name}</td>
                    <td className="p-3 text-text-muted">{row.user_assigned}</td>
                    <td className="p-3 text-text-muted">{row.location}</td>
                    <td className="p-3 text-center font-medium text-amber-500">
                      {formatDate(row.next_maintenance)}
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-500 font-bold">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "po" && (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-background/80 border-b border-border sticky top-0 uppercase text-[10px] text-text-muted font-bold">
                <tr>
                  <th className="p-3">Nomor PO</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Departemen</th>
                  <th className="p-3 w-1/3">Rincian Barang & Catatan</th>
                  <th className="p-3 text-right">Total Transaksi</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {poReportData.length > 0 ? (
                  poReportData.map((row, i) => (
                    <tr key={i} className="hover:bg-background/30">
                      <td className="p-3 font-bold text-primary">{row.po_number}</td>
                      <td className="p-3 text-text-muted">{formatDate(row.created_at)}</td>
                      <td className="p-3 font-medium">{row.supplier_name || "-"}</td>
                      <td className="p-3 text-text-muted">{row.department || "-"}</td>
                      <td className="p-3">
                        {row.items && row.items.length > 0 ? (
                          <div className="space-y-1">
                            {row.items.map((it: any, idx: number) => (
                              <div key={idx} className="font-medium text-white/90">
                                • {it.items?.name || it.custom_item_name} <span className="text-[10px] text-text-muted">({it.quantity} {it.unit || 'PCS'})</span>
                              </div>
                            ))}
                            {row.notes && (
                              <div className="text-[10px] text-text-muted italic bg-background/30 px-1.5 py-0.5 rounded mt-1 border border-border/30 inline-block max-w-full truncate" title={row.notes}>
                                Keterangan: {row.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Tidak ada rincian barang</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">{formatCurr(row.total_amount)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border font-bold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted">
                      Tidak ada dokumen Purchase Order dalam rentang tanggal yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {/* ========================================================================= */}
      {/* AREA CETAK RESMI (HANYA TERLIHAT SAAT PRINTER BEKERJA) */}
      {/* ========================================================================= */}
      <div id="report-printable-area" className="hidden print:block">
        {/* KOP SURAT RESMI */}
        <div style={{ borderBottom: "2px solid black", paddingBottom: "10px", marginBottom: "15px", textAlign: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            {companyName || "PT. INVENTARIS TEKNOLOGI UTAMA"}
          </h2>
          <p style={{ fontSize: "11px", margin: "3px 0 0 0" }}>
            {companySlogan || "Pusat Pengelolaan Manajemen Aset, Sarana Infrastruktur & Fasilitas Komputer"}
          </p>
          <p style={{ fontSize: "10px", fontStyle: "italic", margin: "2px 0 0 0" }}>
            Dicetak otomatis oleh Sistem IT Inventory pada: {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* JUDUL LAPORAN */}
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", margin: 0, textDecoration: "underline" }}>
            {getReportTitle()}
          </h3>

          {/* Subtitle Parameter Laporan */}
          {activeTab === "po" && (
            <p style={{ fontSize: "11px", marginTop: "4px", fontWeight: "bold" }}>
              Periode Rentang Tanggal: {formatDate(startDate)} s/d {formatDate(endDate)}
            </p>
          )}

          {activeTab === "lokasi" && (
            <p style={{ fontSize: "11px", marginTop: "4px", fontWeight: "bold" }}>
              Cakupan Pemetaan: Departemen / Lokasi {locationReportData.locName || "-"} 
              {deviceFilter !== "Semua" ? ` | Filter Aset: ${deviceFilter}` : ""}
            </p>
          )}
        </div>

        {/* TABEL DATA FISIK CETAK */}
        {activeTab === "stok" && (
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>No.</th>
                <th style={{ width: "90px" }}>Kode SKU</th>
                <th>Nama Barang Inventaris</th>
                <th style={{ width: "100px" }}>Kategori</th>
                <th style={{ width: "80px" }}>Stok Bagus</th>
                <th style={{ width: "80px" }}>Stok Rusak</th>
                <th style={{ width: "80px" }}>Total Stok</th>
                <th style={{ width: "120px" }}>Distribusi Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {stockReportData.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td style={{ fontFamily: "monospace" }}>{row.sku}</td>
                  <td style={{ fontWeight: "bold" }}>{row.name}</td>
                  <td>{row.category}</td>
                  <td className="text-center" style={{ fontWeight: "bold", color: "#10b981" }}>{formatStock(row.goodQuantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                  <td className="text-center" style={{ fontWeight: "bold", color: "#ef4444" }}>{formatStock(row.badQuantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                  <td className="text-center" style={{ fontWeight: "bold" }}>{formatStock(row.quantity, row.unit, row.has_conversion, row.conversion_unit, row.conversion_rate)}</td>
                  <td>{row.locations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "maintenance_infra" && (
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>No.</th>
                <th style={{ width: "110px" }}>Nomor Aset</th>
                <th>Nama Fasilitas Fisik</th>
                <th style={{ width: "90px" }}>Kategori</th>
                <th style={{ width: "110px" }}>Lokasi</th>
                <th style={{ width: "100px" }}>Jadwal Perawatan</th>
                <th style={{ width: "120px" }}>Vendor Servis</th>
              </tr>
            </thead>
            <tbody>
              {infraReportData.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td style={{ fontFamily: "monospace" }}>{row.asset_number}</td>
                  <td style={{ fontWeight: "bold" }}>{row.name}</td>
                  <td className="text-center">{row.category}</td>
                  <td>{row.location}</td>
                  <td className="text-center" style={{ fontWeight: "bold" }}>{formatDate(row.next_maintenance)}</td>
                  <td>{row.vendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "rusak" && (
          <div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "15px", padding: "10px", border: "1px solid black", background: "#f9f9f9" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", display: "block" }}>Total Barang Inventaris Rusak:</span>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {items.reduce((acc, item) => {
                    const badQty = item.item_stocks?.filter((s: any) => s.condition?.toLowerCase().includes("rusak") || s.condition === "Afkir").reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                    return acc + badQty;
                  }, 0)} Unit
                </span>
              </div>
              <div style={{ flex: 1, borderLeft: "1px solid black", paddingLeft: "20px" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", display: "block" }}>Total Komputer Rusak:</span>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {computers.filter(pc => pc.status?.toLowerCase().includes("rusak")).length} Unit
                </span>
              </div>
              <div style={{ flex: 1, borderLeft: "1px solid black", paddingLeft: "20px" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", display: "block" }}>Total Infrastruktur Rusak:</span>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {infrastructureAssets.filter(inf => inf.status?.toLowerCase().includes("rusak")).length} Aset
                </span>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>No.</th>
                  <th style={{ width: "120px" }}>Kelompok Aset</th>
                  <th style={{ width: "110px" }}>Kode Referensi</th>
                  <th>Nama Perangkat / Fasilitas Rusak</th>
                  <th style={{ width: "120px" }}>Lokasi Terakhir</th>
                  <th style={{ width: "180px" }}>Keterangan & Indikasi</th>
                </tr>
              </thead>
              <tbody>
                {damagedReportData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{row.type}</td>
                    <td style={{ fontFamily: "monospace" }}>{row.code}</td>
                    <td style={{ fontWeight: "bold" }}>{row.name}</td>
                    <td>{row.location}</td>
                    <td style={{ fontStyle: "italic" }}>{row.detail}</td>
                  </tr>
                ))}
                {damagedReportData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center" style={{ padding: "15px !important", fontStyle: "italic" }}>
                      - Nihil Catatan Kerusakan Sarana maupun Perangkat Komputer -
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "lokasi" && (
          <div>
            {/* Tabel Items */}
            {(deviceFilter === "Semua" || deviceFilter === "Barang") && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>
                  A. Daftar Barang Inventaris Gudang
                </div>
                <table className="report-table" style={{ marginTop: "2px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>No.</th>
                      <th style={{ width: "120px" }}>Kode SKU</th>
                      <th>Nama Barang</th>
                      <th style={{ width: "140px" }}>Kategori</th>
                      <th style={{ width: "100px" }}>Kuantitas Fisik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationReportData.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td style={{ fontFamily: "monospace" }}>{it.sku}</td>
                        <td>{it.name}</td>
                        <td>{it.category}</td>
                        <td className="text-center" style={{ fontWeight: "bold" }}>{formatStock(it.quantity, it.unit, it.has_conversion, it.conversion_unit, it.conversion_rate)}</td>
                      </tr>
                    ))}
                    {locationReportData.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ fontStyle: "italic" }}>Nihil barang terdaftar di lokasi ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabel Komputer */}
            {(deviceFilter === "Semua" || deviceFilter === "PC") && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>
                  B. Unit Perangkat Komputer & PC
                </div>
                <table className="report-table" style={{ marginTop: "2px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>No.</th>
                      <th style={{ width: "130px" }}>Nomor Aset</th>
                      <th>Hostname Komputer</th>
                      <th style={{ width: "140px" }}>Penanggung Jawab</th>
                      <th style={{ width: "120px" }}>Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationReportData.computers.map((pc, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td style={{ fontFamily: "monospace" }}>{pc.asset_number}</td>
                        <td style={{ fontWeight: "bold" }}>{pc.name}</td>
                        <td>{pc.user_assigned || "-"}</td>
                        <td style={{ fontFamily: "monospace" }}>{pc.ip_address || "-"}</td>
                      </tr>
                    ))}
                    {locationReportData.computers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ fontStyle: "italic" }}>Nihil perangkat komputer di lokasi ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabel Infrastruktur */}
            {(deviceFilter === "Semua" || !["Semua", "Barang", "PC"].includes(deviceFilter)) && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>
                  C. Sarana Infrastruktur & Fasilitas Fisik
                </div>
                <table className="report-table" style={{ marginTop: "2px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>No.</th>
                      <th style={{ width: "130px" }}>Nomor Aset</th>
                      <th>Nama Fasilitas</th>
                      <th style={{ width: "120px" }}>Kategori</th>
                      <th style={{ width: "100px" }}>Kondisi/Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationReportData.infra.map((inf, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td style={{ fontFamily: "monospace" }}>{inf.asset_number}</td>
                        <td style={{ fontWeight: "bold" }}>{inf.name}</td>
                        <td className="text-center">{inf.category}</td>
                        <td className="text-center">{inf.status}</td>
                      </tr>
                    ))}
                    {locationReportData.infra.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ fontStyle: "italic" }}>Nihil fasilitas fisik di lokasi ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "pc" && (
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>No.</th>
                <th style={{ width: "120px" }}>Nomor Aset PC</th>
                <th>Nama Hostname</th>
                <th style={{ width: "130px" }}>Penanggung Jawab</th>
                <th style={{ width: "120px" }}>Alamat IP</th>
                <th style={{ width: "110px" }}>Jadwal Perawatan</th>
              </tr>
            </thead>
            <tbody>
              {pcReportData.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center">{idx + 1}</td>
                  <td style={{ fontFamily: "monospace" }}>{row.asset_number}</td>
                  <td style={{ fontWeight: "bold" }}>{row.name}</td>
                  <td>{row.user_assigned}</td>
                  <td style={{ fontFamily: "monospace" }} className="text-center">{row.ip_address}</td>
                  <td className="text-center" style={{ fontWeight: "bold" }}>{formatDate(row.next_maintenance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "po" && (
          <div>
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>No.</th>
                  <th style={{ width: "110px" }}>Nomor PO</th>
                  <th style={{ width: "90px" }}>Tanggal</th>
                  <th>Pemasok / Supplier</th>
                  <th style={{ width: "110px" }}>Departemen</th>
                  <th style={{ width: "220px" }}>Rincian Barang & Catatan</th>
                  <th style={{ width: "100px" }}>Total Nilai</th>
                </tr>
              </thead>
              <tbody>
                {poReportData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td style={{ fontWeight: "bold" }}>{row.po_number}</td>
                    <td className="text-center">{formatDate(row.created_at)}</td>
                    <td>{row.supplier_name || "-"}</td>
                    <td>{row.department || "-"}</td>
                    <td>
                      {row.items && row.items.length > 0 ? (
                        <div style={{ fontSize: "10px", lineHeight: "1.3" }}>
                          {row.items.map((it: any, idx: number) => (
                            <div key={idx}>
                              • {it.items?.name || it.custom_item_name} ({it.quantity} {it.unit || 'PCS'})
                            </div>
                          ))}
                          {row.notes && (
                            <div style={{ fontStyle: "italic", fontSize: "9px", color: "#444", marginTop: "3px", backgroundColor: "#f9f9f9", padding: "2px", border: "1px dashed #ccc" }}>
                              Keterangan: {row.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontStyle: "italic", color: "#888" }}>Tidak ada rincian barang</span>
                      )}
                    </td>
                    <td className="text-right" style={{ fontFamily: "monospace", fontWeight: "bold" }}>
                      {formatCurr(row.total_amount)}
                    </td>
                  </tr>
                ))}
                {poReportData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ fontStyle: "italic" }}>
                      Nihil transaksi Purchase Order pada periode tanggal yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total Rangkuman Akuntansi PO */}
            {poReportData.length > 0 && (
              <div style={{ marginTop: "10px", textAlign: "right", fontSize: "11px" }}>
                <span>Total Rangkuman Transaksi: </span>
                <span style={{ fontWeight: "bold", fontFamily: "monospace", borderBottom: "1px solid black", paddingBottom: "2px" }}>
                  {formatCurr(poReportData.reduce((sum, curr) => sum + (curr.total_amount || 0), 0))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* BLOK TANDA TANGAN PENGESAHAN RESMI (SIGNATURES) */}
        <div style={{ marginTop: "40px", pageBreakInside: "avoid" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", paddingBottom: "50px" }}>Disiapkan Oleh,</td>
                <td style={{ width: "33%", paddingBottom: "50px" }}>Diperiksa Oleh,</td>
                <td style={{ width: "34%", paddingBottom: "50px" }}>Disetujui Oleh,</td>
              </tr>
              <tr>
                <td>
                  <span style={{ fontWeight: "bold", textDecoration: "underline", display: "block" }}>{signer1Name || "Admin Operasional"}</span>
                  <span style={{ fontSize: "10px" }}>{signer1Role || "Staf IT Inventory"}</span>
                </td>
                <td>
                  <span style={{ fontWeight: "bold", textDecoration: "underline", display: "block" }}>{signer2Name || "Kepala Bagian IT"}</span>
                  <span style={{ fontSize: "10px" }}>{signer2Role || "Manager Infrastruktur"}</span>
                </td>
                <td>
                  <span style={{ fontWeight: "bold", textDecoration: "underline", display: "block" }}>{signer3Name || "Direktur Keuangan"}</span>
                  <span style={{ fontSize: "10px" }}>{signer3Role || "Eksekutif Manajemen"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
