"use client";

import { useState } from "react";
import { Printer, Save, Loader2, Globe, FileText } from "lucide-react";
import { updatePONotes } from "../actions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface POClientViewProps {
  po: any;
  items: any[];
}

export default function POClientView({ po, items }: POClientViewProps) {
  const [notes, setNotes] = useState(po.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await updatePONotes(po.id, notes);
    setIsSaving(false);
  };

  const generatePDF = () => {
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
    const tableData = items.map((item, index) => [
      index + 1,
      item.item_id ? item.items?.name : item.custom_item_name,
      item.unit || "PCS",
      item.quantity,
      `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(item.unit_price)}`,
      `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(item.quantity * item.unit_price)}`,
    ]);

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

    // Catatan Section (Label removed, direct content, height matched to rows above)
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

    doc.save(`PO-${po.po_number}.pdf`);
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
          <button 
            onClick={generatePDF}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF (Format PO)
          </button>
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
    </div>
  );
}
