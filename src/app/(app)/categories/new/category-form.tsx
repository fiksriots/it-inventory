"use client";

import { Save, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { createCategory } from "../actions";

export default function CategoryForm({ nextCode, categories }: { nextCode: string; categories: { id: string; label: string }[] }) {
  const [state, formAction, isPending] = useActionState(createCategory, null);
  
  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium">
          {state.error}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Kategori <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="name"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
              placeholder="Contoh: Switch" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex justify-between items-center">
              Kode Kategori (Otomatis)
              <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold uppercase"><Sparkles className="w-3 h-3" /> Terkunci</span>
            </label>
            <input 
              type="text" 
              name="code"
              required
              readOnly
              value={nextCode}
              className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 focus:outline-none font-mono text-primary font-bold cursor-not-allowed" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori Induk (Parent) - <span className="text-text-muted text-xs italic font-normal">Opsional (Kosongkan jika ini kategori utama)</span></label>
          <select 
            name="parent_id"
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
          >
            <option value="">-- Tanpa Kategori Induk (Kategori Utama) --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Deskripsi Singkat</label>
          <textarea 
            name="description"
            rows={4} 
            className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
            placeholder="Keterangan mengenai kategori ini..."
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link href="/categories" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors text-text-muted">
          Batal
        </Link>
        <button 
          type="submit" 
          disabled={isPending}
          className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? "Menyimpan..." : "Simpan Kategori"}
        </button>
      </div>
    </form>
  );
}
