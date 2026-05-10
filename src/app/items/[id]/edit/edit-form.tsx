"use client";

import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { updateItem } from "./actions";
import { useCallback } from "react";

export default function EditItemForm({ item, categories }: { item: any; categories: any[] }) {
  const updateWithId = useCallback(
    (prevState: any, formData: FormData) => updateItem(item.id, prevState, formData),
    [item.id]
  );
  const [state, formAction, isPending] = useActionState(updateWithId, null);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/items" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Barang</h1>
          <p className="text-text-muted mt-1">Perbarui informasi barang inventaris.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
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
                defaultValue={item.name}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Contoh: Laptop Lenovo ThinkPad"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU / Kode Barang <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="sku"
                required
                defaultValue={item.sku}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Contoh: LNV-TP-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <select
                name="category_id"
                defaultValue={item.category_id || ""}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Dasar (Rp)</label>
              <input
                type="number"
                name="price"
                defaultValue={item.price || 0}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi Spesifikasi</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={item.description || ""}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Detail spesifikasi barang..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/items" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
