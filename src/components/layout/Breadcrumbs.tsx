"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  const paths = pathname.split("/").filter(Boolean);
  
  return (
    <nav className="flex items-center gap-2 text-xs font-medium text-text-muted mb-6 animate-in fade-in slide-in-from-left-2 duration-500">
      <Link 
        href="/" 
        className="flex items-center gap-1 hover:text-primary transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Dashboard</span>
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        
        // Format path label (e.g. "purchase-orders" -> "Purchase Orders")
        const label = path
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            {isLast ? (
              <span className="text-foreground font-bold">{label}</span>
            ) : (
              <Link 
                href={href}
                className="hover:text-primary transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
