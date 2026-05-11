"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-background/50 border border-border px-3 py-1.5 rounded-lg flex items-center gap-3">
      <span className="text-xs font-medium text-text-muted uppercase tracking-tighter">
        Halaman <span className="text-white font-bold">{currentPage}</span> dari {totalPages}
      </span>
      <div className="flex items-center border-l border-border pl-3 gap-1">
        <Link
          href={createPageURL(Math.max(1, currentPage - 1))}
          className={`p-1.5 rounded hover:bg-surface transition-colors ${
            currentPage <= 1 ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <Link
          href={createPageURL(Math.min(totalPages, currentPage + 1))}
          className={`p-1.5 rounded hover:bg-surface transition-colors ${
            currentPage >= totalPages ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
