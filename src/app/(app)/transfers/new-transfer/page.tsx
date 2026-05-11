"use client";

import { Save, ArrowLeft, Loader2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createTransfer } from "../actions";
import { createClient } from "@/utils/supabase/client";

export default function NewTransferPage() {
  const [state, formAction, isPending] = useActionState(createTransfer, null);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [itemsRes, locationsRes] = await Promise.all([
        supabase.from("items").select("id, name, sku").order("name"),
        supabase.from("locations").select("id, name").order("name")
      ]);
      setItems(itemsRes.data || []);
      setLocations(locationsRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/transfers" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Antar Lokasi</h1>
          <p className="text-text-muted mt-1">Pindahkan stok barang dari satu departemen ke departemen lain.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Barang <span className="text-rose-500">*</span></label>
              <select 
                name="item_id" 
                required 
                disabled={isLoading}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
              >
                <option value="">-- Pilih Barang --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lokasi Asal <span className="text-rose-500">*</span></label>
                <select 
                  name="from_location_id" 
                  required 
                  disabled={isLoading}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                >
                  <option value="">-- Pilih Lokasi Asal --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lokasi Tujuan <span className="text-rose-500">*</span></label>
                <select 
                  name="to_location_id" 
                  required 
                  disabled={isLoading}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                >
                  <option value="">-- Pilih Lokasi Tujuan --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah yang Dipindahkan <span className="text-rose-500">*</span></label>
              <input 
                type="number" 
                name="quantity"
                required
                min="1"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="0" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan / Keterangan</label>
              <textarea 
                name="notes"
                rows={3} 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Alasan pemindahan barang..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/transfers" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              Batal
            </Link>
            <button 
              type="submit" 
              disabled={isPending || isLoading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              {isPending ? "Memproses..." : "Proses Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
