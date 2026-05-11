"use client";

import { Filter, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function POFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const statuses = ['Draft', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Selesai'];

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none min-w-[160px]"
        >
          <option value="">Semua Status</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {currentStatus && (
        <button 
          onClick={() => handleStatusChange("")}
          className="p-2 text-text-muted hover:text-rose-500 bg-background border border-border rounded-lg transition-colors"
          title="Reset Filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
