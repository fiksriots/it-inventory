"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import type { User } from "@supabase/supabase-js";

export function ClientLayout({ children, user }: { children: React.ReactNode; user?: User | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar (Modal) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-[110] w-64 max-w-sm flex">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-40">
        <Sidebar />
      </div>

      {/* Main Content Wrapper */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} user={user} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
