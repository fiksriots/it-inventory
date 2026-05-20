"use client";

import React, { useState } from "react";
import { ShoppingCart, Plus, Eye, Calendar, Building2, ChevronLeft, ChevronRight, Printer, CheckSquare, Square, AlertCircle } from "lucide-react";
import Link from "next/link";
import POSearch from "./po-search";
import POFilter from "./po-filter";
import ExcelImportExport from "@/components/ui/ExcelImportExport";
import { getAllPurchaseOrdersForExport, importPurchaseOrdersBulk } from "@/app/(app)/services/import-export-actions";

const poTemplate = [
  {
    "Nomor PO": "PO-20260517-001",
    "Supplier": "PT Mandiri Sukses",
    "Status": "Selesai",
    "Nama Barang": "Laptop Asus VivoBook",
    "SKU Barang": "-AUTO",
    "Jumlah": 5,
    "Harga Satuan": 12000000,
    "Tanggal Dibuat": "2026-05-17"
  },
  {
    "Nomor PO": "PO-20260517-001",
    "Supplier": "PT Mandiri Sukses",
    "Status": "Selesai",
    "Nama Barang": "Keyboard Wireless Logitech",
    "SKU Barang": "-AUTO",
    "Jumlah": 10,
    "Harga Satuan": 450000,
    "Tanggal Dibuat": "2026-05-17"
  }
];

interface POListClientProps {
  pos: any[];
  count: number;
  currentPage: number;
  totalPages: number;
  statuses: any[];
  q?: string;
  status?: string;
  error?: any;
}

