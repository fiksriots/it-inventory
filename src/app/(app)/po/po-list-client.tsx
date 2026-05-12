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

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        alert("Maksimal pencetakan dalam 1 lembar kertas adalah 3 dokumen form PO.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedPOs = pos.filter(p => selectedIds.includes(p.id));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount || 0);
  };

  const handlePrint = () => {
    if (selectedPOs.length === 0) {
      alert("Silakan centang minimal 1 form PO terlebih dahulu (maksimal 3 PO).");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Embedded CSS Print Styling Khusus Dokumen Form Lengkap (Maks 3 per Halaman) */}
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
          .po-full-form-print {
            height: 31.5vh !important;
            max-height: 32vh !important;
            box-sizing: border-box;
            page-break-inside: avoid;
            border-bottom: 2px dashed #000 !important;
            padding: 6px 0 !important;
            margin-bottom: 4px !important;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif !important;
            color: #000 !important;
            line-height: 1.15 !important;
          }
          .po-full-form-print:last-child {
            border-bottom: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
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
            title="Cetak formulir lengkap hingga 3 PO sekaligus dalam 1 lembar kertas"
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

      {/* Peringatan & Info Pilihan Cetak */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between animate-in fade-in duration-200 no-print">
          <div className="flex items-center gap-2.5 text-amber-500 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Terpilih: {selectedIds.length} Form PO. Dokumen asli akan dicetak bersusun (Maksimal 3 form per halaman kertas fisik).</span>
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
                      <td className="px-6 py-4 font-bold text-right">Rp. {formatCurrency(po.total_amount)}</td>
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

      {/* Wadah Render Form Dokumen PO Asli / Lengkap (Hanya Muncul Saat Mode Pencetakan Fisik) */}
      <div id="printable-multi-po" className="hidden">
        {selectedPOs.map((po) => {
          const adminFeeTotal = (po.admin_fee || 0) + (po.shipping_fee || 0);
          const discountTotal = po.discount_amount || 0;

          return (
            <div key={po.id} className="po-full-form-print">
              {/* JUDUL HEADER IDENTIK DENGAN PDF */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xs font-bold tracking-tight m-0 leading-none">PURCHASING ORDER</h2>
                </div>
                <div className="text-right">
                  {/* Kosong agar sejajar identik */}
                </div>
              </div>

              {/* BARIS METADATA REQUEST BY, DEPT, DATE, SUPPLIER */}
              <div className="grid grid-cols-2 gap-4 text-[7.5px] mb-1.5">
                {/* Sisi Kiri */}
                <div className="space-y-0.5">
                  <div className="flex">
                    <span className="w-16 inline-block">Request by</span>
                    <span className="w-2">:</span>
                    <span className="font-bold">{po.requested_by || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-16 inline-block">Departement</span>
                    <span className="w-2">:</span>
                    <span className="font-bold">{po.department || "-"}</span>
                  </div>
                </div>

                {/* Sisi Kanan */}
                <div className="space-y-0.5">
                  <div className="flex">
                    <span className="w-16 inline-block">Date Number</span>
                    <span className="w-2">:</span>
                    <span className="font-bold">
                      {new Date(po.created_at).toLocaleDateString("id-ID")} - <span className="underline">{po.po_number}</span>
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-16 inline-block">Supplier</span>
                    <span className="w-2">:</span>
                    <span className="font-bold">{po.supplier_name || po.suppliers?.name || "-"}</span>
                  </div>
                </div>
              </div>

              {/* MAIN TABLE IDENTIK GRID THEME */}
              <table className="w-full text-[7.5px] border border-black border-collapse mb-1">
                <thead>
                  <tr className="border-b border-black text-black font-bold text-left">
                    <th className="p-1 border-r border-black w-6 text-center">No.</th>
                    <th className="p-1 border-r border-black">Description</th>
                    <th className="p-1 border-r border-black w-10 text-center">Unit</th>
                    <th className="p-1 border-r border-black w-8 text-center">Qty</th>
                    <th className="p-1 border-r border-black w-20 text-left">Unit Price</th>
                    <th className="p-1 w-20 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {po.items && po.items.length > 0 ? (
                    po.items.map((it: any, idx: number) => {
                      const name = it.item_id ? it.items?.name : it.custom_item_name;
                      const desc = it.item_id ? it.items?.description : "";
                      const fullDesc = desc ? `${name} (${desc})` : name;
                      const amt = it.quantity * it.unit_price;

                      return (
                        <tr key={idx} className="border-b border-black">
                          <td className="p-1 border-r border-black text-center font-bold">{idx + 1}</td>
                          <td className="p-1 border-r border-black font-medium truncate max-w-[140px]">{fullDesc || "-"}</td>
                          <td className="p-1 border-r border-black text-center">{it.unit || "PCS"}</td>
                          <td className="p-1 border-r border-black text-center font-bold">{it.quantity}</td>
                          <td className="p-1 border-r border-black">Rp. {formatCurrency(it.unit_price)}</td>
                          <td className="p-1 font-bold">Rp. {formatCurrency(amt)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-black">
                      <td className="p-1 border-r border-black text-center">1</td>
                      <td className="p-1 border-r border-black italic">Paket Pembelian Dokumen Internal</td>
                      <td className="p-1 border-r border-black text-center">PCS</td>
                      <td className="p-1 border-r border-black text-center">1</td>
                      <td className="p-1 border-r border-black">Rp. {formatCurrency(po.total_amount)}</td>
                      <td className="p-1 font-bold">Rp. {formatCurrency(po.total_amount)}</td>
                    </tr>
                  )}

                  {/* KOTAK FOOTER ROWS (Voucher, Admin, Total) */}
                  <tr className="border-t border-black">
                    <td colSpan={4} rowSpan={3} className="p-1 border-r border-black align-top border-b border-black">
                      <div className="text-[7px]">
                        <span className="underline block font-bold mb-0.5">Catatan / Notes:</span>
                        <p className="m-0 italic line-clamp-2">{po.notes || "-"}</p>
                      </div>
                    </td>
                    <td className="p-1 border-r border-black border-b border-black text-right font-medium">Voucher :</td>
                    <td className="p-1 border-b border-black">- Rp. {formatCurrency(discountTotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border-r border-black border-b border-black text-right font-medium">Biaya Admin :</td>
                    <td className="p-1 border-b border-black">Rp. {formatCurrency(adminFeeTotal)}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <td className="p-1 border-r border-black text-right font-bold">Total :</td>
                    <td className="p-1 font-bold">Rp. {formatCurrency(po.total_amount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* KOLOM TANDA TANGAN (SIGNATURES) IDENTIK DENGAN KETENTUAN 4 PIHAK */}
              <div className="grid grid-cols-4 text-center text-[7.5px] pt-1 mt-auto">
                <div>
                  <span className="block mb-5">Request By :</span>
                  <span className="border-t border-black px-2 block w-16 mx-auto font-bold">{po.requested_by || "Pemohon"}</span>
                </div>
                <div>
                  <span className="block mb-5">Created By :</span>
                  <span className="border-t border-black px-2 block w-16 mx-auto font-bold">Staf Logistik</span>
                </div>
                <div>
                  <span className="block mb-5">Checked By :</span>
                  <span className="border-t border-black px-2 block w-16 mx-auto font-bold">Supervisor</span>
                </div>
                <div>
                  <span className="block mb-5">Approve By :</span>
                  <span className="border-t border-black px-2 block w-16 mx-auto font-bold">Manajemen</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
