"use client";

import { useState } from "react";
import { Loader2, Plus, ArrowUpRight, Scissors } from "lucide-react";
import { logItemUsage } from "../actions";
import { useToast } from "@/components/ui/ToastProvider";

interface ItemUsageFormProps {
  itemId: string;
  stocks: any[];
}

export default function ItemUsageForm({ itemId, stocks }: ItemUsageFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const availableStocks = stocks.filter(s => s.quantity > 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("item_id", itemId);

    try {
      await logItemUsage(formData);
      toast("Pemakaian barang berhasil dicatat!", "success");
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pemakaian.");
    } finally {
      setIsPending(false);
    }
  };

  if (availableStocks.length === 0) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center text-sm font-bold text-rose-500">
        Stok kosong. Tidak bisa melakukan mutasi pemakaian.
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
      >
        <Scissors className="w-4 h-4" />
        Catat Pemakaian (Mutasi Keluar)
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 text-primary">
          <Scissors className="w-4 h-4" /> Form Pemakaian Barang
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-xs text-text-muted hover:text-foreground border border-border bg-background px-2 py-1 rounded-lg font-bold"
        >
          Batal
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-muted uppercase">Ambil dari Lokasi Stok</label>
          <select 
            name="location_id" 
            required 
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="">-- Pilih Lokasi --</option>
            {availableStocks.map((s: any) => (
              <option key={s.locations?.id} value={s.locations?.id}>
                {s.locations?.name} (Sisa Stok: {s.quantity})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-muted uppercase">Jumlah Dipakai / Dikeluarkan</label>
          <input 
            type="number" 
            name="quantity" 
            min="1" 
            required 
            placeholder="Contoh: 5"
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-muted uppercase">Tujuan Penggunaan (Catatan)</label>
          <textarea 
            name="notes" 
            required 
            rows={2}
            placeholder="Contoh: Dipakai untuk perbaikan ruang rapat lantai 2..."
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          />
          <p className="text-[9px] text-text-muted italic">Mohon sebutkan nama proyek atau tujuan pemakaian untuk memudahkan pelacakan.</p>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
          Keluarkan Stok
        </button>
      </form>
    </div>
  );
}
