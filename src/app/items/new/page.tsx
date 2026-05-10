import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewItemPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/items" className="p-2 border border-border rounded-lg hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Barang Baru</h1>
          <p className="text-text-muted mt-1">Masukkan detail informasi barang inventaris.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Barang</label>
              <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Contoh: Laptop Lenovo ThinkPad" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU / Kode Barang</label>
              <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Contoh: LNV-TP-001" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                <option value="">Pilih Kategori...</option>
                <option value="1">Elektronik</option>
                <option value="2">Jaringan</option>
                <option value="3">Aksesoris</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Dasar (Rp)</label>
              <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi Spesifikasi</label>
            <textarea rows={4} className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Detail spesifikasi barang..."></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/items" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              Batal
            </Link>
            <button type="button" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" />
              Simpan Barang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
