"use client";

import { Save, ArrowLeft, Plus, Trash2, Loader2, ShoppingCart, Globe, Store, User, Building, MapPin, FileText } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createPurchaseOrder } from "../actions";
import { createClient } from "@/utils/supabase/client";

export default function NewPurchaseOrderPage() {
  const [state, formAction, isPending] = useActionState(createPurchaseOrder, null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierType, setSupplierType] = useState("Offline");
  const [selectedItems, setSelectedItems] = useState<any[]>([
    { item_id: "", custom_item_name: "", is_manual: false, item_link: "", unit: "PCS", quantity: 1, unit_price: 0 }
  ]);
  const [adminFee, setAdminFee] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [autoPo, setAutoPo] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [suppliersRes, itemsRes, locationsRes] = await Promise.all([
        supabase.from("suppliers").select("id, name").order("name"),
        supabase.from("items").select("id, name, sku, price").order("name"),
        supabase.from("locations").select("id, name").order("name")
      ]);
      setSuppliers(suppliersRes.data || []);
      setItems(itemsRes.data || []);
      setLocations(locationsRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const addRow = () => {
    setSelectedItems([...selectedItems, { item_id: "", custom_item_name: "", is_manual: false, item_link: "", unit: "PCS", quantity: 1, unit_price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (selectedItems.length > 1) {
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: string, value: any) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    
    // Auto-fill price if item is selected
    if (field === 'item_id') {
      const item = items.find(i => i.id === value);
      if (item) updated[index].unit_price = item.price;
    }

    if (field === 'is_manual' && value === true) {
      updated[index].item_id = "";
    } else if (field === 'is_manual' && value === false) {
      updated[index].custom_item_name = "";
    }
    
    setSelectedItems(updated);
  };

  const subtotal = selectedItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0);
  const grandTotal = subtotal + adminFee + shippingFee - discountAmount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/po" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Buat Purchase Order</h1>
          <p className="text-text-muted mt-1">Buat dokumen pemesanan barang baru ke supplier.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="items_data" value={JSON.stringify(selectedItems)} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
                <ShoppingCart className="w-4 h-4" />
                Informasi Umum PO
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Nomor PO <span className="text-rose-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={() => setAutoPo(!autoPo)}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${autoPo ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface border-border text-text-muted'}`}
                    >
                      {autoPo ? 'Auto ON' : 'Manual'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    name="po_number"
                    required={!autoPo}
                    readOnly={autoPo}
                    defaultValue={autoPo ? "AUTO" : ""}
                    className={`w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${autoPo ? 'opacity-60 italic' : ''}`} 
                    placeholder={autoPo ? "Generated by system..." : "Contoh: PO-2024-001"} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Tipe Supplier</label>
                  <div className="flex p-1 bg-background border border-border rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setSupplierType("Offline")}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${supplierType === "Offline" ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-white'}`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      Offline
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSupplierType("Online")}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all ${supplierType === "Online" ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-white'}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Online
                    </button>
                    <input type="hidden" name="supplier_type" value={supplierType} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    name="supplier_id" 
                    required 
                    disabled={isLoading}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Departemen
                  </label>
                  <input 
                    type="text" 
                    name="department"
                    placeholder="Contoh: IT, Marketing, dll"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Pemohon (Requested By)
                  </label>
                  <input 
                    type="text" 
                    name="requested_by"
                    placeholder="Nama staf yang meminta"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Lokasi Tujuan Akhir
                  </label>
                  <select 
                    name="location_id" 
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all"
                  >
                    <option value="">-- Pilih Lokasi --</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
                <FileText className="w-4 h-4" />
                Catatan Tambahan
              </h2>
              <textarea 
                name="notes"
                rows={3}
                placeholder="Tulis alasan pembelian atau catatan khusus di sini..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>
          </div>

          {/* Right Column: Payment & Summary */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
                Metode Pembayaran
              </h2>
              <div className="space-y-2">
                <select 
                  name="payment_method" 
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="Tempo / Credit">Tempo / Credit</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6 sticky top-6">
              <h2 className="font-semibold text-sm text-primary border-b border-border pb-3">Ringkasan Biaya</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal:</span>
                  <span className="font-medium text-white">{subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-text-muted uppercase tracking-tight">Biaya Admin</div>
                  <input 
                    type="number" 
                    name="admin_fee"
                    onChange={(e) => setAdminFee(parseFloat(e.target.value || "0"))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-right focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-text-muted uppercase tracking-tight">Biaya Pengiriman</div>
                  <input 
                    type="number" 
                    name="shipping_fee"
                    onChange={(e) => setShippingFee(parseFloat(e.target.value || "0"))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-right focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-rose-500 uppercase tracking-tight">Diskon / Voucher (-)</div>
                  <input 
                    type="number" 
                    name="discount_amount"
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value || "0"))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-right text-rose-500 focus:ring-2 focus:ring-rose-500/20 border-rose-500/20 outline-none" 
                    placeholder="0"
                  />
                </div>
                <div className="pt-4 border-t border-border flex flex-col gap-1">
                  <span className="text-xs text-text-muted font-medium uppercase tracking-widest">Total Pembelian</span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Daftar Barang
            </h2>
            <button 
              type="button"
              onClick={addRow}
              className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/80 text-text-muted text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-4 text-left font-bold border-b border-border">Barang</th>
                  <th className="px-4 py-4 text-left font-bold border-b border-border w-24">Satuan</th>
                  <th className="px-4 py-4 text-left font-bold border-b border-border w-28">Jumlah</th>
                  <th className="px-4 py-4 text-left font-bold border-b border-border w-40">Harga Satuan</th>
                  <th className="px-4 py-4 text-left font-bold border-b border-border w-40">Subtotal</th>
                  <th className="px-4 py-4 w-12 border-b border-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selectedItems.map((row, idx) => (
                  <tr key={idx} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-4 space-y-3">
                      <div className="flex gap-2 mb-2">
                        <button 
                          type="button"
                          onClick={() => updateRow(idx, 'is_manual', false)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all ${!row.is_manual ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-text-muted'}`}
                        >
                          Pilih Master
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateRow(idx, 'is_manual', true)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-all ${row.is_manual ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-text-muted'}`}
                        >
                          Input Manual
                        </button>
                      </div>

                      {row.is_manual ? (
                        <input 
                          type="text"
                          placeholder="Ketik Nama Barang..."
                          value={row.custom_item_name}
                          onChange={(e) => updateRow(idx, 'custom_item_name', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      ) : (
                        <select 
                          value={row.item_id}
                          onChange={(e) => updateRow(idx, 'item_id', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="">-- Pilih Barang --</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                          ))}
                        </select>
                      )}

                      {supplierType === "Online" && (
                        <div className="flex items-center gap-2 mt-2">
                          <Globe className="w-3.5 h-3.5 text-text-muted" />
                          <input 
                            type="text"
                            placeholder="Link Produk (Online)..."
                            value={row.item_link}
                            onChange={(e) => updateRow(idx, 'item_link', e.target.value)}
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input 
                        type="text"
                        value={row.unit}
                        onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-center"
                        placeholder="PCS"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input 
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-center font-medium"
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <input 
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => updateRow(idx, 'unit_price', parseInt(e.target.value) || 0)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-right font-medium"
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-right font-bold text-white">
                      {(row.quantity * row.unit_price).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <button 
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-text-muted hover:text-rose-500 p-2 transition-colors hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {state?.error && (
          <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-medium flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6">
          <Link href="/po" className="px-8 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors text-text-muted hover:text-white">
            Batal
          </Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-10 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-70 shadow-xl shadow-primary/30"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isPending ? "Menyimpan..." : "Simpan Dokumen PO"}
          </button>
        </div>
      </form>
    </div>
  );
}
