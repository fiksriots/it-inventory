"use client";
import { Save, ArrowLeft, Loader2, MinusCircle, PlusCircle, MapPin, Package, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem, updateStockCondition } from "./actions";
import { formatStock } from "@/utils/unit";

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

export default function EditItemForm({ item, categories, locations, stocks }: { item: any; categories: any[]; locations: any[]; stocks: any[] }) {
  const fn = useCallback((s: any, f: FormData) => updateItem(item.id, s, f), [item.id]);
  const [state, formAction, isPending] = useActionState(fn, null);
  const router = useRouter();
  const [isPendingCond, startTransition] = useTransition();
  const [loadingCondKey, setLoadingCondKey] = useState<string | null>(null);

  const [unit, setUnit] = useState(item.unit || "PCS");
  const [hasConversion, setHasConversion] = useState(!!item.has_conversion);
  const [conversionUnit, setConversionUnit] = useState(item.conversion_unit || "");
  const [conversionRate, setConversionRate] = useState(item.conversion_rate || 1);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  
  const totalStock = stocks.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleUpdateCondition = (locId: string, oldCond: string, maxQty: number) => {
    const key = `${locId}-${oldCond}`;
    const selectEl = document.getElementById(`change_cond_${locId}_${oldCond.replace(/\s+/g, '_')}`) as HTMLSelectElement;
    const qtyEl = document.getElementById(`change_cond_qty_${locId}_${oldCond.replace(/\s+/g, '_')}`) as HTMLInputElement;
    if (!selectEl || !qtyEl) return;
    
    const newCond = selectEl.value;
    if (newCond === oldCond) return alert("Pilih kondisi yang berbeda untuk diubah!");
    
    const qtyVal = parseInt(qtyEl.value);
    if (isNaN(qtyVal) || qtyVal <= 0) return alert("Masukkan jumlah yang valid (minimal 1)!");
    if (qtyVal > maxQty) return alert(`Jumlah melebihi stok yang tersedia (${maxQty})!`);

    setLoadingCondKey(key);
    startTransition(async () => {
      const res = await updateStockCondition(item.id, locId, oldCond, newCond, qtyVal);
      setLoadingCondKey(null);
      if (res?.error) {
        alert(res.error);
      } else {
        qtyEl.value = "";
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/items" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Barang</h1>
          <p className="text-text-muted mt-1">Perbarui informasi barang inventaris.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
            <form action={formAction} id="edit-item-form" className="space-y-6">
              {state?.error && <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium">{state.error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Barang <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" required defaultValue={item.name} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU <span className="text-rose-500">*</span></label>
                  <input type="text" name="sku" required defaultValue={item.sku} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono text-primary font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex justify-between items-center">
                    <span>Kategori</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
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
                        placeholder="Nama Kategori Baru" 
                      />
                      <input 
                        type="text" 
                        name="new_category_code"
                        required={isCustomCategory}
                        value={newCategoryCode}
                        onChange={(e) => setNewCategoryCode(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase" 
                        placeholder="Kode Kategori Baru" 
                      />
                    </div>
                  ) : (
                    <select name="category_id" defaultValue={item.category_id || ""} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                      <option value="">Pilih Kategori...</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kondisi Barang</label>
                  <select name="condition" defaultValue={item.condition || "Baru"} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                    <option value="Baru">Baru (Segel)</option>
                    <option value="Normal">Normal (Bekas Bagus)</option>
                    <option value="Rusak (Bisa Diperbaiki)">Rusak (Bisa Diperbaiki)</option>
                    <option value="Rusak (Total)">Rusak (Total/Mati)</option>
                    <option value="Afkir">Afkir / Disposal</option>
                    <option value="Belum Di Cek">Belum Di Cek</option>
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
                      defaultValue={(item.price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                      className="w-full bg-background border border-border rounded-lg pl-12 pr-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-primary"
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        e.target.value = formattedValue;
                        const hiddenInput = document.getElementById("price_raw") as HTMLInputElement;
                        if (hiddenInput) hiddenInput.value = rawValue;
                      }}
                    />
                    <input type="hidden" name="price" id="price_raw" defaultValue={item.price || 0} />
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi Spesifikasi</label>
                <textarea name="description" rows={4} defaultValue={item.description || ""} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
              </div>

              {/* Quick Adjustment hidden fields for the form */}
              <input type="hidden" name="adjustment_qty" id="hidden_adj_qty" value="0" />
              <input type="hidden" name="adjustment_location_id" id="hidden_adj_loc" value="" />
              <input type="hidden" name="adjustment_condition" id="hidden_adj_cond" value="" />

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Link href="/items" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors text-text-muted">Batal</Link>
                <button type="submit" disabled={isPending} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-70">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: Stock Management */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Info Stok
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold tracking-tighter mb-1">Total Stok</p>
                <p className="text-lg font-extrabold text-primary break-words">
                  {formatStock(totalStock, unit, hasConversion, conversionUnit, conversionRate)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-text-muted uppercase font-bold tracking-tighter">Lokasi Stok</p>
                {stocks.length > 0 ? (
                  stocks.map((s: any) => (
                    <div key={`${s.location_id}-${s.condition}`} className="p-3 bg-background border border-border rounded-lg space-y-3 group/loc">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <span className="text-sm font-bold">{s.locations?.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded w-fit ${
                              s.condition === 'Baru' ? 'text-emerald-500 bg-emerald-500/10' :
                              s.condition === 'Normal' ? 'text-blue-500 bg-blue-500/10' :
                              s.condition?.includes('Rusak (Total)') || s.condition === 'Afkir' ? 'text-rose-500 bg-rose-500/10' :
                              'text-amber-500 bg-amber-500/10'
                            }`}>
                              {s.condition}
                            </span>
                          </div>
                        </div>
                        <div className="text-left bg-background/50 p-2 border border-border/40 rounded">
                          <span className="text-xs font-black text-primary">
                            {formatStock(s.quantity, unit, hasConversion, conversionUnit, conversionRate)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Outbound Form per Location & Condition */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            id={`quick_out_qty_${s.location_id}_${s.condition}`}
                            placeholder={`Qty Keluar (${hasConversion && conversionUnit ? conversionUnit : unit})`}
                            max={s.quantity}
                            className="flex-1 min-w-0 bg-background/50 border border-border rounded px-2 py-1 text-[11px] focus:ring-1 focus:ring-rose-500/50 outline-none text-rose-500 font-bold" 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const qty = (document.getElementById(`quick_out_qty_${s.location_id}_${s.condition}`) as HTMLInputElement).value;
                              if (!qty || isNaN(parseInt(qty)) || parseInt(qty) <= 0) return alert("Masukkan jumlah yang valid!");
                              if (parseInt(qty) > s.quantity) return alert("Stok tidak mencukupi!");
                              
                              const input = document.getElementById('hidden_adj_qty') as HTMLInputElement;
                              const locInput = document.getElementById('hidden_adj_loc') as HTMLInputElement;
                              const condInput = document.getElementById('hidden_adj_cond') as HTMLInputElement;
                              
                              input.value = `-${Math.abs(parseInt(qty))}`;
                              locInput.value = s.location_id;
                              condInput.value = s.condition;
                              (document.getElementById('edit-item-form') as HTMLFormElement).requestSubmit();
                            }}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded transition-all text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <MinusCircle className="w-3 h-3" />
                            Kurangi
                          </button>
                        </div>
                      </div>

                      {/* Change Condition Form */}
                      <div className="pt-2 border-t border-border/50 space-y-2">
                        <div className="flex gap-2">
                          <select 
                            id={`change_cond_${s.location_id}_${s.condition.replace(/\s+/g, '_')}`}
                            defaultValue={s.condition}
                            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-[11px] outline-none font-bold text-foreground"
                          >
                            <option value="Baru" className="bg-surface text-foreground">Baru</option>
                            <option value="Normal" className="bg-surface text-foreground">Normal</option>
                            <option value="Rusak (Bisa Diperbaiki)" className="bg-surface text-foreground">Rusak (Bisa Diperbaiki)</option>
                            <option value="Rusak (Total)" className="bg-surface text-foreground">Rusak (Total)</option>
                            <option value="Afkir" className="bg-surface text-foreground">Afkir</option>
                            <option value="Belum Di Cek" className="bg-surface text-foreground">Belum Di Cek</option>
                          </select>
                          <input
                            type="number"
                            id={`change_cond_qty_${s.location_id}_${s.condition.replace(/\s+/g, '_')}`}
                            placeholder="Qty"
                            min={1}
                            max={s.quantity}
                            defaultValue={s.quantity}
                            className="w-14 shrink-0 bg-background border border-border rounded px-1 py-1 text-[11px] focus:ring-1 focus:ring-primary/50 outline-none font-bold text-center text-foreground"
                          />
                        </div>
                        <button 
                          type="button"
                          disabled={loadingCondKey === `${s.location_id}-${s.condition}`}
                          onClick={() => handleUpdateCondition(s.location_id, s.condition, s.quantity)}
                          className="w-full py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded transition-all text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingCondKey === `${s.location_id}-${s.condition}` ? 'animate-spin' : ''}`} />
                          Ubah Kondisi
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted italic bg-background/50 p-4 rounded-lg border border-dashed border-border text-center">Belum ada stok di lokasi manapun.</p>
                )}
              </div>

              {/* Quick Inbound */}
              <div className="pt-6 border-t border-border">
                <p className="text-xs text-text-muted uppercase font-bold tracking-tighter mb-3">Quick Inbound (Masuk)</p>
                <div className="space-y-3">
                  <select 
                    id="quick_in_loc"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="">Pilih Lokasi...</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  
                  <select 
                    id="quick_in_cond"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="Baru">Baru (Segel)</option>
                    <option value="Normal">Normal (Bekas Bagus)</option>
                    <option value="Rusak (Bisa Diperbaiki)">Rusak (Bisa Diperbaiki)</option>
                    <option value="Rusak (Total)">Rusak (Total/Mati)</option>
                    <option value="Afkir">Afkir / Disposal</option>
                    <option value="Belum Di Cek">Belum Di Cek</option>
                  </select>

                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      id="quick_in_qty"
                      placeholder={`Qty (${hasConversion && conversionUnit ? conversionUnit : unit})`}
                      className="w-20 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold" 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const qty = (document.getElementById('quick_in_qty') as HTMLInputElement).value;
                        const loc = (document.getElementById('quick_in_loc') as HTMLSelectElement).value;
                        const cond = (document.getElementById('quick_in_cond') as HTMLSelectElement).value;
                        if (!qty || !loc) return alert("Pilih lokasi dan isi jumlah!");
                        
                        const input = document.getElementById('hidden_adj_qty') as HTMLInputElement;
                        const locInput = document.getElementById('hidden_adj_loc') as HTMLInputElement;
                        const condInput = document.getElementById('hidden_adj_cond') as HTMLInputElement;
                        
                        input.value = qty;
                        locInput.value = loc;
                        condInput.value = cond;
                        (document.getElementById('edit-item-form') as HTMLFormElement).requestSubmit();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg transition-all text-[10px] font-bold uppercase cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
