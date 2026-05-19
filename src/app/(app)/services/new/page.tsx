"use client";

import { Save, ArrowLeft, Loader2, Wrench, Store, MapPin, Package, FileText, UploadCloud, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createService } from "../actions";
import { createClient } from "@/utils/supabase/client";

export default function NewServicePage() {
  const [state, formAction, isPending] = useActionState(createService, null);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPo, setAutoPo] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [itemsRes, locationsRes, suppliersRes] = await Promise.all([
        supabase.from("items").select("id, name, sku, price").order("name"),
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name").order("name")
      ]);
      setItems(itemsRes.data || []);
      setLocations(locationsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  const handleClientAction = async (formData: FormData) => {
    const file = formData.get("service_doc") as File;
    if (file && file.size > 0 && file.type.startsWith("image/")) {
      
    }
    
    // In React 19 / Next.js 15, we can call startTransition with formAction
    // However, formAction here from useActionState expects a formData argument.
    // To ensure pending state works correctly:
    formAction(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/services" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Catat Perbaikan Barang Baru
          </h1>
          <p className="text-text-muted mt-1">Registrasi pengiriman perangkat rusak ke vendor service.</p>
        </div>
      </div>

      {/* Main Form */}
      <form action={handleClientAction} className="space-y-6">
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
            <Package className="w-4 h-4" />
            Data Perangkat & Lokasi Asal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Nomor Dokumen <span className="text-rose-500">*</span></label>
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
                name="service_number"
                required={!autoPo}
                readOnly={autoPo}
                defaultValue={autoPo ? "AUTO" : ""}
                className={`w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${autoPo ? 'opacity-60 italic' : ''}`} 
                placeholder={autoPo ? "Format: SRV-YYYYMMDD-XXX" : "Ketik nomor dokumen referensi..."} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Pilih Barang Rusak <span className="text-rose-500">*</span>
              </label>
              <select 
                name="item_id" 
                required 
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all font-medium"
              >
                <option value="">-- Pilih Perangkat --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary/70" />
                Lokasi / Gudang Pengambilan
              </label>
              <select 
                name="location_id" 
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all"
              >
                <option value="">-- Lokasi Asal --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Jumlah Unit</label>
                <input 
                  type="number" 
                  name="quantity"
                  min="1"
                  defaultValue="1" 
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none text-center font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Kondisi Awal</label>
                <input 
                  type="text" 
                  name="initial_condition"
                  defaultValue="Rusak" 
                  placeholder="Misal: Mati Total"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vendor & Shipping */}
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-amber-500 border-b border-border pb-3">
            <Store className="w-4 h-4" />
            Vendor Service & Detail Pengiriman
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-500" />
                Mitra Vendor <span className="text-rose-500">*</span>
              </label>
              <select 
                name="supplier_id" 
                required 
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 transition-all font-medium"
              >
                <option value="">-- Pilih Vendor Service --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal Pengiriman
              </label>
              <input 
                type="date" 
                name="sent_date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none text-xs font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Kurir / Pengirim
              </label>
              <input 
                type="text" 
                name="sent_by_name"
                placeholder="Nama kurir / penanggung jawab"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Kendala & Upload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 md:col-span-2 space-y-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
              <FileText className="w-4 h-4" />
              Keluhan / Deskripsi Kendala <span className="text-rose-500">*</span>
            </h2>
            <textarea 
              name="problem_description"
              required
              rows={4}
              placeholder="Rincikan kendala perangkat secara mendalam. Contoh: Kipas berbunyi bising, sering mati sendiri setelah 10 menit, layar bergaris hijau vertikal saat booting..."
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm"
            ></textarea>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2 text-primary border-b border-border pb-3">
                Estimasi Biaya
              </h2>
              <div className="mt-4 space-y-2">
                <label className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Perkiraan Biaya Awal (Rp)</label>
                <input 
                  type="number" 
                  name="cost"
                  defaultValue="0"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-right font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <label className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Upload Dokumen Penyerahan</label>
              <div className="relative">
                <input 
                  type="file" 
                  name="service_doc"
                  id="doc-upload" 
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="doc-upload"
                  className="cursor-pointer w-full bg-background border border-dashed border-border hover:border-primary/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group text-center"
                >
                  <UploadCloud className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-text-muted group-hover:text-foreground transition-colors">
                    {fileName ? (
                      <span className="text-primary font-bold truncate block max-w-[180px]">{fileName}</span>
                    ) : (
                      "Pilih file surat jalan/tanda terima"
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-medium flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
            {state.error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Link href="/services" className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors text-text-muted">
            Kembali
          </Link>
          <button 
            type="submit" 
            disabled={isPending || isLoading}
            className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isPending ? "Menyimpan Data..." : "Simpan Dokumen Service"}
          </button>
        </div>
      </form>
    </div>
  );
}
