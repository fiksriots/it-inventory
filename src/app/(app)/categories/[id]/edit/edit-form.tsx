"use client";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback } from "react";
import { updateCategory } from "./actions";

export default function EditCategoryForm({ category }: { category: any }) {
  const fn = useCallback((s: any, f: FormData) => updateCategory(category.id, s, f), [category.id]);
  const [state, formAction, isPending] = useActionState(fn, null);
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/categories" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Kategori</h1>
          <p className="text-text-muted mt-1">Perbarui informasi kategori barang.</p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <form action={formAction} className="space-y-6">
          {state?.error && <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm">{state.error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kategori <span className="text-rose-500">*</span></label>
              <input type="text" name="name" required defaultValue={category.name} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Kode Kategori (Terkunci)</label>
              <input 
                type="text" 
                name="code" 
                readOnly 
                defaultValue={category.code} 
                className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:outline-none font-mono text-primary font-bold cursor-not-allowed" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <textarea name="description" rows={4} defaultValue={category.description || ""} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/categories" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">Batal</Link>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
