import { Plus, Search, MoreHorizontal, Users, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function SuppliersPage() {
  // Dummy data untuk supplier
  const suppliers = [
    { id: 1, name: "PT. Teknologi Indo Maju", contactPerson: "Budi Santoso", phone: "0812-3456-7890", email: "sales@tekindo.co.id", address: "Jl. Sudirman No. 45, Jakarta" },
    { id: 2, name: "CV. Jaringan Solusi", contactPerson: "Ani Lestari", phone: "0815-9876-5432", email: "info@jarsolusi.com", address: "Jl. Merdeka Raya 12, Bandung" },
    { id: 3, name: "Global Aksesoris Komputer", contactPerson: "Rudi Hartono", phone: "0811-1122-3344", email: "rudi@globalaks.net", address: "Harco Mangga Dua Blok C No. 2" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Supplier</h1>
          <p className="text-text-muted mt-1">Kelola data vendor dan pemasok barang IT Anda.</p>
        </div>
        <Link href="/suppliers/new" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
          <Plus className="w-5 h-5" />
          Tambah Supplier
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface">
          <div className="relative w-full sm:w-72 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari nama supplier atau kontak..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Perusahaan</th>
                <th className="px-6 py-4 font-semibold">Kontak Person</th>
                <th className="px-6 py-4 font-semibold">Email & Telepon</th>
                <th className="px-6 py-4 font-semibold">Alamat</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="font-medium text-foreground">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted">{supplier.contactPerson}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-text-muted max-w-xs">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="truncate" title={supplier.address}>{supplier.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-text-muted hover:text-foreground rounded-lg hover:bg-background transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
