"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import type { User } from "@supabase/supabase-js";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function ClientLayout({ children, user }: { children: React.ReactNode; user?: User | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        
        {/* Mobile Sidebar Overlay - selalu ada di DOM, dikontrol visibility */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[300] lg:hidden flex">
            {/* Backdrop: klik untuk tutup */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Sidebar panel */}
            <div className="relative z-10 w-72 max-w-[85vw] flex flex-col">
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-40">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} user={user} />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
