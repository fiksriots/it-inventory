"use client";

import React, { useState } from "react";
import { ShoppingCart, Plus, Eye, Calendar, Building2, ChevronLeft, ChevronRight, Printer, CheckSquare, Square, AlertCircle } from "lucide-react";
import Link from "next/link";
import POSearch from "./po-search";
import POFilter from "./po-filter";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        alert("Maksimal pencetakan dalam 1 lembar kertas adalah 3 Purchase Order.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedPOs = pos.filter(p => selectedIds.includes(p.id));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount || 0);
  };

  const handlePrint = () => {
    if (selectedPOs.length === 0) {
      alert("Silakan centang minimal 1 PO terlebih dahulu (maksimal 3 PO).");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Embedded Print Styling */}
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
          }
          .no-print {
            display: none !important;
          }
          .po-print-card {
            height: 31.5vh !important;
            max-height: 32vh !important;
            box-sizing: border-box;
            page-break-inside: avoid;
            border-bottom: 2px dashed #888 !important;
            padding: 12px 0 !important;
            margin-bottom: 8px !important;
            overflow: hidden;
          }
          .po-print-card:last-child {
            border-bottom: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
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
            title="Cetak hingga 3 PO sekaligus dalam 1 lembar kertas"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak PO Terpilih ({selectedPOs.length}/3)</span>
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

      {/* Peringatan & Info Pilihan Cetak */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between animate-in fade-in duration-200 no-print">
          <div className="flex items-center gap-2.5 text-amber-500 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Anda telah memilih {selectedIds.length} PO untuk dicetak bersamaan (Maksimal 3 PO per halaman kertas fisik).</span>
          </div>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-[10px] bg-background hover:bg-surface text-text-muted px-2 py-1 rounded border border-border font-bold uppercase tracking-wider"
          >
            Reset Pilihan
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden no-print">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <POSearch />
            <POFilter />
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
                          onClick={() => toggleSelect(po.id)}
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
                      <td className="px-6 py-4 font-bold text-right">{formatCurrency(po.total_amount)}</td>
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

      {/* Wadah Pencetakan Tersembunyi (Hanya Muncul Saat Mode Print) */}
      <div id="printable-multi-po" className="hidden">
        {selectedPOs.map((po, index) => (
          <div key={po.id} className="po-print-card text-black font-sans">
            {/* Header Ringkas PO */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-tight m-0 leading-none">PURCHASE ORDER</h2>
                <p className="text-[10px] text-gray-500 m-0 mt-0.5 font-mono">Formulir Pesanan Barang Resmi</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-black block leading-none">{po.po_number}</span>
                <span className="text-[9px] text-gray-600 block mt-0.5">Tgl: {new Date(po.created_at).toLocaleDateString("id-ID")}</span>
              </div>
            </div>

            {/* Informasi Supplier & Departemen */}
            <div className="grid grid-cols-2 gap-2 text-[10px] mb-2 bg-gray-50 p-1.5 rounded">
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Kepada Supplier:</span>
                <strong className="text-black text-xs block truncate">{po.supplier_name || "Vendor Internal"}</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-bold">Departemen Pemohon:</span>
                <strong className="text-black text-xs block truncate">{po.department || "Logistik & Sarana"}</strong>
              </div>
            </div>

            {/* Ringkasan Item Pesanan */}
            <div className="mb-2">
              <table className="w-full text-[9px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-600">
                    <th className="py-0.5 font-bold">Deskripsi Barang</th>
                    <th className="py-0.5 text-center w-12 font-bold">Jumlah</th>
                    <th className="py-0.5 text-right font-bold">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {po.items && po.items.length > 0 ? (
                    po.items.slice(0, 2).map((it: any, itIdx: number) => (
                      <tr key={itIdx}>
                        <td className="py-0.5 truncate max-w-[150px] font-medium">{it.items?.name || "Material Item"}</td>
                        <td className="py-0.5 text-center">{it.quantity} {it.unit || "Unit"}</td>
                        <td className="py-0.5 text-right font-mono">{formatCurrency(it.unit_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-0.5 italic text-gray-500">Paket inventaris sarana fisik</td>
                      <td className="py-0.5 text-center">-</td>
                      <td className="py-0.5 text-right font-mono">{formatCurrency(po.total_amount)}</td>
                    </tr>
                  )}
                  {po.items && po.items.length > 2 && (
                    <tr>
                      <td colSpan={3} className="py-0.5 text-[8px] italic text-gray-500 text-center">
                        + {po.items.length - 2} item lainnya tercantum dalam lampiran terpisah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Pembayaran & Kolom Tanda Tangan */}
            <div className="flex justify-between items-end border-t border-gray-300 pt-2 mt-auto">
              <div>
                <span className="text-[8px] text-gray-500 block uppercase font-bold">Status Dokumen:</span>
                <span className="text-[9px] font-bold uppercase text-black block">{po.status}</span>
              </div>

              <div className="text-center px-4">
                <span className="text-[8px] text-gray-400 block mb-3">Mengetahui / Menyetujui</span>
                <div className="border-b border-gray-400 w-24 mx-auto"></div>
                <span className="text-[7px] text-gray-500 block mt-0.5">Authorized Signature</span>
              </div>

              <div className="text-right">
                <span className="text-[8px] text-gray-500 block uppercase font-bold">Total Tagihan:</span>
                <strong className="text-xs font-extrabold text-black block font-mono">{formatCurrency(po.total_amount)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
