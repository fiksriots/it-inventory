"use client";

import React, { useState } from "react";
import { ExternalLink, Download, X, Eye, FileText } from "lucide-react";

interface ImagePopupViewerProps {
  title: string;
  url: string;
  buttonLabel: string;
  variant?: "primary" | "success";
}

export default function ImagePopupViewer({ title, url, buttonLabel, variant = "primary" }: ImagePopupViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPdf = url.startsWith("data:application/pdf") || url.toLowerCase().endsWith(".pdf");

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = url;
    const ext = isPdf ? "pdf" : "jpg";
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    link.download = `lampiran-${safeTitle}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSuccess = variant === "success";

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all group text-xs font-bold border text-left ${
          isSuccess
            ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            : "bg-background border-border hover:border-primary/50 text-primary"
        }`}
      >
        <span className="truncate flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          {buttonLabel}
        </span>
        <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:scale-110 ${isSuccess ? "text-emerald-500" : "text-text-muted group-hover:text-primary"}`} />
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background/50">
              <div className="flex items-center gap-2">
                {isPdf ? <FileText className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-primary" />}
                <h3 className="text-sm font-bold text-foreground truncate max-w-md sm:max-w-xl">{title}</h3>
              </div>

              {/* Top Right Buttons: Download & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-md shadow transition-all"
                  title="Unduh Berkas ke Perangkat"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Tutup Tampilan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content / Image Canvas */}
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-background/30 min-h-[300px]">
              {isPdf ? (
                <iframe 
                  src={url} 
                  className="w-full h-[70vh] rounded-lg bg-white border border-border" 
                  title={title}
                />
              ) : (
                <img 
                  src={url} 
                  alt={title} 
                  className="max-h-[75vh] max-w-full object-contain rounded-lg border border-border/50 shadow-inner"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-border bg-background/50 flex items-center justify-between text-[10px] text-text-muted font-medium">
              <span>Format: {isPdf ? "Dokumen PDF" : "Gambar / Foto"}</span>
              <span className="italic">Tekan tombol Download di atas untuk menyimpan berkas aslinya.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
