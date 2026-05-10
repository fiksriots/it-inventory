"use client";

import * as React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import type { User } from "@supabase/supabase-js";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function ClientLayout({ children, user }: { children: React.ReactNode; user?: User | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const openMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 z-[200] lg:hidden transition-all duration-300 ${
            isMobileMenuOpen ? "visible" : "invisible"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMobileMenu}
          />
          {/* Sidebar Panel */}
          <div
            className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar onClose={closeMobileMenu} />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-40">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Navbar onMenuClick={openMobileMenu} user={user} />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