export default function POListClient({
  pos,
  count,
  currentPage,
  totalPages,
  statuses,
  q,
  status,
  error
}: POListClientProps) {
  const [selectedPOs, setSelectedPOs] = useState<any[]>([]);
  
  // Load saved POs from sessionStorage
  React.useEffect(() => {
    const saved = sessionStorage.getItem("selectedPOsToPrint");
    if (saved) {
      try {
        setSelectedPOs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save POs to sessionStorage whenever it changes
  React.useEffect(() => {
    sessionStorage.setItem("selectedPOsToPrint", JSON.stringify(selectedPOs));
  }, [selectedPOs]);

  const selectedIds = selectedPOs.map(p => p.id);

  const toggleSelect = (poObj: any) => {
    if (selectedIds.includes(poObj.id)) {
      setSelectedPOs(selectedPOs.filter(item => item.id !== poObj.id));
    } else {
      if (selectedPOs.length >= 3) {
        alert("Maksimal pencetakan dalam 1 lembar kertas fisik adalah 3 dokumen form PO agar tersusun rapi.");
        return;
      }
      setSelectedPOs([...selectedPOs, poObj]);
    }
  };

  // Format angka identik dengan screenshot (contoh: 200.000 tanpa desimal)
  const formatSimpleCurr = (amount: number) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount);
  };

  const handlePrint = () => {
    if (selectedPOs.length === 0) {
      alert("Silakan centang minimal 1 form PO pada tabel terlebih dahulu (maksimal 3 PO).");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Embedded CSS Print Styling Khusus Susunan Hemat Kertas (Maks 3 PO per Halaman Fisik) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-multi-po, #printable-multi-po * {
            visibility: visible;
          }
          #printable-multi-po {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
            display: block !important; /* FIX: Paksa tampil menimpa class hidden */
          }
          .no-print {
            display: none !important;
          }
          .compact-po-form {
            box-sizing: border-box;
            page-break-inside: avoid;
            padding: 0 !important;
            margin-bottom: 0 !important;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif !important;
            color: #000 !important;
            line-height: 1.25 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-text-muted mt-1">Kelola dokumen pembelian barang ke supplier.</p>
        </div>
        
        {/* Tombol Buat PO Baru dan Cetak Beberapa PO Bersebelahan di Sisi Kanan */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            disabled={selectedPOs.length === 0}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all ${
              selectedPOs.length > 0 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95" 
                : "bg-surface border border-border text-text-muted cursor-not-allowed opacity-50"
            }`}
            title="Cetak susunan hemat kertas hingga 3 PO sekaligus dalam 1 lembar fisik"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak Form PO Terpilih ({selectedPOs.length}/3)</span>
          </button>

          <Link 
            href="/po/new" 
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Buat PO Baru</span>
          </Link>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {statuses.map((s, i) => (
          <div key={i} className={`${s.bg} border border-border rounded-xl p-5 shadow-sm group hover:border-primary/30 transition-all`}>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Banner Edukasi Hemat Kertas Terintegrasi */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 no-print">
        <div className="flex items-center gap-3 text-blue-500 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <span>💡 <strong>Hemat Kertas:</strong> Centang hingga 3 dokumen PO pada tabel di bawah untuk mencetaknya bersusun secara padat ke dalam 1 lembar kertas fisik yang sama!</span>
            {selectedIds.length > 0 && (
              <span className="block mt-0.5 text-amber-500 font-black">
                Terpilih saat ini: {selectedIds.length} dari maksimal 3 PO per lembar cetak.
              </span>
            )}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={() => setSelectedPOs([])}
            className="text-[10px] bg-background hover:bg-surface text-text-muted px-2.5 py-1.5 rounded border border-border font-bold uppercase tracking-wider shrink-0"
          >
            Reset Pilihan
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden no-print">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <POSearch />
            <POFilter />
            <ExcelImportExport
              exportAction={getAllPurchaseOrdersForExport}
              importAction={importPurchaseOrdersBulk}
              templateData={poTemplate}
              fileName="Data_PO"
              buttonLabel="Purchase Order"
            />
          </div>
          
          <div className="text-xs text-text-muted flex items-center gap-4">
            {(q || status) && (
              <div className="hidden sm:block">
                Hasil: <span className="text-primary font-bold">{count || 0}</span> data
              </div>
            )}
            <div className="bg-background/50 border border-border px-3 py-1.5 rounded-lg flex items-center gap-3">
              <span className="font-medium">Halaman <span className="text-white">{currentPage}</span> dari {totalPages || 1}</span>
              <div className="flex items-center border-l border-border pl-3 gap-1">
                <Link 
                  href={{ query: { ... (q ? {q} : {}), ... (status ? {status} : {}), page: Math.max(1, currentPage - 1) } }}
                  className={`p-1 rounded hover:bg-surface transition-colors ${currentPage <= 1 ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link 
                  href={{ query: { ... (q ? {q} : {}), ... (status ? {status} : {}), page: Math.min(totalPages, currentPage + 1) } }}
                  className={`p-1 rounded hover:bg-surface transition-colors ${currentPage >= totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-muted uppercase tracking-widest bg-background/80 border-b border-border">
              <tr>
                <th className="w-12 px-4 py-4 text-center font-bold">Cetak</th>
                <th className="px-6 py-4 font-bold">Nomor PO</th>
                <th className="px-6 py-4 font-bold">Tanggal</th>
                <th className="px-6 py-4 font-bold">Supplier</th>
                <th className="px-6 py-4 font-bold">Departemen</th>
                <th className="px-6 py-4 font-bold text-right">Total Nilai</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pos && pos.length > 0 ? (
                pos.map((po: any) => {
                  const isChecked = selectedIds.includes(po.id);
                  const isDisabled = !isChecked && selectedIds.length >= 3;

                  return (
                    <tr key={po.id} className={`hover:bg-background/50 transition-all group ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelect(po)}
                          disabled={isDisabled}
                          className={`p-1 rounded transition-transform active:scale-90 ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary'}`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                          ) : (
                            <Square className="w-5 h-5 text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold group-hover:text-primary transition-colors">{po.po_number}</span>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(po.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{po.supplier_name || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-text-muted">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="text-xs">{po.department || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-right">Rp. {formatSimpleCurr(po.total_amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-tighter ${
                          po.status === 'Draft' ? 'bg-surface text-text-muted border-border' :
                          po.status === 'Menunggu Persetujuan' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          po.status === 'Disetujui' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          po.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/po/${po.id}`}
                          className="p-2 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-all inline-block border border-transparent hover:border-primary/20"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-text-muted bg-background/20">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-16 h-16 mb-4 opacity-10 text-primary" />
                      <p className="text-lg font-medium text-foreground/50">Tidak ada data ditemukan</p>
                      <p className="text-sm opacity-50 mt-1">Coba ubah kata kunci atau filter Anda.</p>
                      {error && <p className="text-rose-500 text-xs mt-4 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">{error.message}</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WADAH CETAK SUSUNAN HEMAT KERTAS (REPLIKA IDENTIK SCREENSHOT) */}
      <div id="printable-multi-po" className="hidden print:block">
        {selectedPOs.map((po, index) => {
          const adminFeeTotal = (po.admin_fee || 0) + (po.shipping_fee || 0);
          const discountTotal = po.discount_amount || 0;
          const reqBy = po.requested_by || "fikri";
          const dept = po.department || "bay arena";
          const supplierName = po.supplier_name || po.suppliers?.name || "TRILOGI";
          const dateStr = new Date(po.created_at).toLocaleDateString("id-ID", {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          });

          return (
            <div key={po.id} className="compact-po-form">
              {/* JUDUL IDENTIK */}
              <div className="text-[14px] font-black text-black mb-1.5 tracking-wide">PURCHASING ORDER</div>

              {/* KOP METADATA TANPA BORDER BAWAH */}
              <div className="flex justify-between text-[10px] text-black mb-1.5">
                {/* Bagian Kiri */}
                <div className="w-[45%] space-y-0.5">
                  <div className="flex">
                    <span className="w-20 inline-block font-normal">Request by</span>
                    <span className="w-3">:</span>
                    <span className="flex-1 font-medium">{reqBy}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 inline-block font-normal">Departement</span>
                    <span className="w-3">:</span>
                    <span className="flex-1 font-medium">{dept}</span>
                  </div>
                </div>

                {/* Bagian Kanan */}
                <div className="w-[45%] space-y-0.5">
                  <div className="flex">
                    <span className="w-20 inline-block font-normal">Date Number</span>
                    <span className="w-3">:</span>
                    <span className="flex-1 font-medium">{dateStr}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 inline-block font-normal">Supplier</span>
                    <span className="w-3">:</span>
                    <span className="flex-1 font-medium">{supplierName}</span>
                  </div>
                </div>
              </div>

              {/* TABEL GRID BERSUSUN HEMAT SPACE */}
              <table className="w-full text-[10px] text-black border-collapse mb-1.5">
                <thead>
                  <tr className="font-bold text-left bg-white">
                    <th className="p-1 border border-black w-8 text-center font-bold">No.</th>
                    <th className="p-1 border border-black font-bold">Description</th>
                    <th className="p-1 border border-black w-12 text-center font-bold">Unit</th>
                    <th className="p-1 border border-black w-10 text-center font-bold">Qty</th>
                    <th className="p-1 border border-black w-24 text-left font-bold">Unit Price</th>
                    <th className="p-1 border border-black w-24 text-left font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="font-normal">
                  {po.items && po.items.length > 0 ? (
                    po.items.map((it: any, idx: number) => {
                      const name = it.item_id ? it.items?.name : it.custom_item_name;
                      const desc = it.item_id ? it.items?.description : "";
                      const fullDesc = desc ? `${name} (${desc})` : name;
                      const amt = it.quantity * it.unit_price;

                      return (
                        <tr key={idx}>
                          <td className="p-1 border border-black text-center">{idx + 1}</td>
                          <td className="p-1 border border-black truncate max-w-[160px]">{fullDesc || "-"}</td>
                          <td className="p-1 border border-black text-center">{it.unit || "PCS"}</td>
                          <td className="p-1 border border-black text-center">{it.quantity}</td>
                          <td className="p-1 border border-black font-medium">Rp. {formatSimpleCurr(it.unit_price)}</td>
                          <td className="p-1 border border-black font-medium">Rp. {formatSimpleCurr(amt)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="p-1 border border-black text-center">1</td>
                      <td className="p-1 border border-black italic">Paket Inventaris Sarana</td>
                      <td className="p-1 border border-black text-center">PCS</td>
                      <td className="p-1 border border-black text-center">1</td>
                      <td className="p-1 border border-black">Rp. {formatSimpleCurr(po.total_amount)}</td>
                      <td className="p-1 border border-black font-medium">Rp. {formatSimpleCurr(po.total_amount)}</td>
                    </tr>
                  )}

                  {/* SUBTOTALS */}
                  <tr>
                    <td colSpan={4} rowSpan={3} className="p-1.5 border border-black align-top">
                      {/* Ruang kosong di kiri bawah (di sebelah subtotals) */}
                    </td>
                    <td className="p-1 border border-black text-right font-medium">Voucher :</td>
                    <td className="p-1 border border-black font-medium">- Rp. {formatSimpleCurr(discountTotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black text-right font-medium">Biaya Admin :</td>
                    <td className="p-1 border border-black font-medium">Rp. {formatSimpleCurr(adminFeeTotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black text-right font-bold">Total :</td>
                    <td className="p-1 border border-black font-bold">Rp. {formatSimpleCurr(po.total_amount)}</td>
                  </tr>
                  {/* BARIS CATATAN BERGABUNG DI BAWAH TOTAL */}
                  {po.notes && (
                    <tr>
                      <td colSpan={6} className="p-1.5 border border-black align-top text-left">
                        <div className="font-bold text-[9px] mb-0.5">Catatan :</div>
                        <div className="font-medium uppercase text-[10px] whitespace-pre-wrap leading-tight">
                          {po.notes}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* TANDA TANGAN (SIGNATURES) SEJAJAR LANGSUNG MEPET BAWAH CATATAN */}
              <div className="grid grid-cols-4 text-center text-[10px] text-black pt-1 pb-10">
                <span className="font-medium">Request By :</span>
                <span className="font-medium">Created By :</span>
                <span className="font-medium">Cheked By :</span>
                <span className="font-medium">Approve By :</span>
              </div>

              {/* Garis Potong (hanya tampil jika bukan elemen terakhir) */}
              {index < selectedPOs.length - 1 && (
                <div className="flex items-center justify-center my-6">
                  <div className="border-t border-dashed border-gray-400 flex-grow"></div>
                  <span className="px-4 text-[10px] text-gray-500 italic uppercase tracking-widest bg-white">✂ Gunting di sini ✂</span>
                  <div className="border-t border-dashed border-gray-400 flex-grow"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
