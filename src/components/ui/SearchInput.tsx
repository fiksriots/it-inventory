"use client";

import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { useDebounce } from "@/utils/use-debounce";

interface SearchInputProps {
  placeholder?: string;
}

export default function SearchInput({ placeholder = "Cari..." }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    // Reset page when searching
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [debouncedQuery, pathname, router]);

  return (
    <div className="relative w-full sm:w-72 group">
      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-primary animate-pulse' : 'text-text-muted group-focus-within:text-primary'}`} />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-background border border-border rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      {query && (
        <button 
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-rose-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
