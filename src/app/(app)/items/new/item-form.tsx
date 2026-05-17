"use client";
import { Save, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { createItem } from "../actions";

export default function ItemForm({ categories, locations }: { categories: any[]; locations: any[] }) {
  const [state, formAction, isPending] = useActionState(createItem, null);
  const [sku, setSku] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Auto-generate SKU logic
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        // Use category code (or first word of name) stripped of symbols
        const prefix = (category.code || category.name.split(' ')[0]).toUpperCase().replace(/[^A-Z0-9]/g, "");
        setSku(`${prefix}-AUTO`);
      }
    } else {
      setSku("");
    }
  }, [selectedCategory, categories]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nama Barang <span className="text-rose-500">*</span></label>
          <input 
            type="text" 
            name="name"
            required
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
            placeholder="Contoh: Laptop Lenovo ThinkPad" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori <span className="text-rose-500">*</span></label>
          <select 
            name="category_id"
            required
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
          >
            <option value="">Pilih Kategori...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium flex justify-between items-center">
            SKU / Kode Barang (Otomatis)
            {sku && <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold uppercase"><Sparkles className="w-3 h-3" /> Terkunci</span>}
          </label>
          <input 
            type="text" 
            name="sku"
            required
            readOnly
            value={sku}
            className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:outline-none font-mono text-primary font-bold cursor-not-allowed" 
            placeholder="Pilih kategori untuk generate SKU" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kondisi Barang</label>
          <select 
            name="condition"
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
          >
            <option value="Baru">Baru (Segel)</option>
            <option value="Normal">Normal (Bekas Bagus)</option>
            <option value="Rusak (Bisa Diperbaiki)">Rusak (Bisa Diperbaiki)</option>
            <option value="Rusak (Total)">Rusak (Total/Mati)</option>
            <option value="Afkir">Afkir / Disposal</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Harga (Rp)</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold pointer-events-none group-focus-within:text-primary transition-colors">Rp</span>
            <input 
              type="text" 
              placeholder="0"
              className="w-full bg-background border border-border rounded-lg pl-12 pr-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-primary"
              onChange={(e) => {
                // Remove non-digits
                const rawValue = e.target.value.replace(/\D/g, "");
                // Format with thousand separators
                const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                e.target.value = formattedValue;
                
                // Update hidden input
                const hiddenInput = document.getElementById("price_raw") as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = rawValue;
              }}
            />
            <input type="hidden" name="price" id="price_raw" value="0" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Stok Awal</label>
          <input 
            type="number" 
            name="initial_stock"
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
            placeholder="0" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Lokasi Penempatan (Jika ada stok)</label>
          <select 
            name="location_id"
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
          >
            <option value="">Pilih Lokasi...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Deskripsi Spesifikasi</label>
        <textarea 
          name="description"
          rows={4} 
          className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
          placeholder="Detail spesifikasi barang..."
        ></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link href="/items" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors text-text-muted">
          Batal
        </Link>
        <button 
          type="submit" 
          disabled={isPending}
          className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? "Menyimpan..." : "Simpan Barang"}
        </button>
      </div>
    </form>
  );
}
