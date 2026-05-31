"use client";

import { useState } from "react";
import { Package, X, Loader2, Info, Search, Tags } from "lucide-react";
import { getCategoryItems } from "./actions";

interface CategoryItemsModalProps {
  categoryId: string;
  categoryName: string;
  totalItems: number;
  triggerLabel?: React.ReactNode;
}

export default function CategoryItemsModal({ 
  categoryId, 
  categoryName, 
  totalItems,
  triggerLabel
}: CategoryItemsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    const result = await getCategoryItems(categoryId);
    if (result.data) {
      setItems(result.data);
    }
    setIsLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper to calculate total unit quantity of all stocks for an item
  const getItemTotalQty = (item: any) => {
    return item.item_stocks?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0;
  };

  // Helper to count total quantity of all items in this list
  const getTotalQtySum = () => {
    return items.reduce((acc: number, item: any) => acc + getItemTotalQty(item), 0);
  };

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
          <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${totalItems > 0 ? 'bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white' : 'bg-surface text-text-muted border border-border'}`}>
            {totalItems.toLocaleString()} Item
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
                    <Tags className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{categoryName}</h2>
                    <p className="text-sm text-text-muted font-medium">Daftar barang inventaris dalam kategori ini</p>
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
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-text-muted animate-pulse uppercase tracking-widest">Memuat Daftar Barang...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 divide-y divide-border">
                  {filteredItems.map((item, idx) => {
                    const totalQty = getItemTotalQty(item);
                    return (
                      <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-background/50 transition-all group rounded-xl mx-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:border-primary/50 transition-all font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                                {item.categories?.name && item.categories.name !== categoryName && (
                                  <span className="text-[9px] text-primary font-bold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                                    📁 {item.categories.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-text-muted font-mono uppercase">{item.sku || "-"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-primary">{totalQty.toLocaleString()}</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">{item.unit || "Unit"}</p>
                          </div>
                        </div>

                        {/* Stock breakdown per location & condition */}
                        {item.item_stocks && item.item_stocks.length > 0 && (
                          <div className="pl-13 flex flex-wrap gap-1.5">
                            {item.item_stocks.map((stock: any, sIdx: number) => (
                              <div 
                                key={sIdx} 
                                className="flex items-center gap-1.5 text-[10px] font-bold bg-background border border-border rounded px-2 py-1 text-text-muted"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  stock.condition === 'Baru' ? 'bg-emerald-500' :
                                  stock.condition === 'Normal' ? 'bg-blue-500' :
                                  stock.condition?.includes('Rusak') || stock.condition === 'Afkir' ? 'bg-rose-500' :
                                  'bg-amber-500'
                                }`} />
                                <span>{stock.locations?.name || "Gudang"}</span>
                                <span className="text-foreground">({stock.quantity} {item.unit || "Pcs"})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-background p-4 rounded-full mb-4 border border-border">
                    <Info className="w-10 h-10 text-text-muted opacity-20" />
                  </div>
                  <p className="font-bold text-text-muted">Tidak Ada Barang</p>
                  <p className="text-xs text-text-muted/60 mt-1">Belum ada barang inventaris yang terdaftar di kategori ini.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/50 rounded-b-2xl flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <span>{filteredItems.length} Model Barang</span>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{getTotalQtySum().toLocaleString()} Total Unit</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
