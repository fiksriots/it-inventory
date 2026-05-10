"use client";

import { Bell, Search, Menu, LogOut, User } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { logout } from "@/app/login/actions";
import { useTransition } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavbarProps {
  onMenuClick?: () => void;
  user?: SupabaseUser | null;
}

export default function Navbar({ onMenuClick, user }: NavbarProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center flex-1 gap-4">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onMenuClick) onMenuClick();
          }}
          className="lg:hidden p-2 text-text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors cursor-pointer"
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
      <div className="flex items-center gap-2 md:gap-3 ml-4">
        <ThemeToggle />
        <button className="relative p-2 text-text-muted hover:text-foreground hover:bg-background rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
        </button>

        {/* User Info + Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium leading-tight">{user.email?.split("@")[0]}</span>
              <span className="text-xs text-text-muted leading-tight">Admin</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <button
              onClick={handleLogout}
              disabled={isPending}
              title="Keluar"
              className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
