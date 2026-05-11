"use client";
import { Save, ArrowLeft, Loader2, MinusCircle, PlusCircle, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useState } from "react";
import { updateItem } from "./actions";

export default function EditItemForm({ item, categories, locations, stocks }: { item: any; categories: any[]; locations: any[]; stocks: any[] }) {
  const fn = useCallback((s: any, f: FormData) => updateItem(item.id, s, f), [item.id]);
  const [state, formAction, isPending] = useActionState(fn, null);
  
  const totalStock = stocks.reduce((acc, curr) => acc + curr.quantity, 0);

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
                  <label className="text-sm font-medium">Kategori</label>
                  <select name="category_id" defaultValue={item.category_id || ""} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                    <option value="">Pilih Kategori...</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kondisi Barang</label>
                  <select name="condition" defaultValue={item.condition || "Baru"} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
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
                <p className="text-4xl font-bold text-primary">{totalStock}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-text-muted uppercase font-bold tracking-tighter">Lokasi Stok</p>
                {stocks.length > 0 ? (
                  stocks.map((s: any) => (
                    <div key={`${s.location_id}-${s.condition}`} className="p-3 bg-background border border-border rounded-lg space-y-3 group/loc">
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
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">{s.quantity}</span>
                          <p className="text-[10px] text-text-muted uppercase tracking-tighter leading-none mt-1">Unit</p>
                        </div>
                      </div>
                      
                      {/* Quick Outbound Form per Location & Condition */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            id={`quick_out_qty_${s.location_id}_${s.condition}`}
                            placeholder="Qty Keluar"
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
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded transition-all text-[10px] font-bold uppercase flex items-center gap-1"
                          >
                            <MinusCircle className="w-3 h-3" />
                            Kurangi
                          </button>
                        </div>
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
                  </select>

                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      id="quick_in_qty"
                      placeholder="Qty"
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
                      className="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg transition-all text-[10px] font-bold uppercase"
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
