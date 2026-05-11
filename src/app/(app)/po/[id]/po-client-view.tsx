"use client";

import { useState } from "react";
import { Printer, Save, Loader2, Globe, FileText, UploadCloud, FileCheck, Eye, X, Download } from "lucide-react";
import { updatePONotes, uploadPOInvoice } from "../actions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface POClientViewProps {
  po: any;
  items: any[];
}

export default function POClientView({ po, items }: POClientViewProps) {
  const [notes, setNotes] = useState(po.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await updatePONotes(po.id, notes);
    setIsSaving(false);
  };

  const handleUploadInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append("invoice", file);
    
    const result = await uploadPOInvoice(po.id, formData);
    
    if (result.error) {
      setUploadError(result.error);
    }
    setIsUploading(false);
  };

  const createPODocument = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PURCHASING ORDER", 14, 20);
    
    // Header Info Labels
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Left Info
    doc.text("Request by", 14, 30);
    doc.text(":", 40, 30);
    doc.text(po.requested_by || "-", 45, 30);
    
    doc.text("Departement", 14, 37);
    doc.text(":", 40, 37);
    doc.text(po.department || "-", 45, 37);
    
    // Right Info
    const rightColX = 120;
    doc.text("Date Number", rightColX, 30);
    doc.text(":", rightColX + 25, 30);
    doc.text(new Date(po.created_at).toLocaleDateString("id-ID"), rightColX + 30, 30);
    
    doc.text("Supplier", rightColX, 37);
    doc.text(":", rightColX + 25, 37);
    doc.text(po.suppliers?.name || "-", rightColX + 30, 37);

    // Table Data
    const tableData = items.map((item, index) => {
      const name = item.item_id ? item.items?.name : item.custom_item_name;
      const desc = item.item_id ? item.items?.description : "";
      
      return [
        index + 1,
        desc ? `${name}\n(${desc})` : name,
        item.unit || "PCS",
        item.quantity,
        `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(item.unit_price)}`,
        `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(item.quantity * item.unit_price)}`,
      ];
    });

    // Draw Main Table
    autoTable(doc, {
      startY: 45,
      head: [["No.", "Description", "Unit", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        lineWidth: 0.1, 
        lineColor: [0, 0, 0] 
      },
      styles: { 
        fontSize: 9, 
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 35, halign: 'left' },
        5: { cellWidth: 35, halign: 'left' },
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // Draw Footer Rows (Voucher, Admin, Total) as cells
    const footerWidth = 35;
    const fullTableWidth = pageWidth - 28;
    const labelX = 14;
    const labelWidth = fullTableWidth - footerWidth;
    const footerX = 14 + labelWidth;

    const drawFooterRow = (label: string, value: number, y: number, isBold: boolean = false, prefix: string = "") => {
      doc.rect(labelX, y, labelWidth, 7);
      doc.rect(footerX, y, footerWidth, 7);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(`${label} :`, footerX - 2, y + 5, { align: 'right' });
      doc.text(`${prefix}Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`, footerX + 2, y + 5);
    };

    drawFooterRow("Voucher", po.discount_amount || 0, finalY, false, "- ");
    drawFooterRow("Biaya Admin", (po.admin_fee || 0) + (po.shipping_fee || 0), finalY + 7);
    drawFooterRow("Total", po.total_amount, finalY + 14, true);

    finalY += 21;

    // Catatan Section
    doc.rect(14, finalY, pageWidth - 28, 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(po.notes || "-", 16, finalY + 5);

    // Signatures
    const sigY = finalY + 12;
    doc.setFontSize(10);
    
    const sigColWidth = (pageWidth - 28) / 4;
    const getSigX = (index: number) => 14 + (sigColWidth * index) + (sigColWidth / 2);
    
    doc.text("Request By :", getSigX(0), sigY, { align: 'center' });
    doc.text("Created By :", getSigX(1), sigY, { align: 'center' });
    doc.text("Cheked By :", getSigX(2), sigY, { align: 'center' });
    doc.text("Approve By :", getSigX(3), sigY, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = createPODocument();
    doc.save(`PO-${po.po_number}.pdf`);
  };

  const handleDirectPrint = () => {
    const doc = createPODocument();
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
  };

  return (
    <div className="space-y-6">
      {/* Action Bar for PDF */}
      {po.status !== "Draft" && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Printer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Dokumen Siap Cetak</p>
              <p className="text-xs text-text-muted">Gunakan format PDF untuk proses persetujuan fisik.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleDirectPrint}
              className="bg-white hover:bg-background text-primary border border-primary/30 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Langsung
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20"
            >
              <FileText className="w-4 h-4" />
              Simpan PDF
            </button>
          </div>
        </div>
      )}

      {/* Invoice Section - Only if Completed or already has invoice */}
      {(po.status === "Selesai" || po.invoice_url) && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              {po.invoice_url ? <FileCheck className="w-6 h-6 text-emerald-500" /> : <UploadCloud className="w-6 h-6 text-emerald-500" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Lampiran Faktur / Invoice</h3>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500/50">
                {po.invoice_url ? "Faktur digital telah diunggah dan tersimpan." : "Unggah bukti faktur atau tanda terima barang."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {po.invoice_url && (
              <button 
                onClick={() => setShowInvoiceModal(true)}
                className="bg-white dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
              >
                <Eye className="w-4 h-4" />
                Lihat Faktur
              </button>
            )}

            <div className="relative">
              <input 
                type="file" 
                id="invoice-upload" 
                className="hidden" 
                accept="image/*,.pdf"
                onChange={handleUploadInvoice}
                disabled={isUploading}
              />
              <label 
                htmlFor="invoice-upload"
                className={`cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {po.invoice_url ? "Ganti Faktur" : "Unggah Faktur"}
              </label>
            </div>
          </div>

          {uploadError && (
            <p className="absolute -bottom-6 left-0 text-[10px] text-rose-500 font-medium">{uploadError}</p>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Catatan PO {po.status === 'Draft' && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase ml-2">Dapat di-edit</span>}
          </h3>
          {po.status === 'Draft' && (
            <button 
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="text-xs flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-bold transition-all border border-primary/20"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Simpan Catatan
            </button>
          )}
        </div>
        
        {po.status === 'Draft' ? (
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none italic"
            rows={4}
            placeholder="Tulis catatan atau alasan pembelian di sini..."
          />
        ) : (
          <div className="text-sm text-text-muted italic bg-background p-4 rounded-lg border border-dashed border-border min-h-[80px]">
            {po.notes || "Tidak ada catatan tambahan."}
          </div>
        )}
      </div>

      {/* Items with Links */}
      {items.some(i => i.item_link) && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-primary">
            <Globe className="w-4 h-4" />
            Referensi Link Produk (Online)
          </h3>
          <div className="space-y-3">
            {items.filter(i => i.item_link).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border group hover:border-primary/50 transition-all">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{item.items?.name || item.custom_item_name}</span>
                  <span className="text-[10px] text-text-muted truncate max-w-[300px]">{item.item_link}</span>
                </div>
                <a 
                  href={item.item_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded font-bold hover:bg-primary hover:text-white transition-all border border-primary/20"
                >
                  Buka Link
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && po.invoice_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Faktur / Tanda Terima</p>
                  <p className="text-[10px] text-text-muted">{po.po_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={po.invoice_url} 
                  download={`Invoice-${po.po_number}`}
                  className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
                  title="Download File"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6 bg-background/20 flex items-center justify-center">
              {po.invoice_url.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={po.invoice_url} 
                  className="w-full h-full min-h-[600px] rounded-lg border border-border"
                />
              ) : (
                <img 
                  src={po.invoice_url} 
                  alt="Invoice" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
