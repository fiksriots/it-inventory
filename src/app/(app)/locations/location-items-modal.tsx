"use client";

import { useState } from "react";
import { Package, X, Loader2, Info, Search } from "lucide-react";
import { getLocationItems } from "./actions";

interface LocationItemsModalProps {
  locationId: string;
  locationName: string;
  totalItems: number;
  triggerLabel?: React.ReactNode;
}

export default function LocationItemsModal({ 
  locationId, 
  locationName, 
  totalItems,
  triggerLabel
}: LocationItemsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    const result = await getLocationItems(locationId);
    if (result.data) {
      setItems(result.data);
    }
    setIsLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.items?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.items?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {triggerLabel ? (
        <div onClick={handleOpen} className="inline-block cursor-pointer">
          {triggerLabel}
        </div>
      ) : (
        <button 
          onClick={handleOpen}
          className="group flex flex-col items-center gap-1 hover:scale-105 transition-all"
        >
          <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${totalItems > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-surface text-text-muted border border-border'}`}>
            {totalItems.toLocaleString()} Unit
          </span>
          <span className="text-[9px] uppercase tracking-tighter text-text-muted font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Lihat Detail
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border bg-background/50 rounded-t-2xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{locationName}</h2>
                    <p className="text-sm text-text-muted font-medium">Daftar stok barang di lokasi ini</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              {!isLoading && items.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text"
                    placeholder="Cari nama barang atau SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-text-muted animate-pulse uppercase tracking-widest">Memuat Data Stok...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 divide-y divide-border">
                  {filteredItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-background/50 transition-all group rounded-xl mx-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:border-primary/50 transition-all font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.items?.name}</p>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              item.condition === 'Rusak' || item.condition?.includes('Rusak') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                              item.condition === 'Baru' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                              item.condition === 'Belum Di Cek' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {item.condition}
                            </span>
                            {item.locations?.name && (
                              <span className="text-[9px] text-text-muted font-medium bg-background border border-border px-1.5 py-0.5 rounded">
                                📍 {item.locations.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted font-mono uppercase">{item.items?.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{item.quantity.toLocaleString()}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">Unit Tersedia</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-background p-4 rounded-full mb-4 border border-border">
                    <Info className="w-10 h-10 text-text-muted opacity-20" />
                  </div>
                  <p className="font-bold text-text-muted">Tidak Ada Barang</p>
                  <p className="text-xs text-text-muted/60 mt-1">Belum ada stok barang yang tercatat di lokasi ini.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/50 rounded-b-2xl flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <span>{filteredItems.length} Jenis Barang</span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{totalItems.toLocaleString()} Total Unit</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
