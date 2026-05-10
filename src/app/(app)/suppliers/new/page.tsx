"use client";

import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  const [state, formAction, isPending] = useActionState(createSupplier, null);
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/suppliers" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Supplier Baru</h1>
          <p className="text-text-muted mt-1">Masukkan informasi vendor atau pemasok barang.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nama Perusahaan / Supplier <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Contoh: PT. Teknologi Indo Maju" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kontak (Contact Person)</label>
              <input 
                type="text" 
                name="contact_person"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Contoh: Budi Santoso" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Telepon / HP</label>
              <input 
                type="text" 
                name="phone"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Contoh: 0812-3456-7890" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Alamat Email</label>
              <input 
                type="email" 
                name="email"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Contoh: info@tekindo.co.id" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Alamat Lengkap</label>
              <textarea 
                name="address"
                rows={3} 
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Alamat lengkap perusahaan supplier..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/suppliers" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              Batal
            </Link>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? "Menyimpan..." : "Simpan Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
