"use client";
import { Save, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { createItem } from "../actions";

const generateCategoryCode = (name: string): string => {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase().trim();
  if (!clean) return "";
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map(w => w[0]).join("").substring(0, 4);
  } else {
    const vowels = ["A", "E", "I", "O", "U"];
    const word = words[0];
    if (word.length <= 4) return word;
    const consonants = word.split("").filter((char, idx) => idx === 0 || !vowels.includes(char));
    if (consonants.length >= 3) {
      return consonants.join("").substring(0, 3);
    }
    return word.substring(0, 3);
  }
};

export default function ItemForm({ categories, locations }: { categories: any[]; locations: any[] }) {
  const [state, formAction, isPending] = useActionState(createItem, null);
  const [sku, setSku] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Unit conversion state variables
  const [unit, setUnit] = useState("PCS");
  const [hasConversion, setHasConversion] = useState(false);
  const [conversionUnit, setConversionUnit] = useState("");
  const [conversionRate, setConversionRate] = useState(1);
  const [initialStock, setInitialStock] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");

  // Auto-generate SKU logic
  useEffect(() => {
    if (isCustomCategory) {
      if (newCategoryCode) {
        const prefix = newCategoryCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
        setSku(prefix ? `${prefix}-AUTO` : "");
      } else {
        setSku("");
      }
    } else {
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
    }
  }, [selectedCategory, categories, isCustomCategory, newCategoryCode]);

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
          <label className="text-sm font-medium flex justify-between items-center">
            <span>Kategori <span className="text-rose-500">*</span></span>
            <button
              type="button"
              onClick={() => {
                setIsCustomCategory(!isCustomCategory);
                setSelectedCategory("");
                setNewCategoryName("");
                setNewCategoryCode("");
              }}
              className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider cursor-pointer"
            >
              {isCustomCategory ? "Pilih dari Daftar" : "+ Kategori Kustom"}
            </button>
          </label>
          {isCustomCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
              <input 
                type="text" 
                name="new_category_name"
                required={isCustomCategory}
                value={newCategoryName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCategoryName(val);
                  setNewCategoryCode(generateCategoryCode(val));
                }}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Nama Kategori Baru (contoh: Router)" 
              />
              <input 
                type="text" 
                name="new_category_code"
                required={isCustomCategory}
                value={newCategoryCode}
                onChange={(e) => setNewCategoryCode(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase" 
                placeholder="Kode Kategori Baru (contoh: RTR)" 
              />
            </div>
          ) : (
            <select 
              name="category_id"
              required={!isCustomCategory}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
            >
              <option value="">Pilih Kategori...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
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

        {/* Satuan Utama */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Satuan Barang Utama</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              name="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              className="flex-1 min-w-0 bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold" 
              placeholder="PCS, ROLL, PACK" 
            />
            <div className="flex gap-1 shrink-0">
              {["PCS", "ROLL", "PACK"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                    unit.toUpperCase() === u.toUpperCase()
                      ? "bg-primary border-primary text-white"
                      : "border-border hover:bg-background text-text-muted"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
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

        {/* Konversi Satuan */}
        <div className="md:col-span-2 border border-border/65 bg-background/20 rounded-xl p-4 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox" 
              name="has_conversion" 
              checked={hasConversion}
              onChange={(e) => setHasConversion(e.target.checked)}
              className="w-4.5 h-4.5 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
            />
            <div>
              <p className="text-sm font-bold text-foreground">Aktifkan Konversi Satuan</p>
              <p className="text-xs text-text-muted mt-0.5">Contoh: Kabel dibeli dalam Roll, tapi dikurangi/dipakai dalam Meter. RJ-45 dibeli dalam Pack, tapi dipakai dalam Pcs.</p>
            </div>
          </label>

          {hasConversion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Satuan Pemakaian / Satuan Terkecil</label>
                <input 
                  type="text" 
                  name="conversion_unit"
                  value={conversionUnit}
                  onChange={(e) => setConversionUnit(e.target.value)}
                  required={hasConversion}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium" 
                  placeholder="Contoh: METER, PCS" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Faktor Konversi (1 {unit} = ... {conversionUnit || "Satuan Terkecil"})</label>
                <input 
                  type="number" 
                  name="conversion_rate"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(parseInt(e.target.value) || 1)}
                  min="1"
                  required={hasConversion}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-primary" 
                  placeholder="Contoh: 300" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Stok Awal {hasConversion ? `(dalam ${unit})` : ""}</label>
          <input 
            type="number" 
            name="initial_stock"
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold" 
            placeholder="0" 
          />
          {hasConversion && initialStock && !isNaN(parseInt(initialStock)) && (
            <p className="text-xs text-emerald-500 font-bold mt-1">
              = {parseInt(initialStock) * (conversionRate || 1)} {conversionUnit || "Satuan Terkecil"} (Disimpan ke database)
            </p>
          )}
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
