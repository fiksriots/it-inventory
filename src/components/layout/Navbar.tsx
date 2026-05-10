"use client";

import { Bell, Search, Menu } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center flex-1 gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Cari barang, PO, atau supplier..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        <ThemeToggle />
        <button className="relative p-2 text-text-muted hover:text-foreground hover:bg-background rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
        </button>
      </div>
    </header>
  );
}
