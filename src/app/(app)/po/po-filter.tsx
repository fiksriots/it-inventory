"use client";

import { Filter, X, Building2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function POFilter({ departments }: { departments: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentDepartment = searchParams.get("department") || "";

  const handleFilterChange = (status: string, department: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    if (department) {
      params.set("department", department);
    } else {
      params.delete("department");
    }

    // Reset page index on filter change
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  const statuses = ['Draft', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Selesai'];

  const hasFilter = currentStatus || currentDepartment;

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      <div className="relative group">
        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <select
          value={currentStatus}
          onChange={(e) => handleFilterChange(e.target.value, currentDepartment)}
          className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none min-w-[150px]"
        >
          <option value="">Semua Status</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Department Filter */}
      <div className="relative group">
        <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <select
          value={currentDepartment}
          onChange={(e) => handleFilterChange(currentStatus, e.target.value)}
          className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none min-w-[180px]"
        >
          <option value="">Semua Departemen</option>
          {departments?.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <button 
          onClick={() => handleFilterChange("", "")}
          className="p-2 text-text-muted hover:text-rose-500 bg-background border border-border rounded-lg transition-colors"
          title="Reset Filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
