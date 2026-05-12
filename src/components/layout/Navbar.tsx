"use client";

import { Bell, Menu, LogOut, User, Plus, PackagePlus, ShoppingCart, Activity, ArrowLeftRight, Tags, Calendar, Settings, ChevronDown, PanelLeftOpen, PanelLeftClose, AlertCircle, Wrench, Clock, Monitor, Cctv, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { logout } from "@/app/login/actions";
import { useTransition, useState, useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";

interface NavbarProps {
  onMenuClick?: () => void;
  user?: SupabaseUser | null;
  userProfile?: any;
  lowStockCount?: number;
  lowStockItems?: any[];
  maintenanceCount?: number;
  maintenanceAlerts?: any[];
  isSidebarOpen?: boolean;
}

export default function Navbar({ onMenuClick, user, userProfile, lowStockCount = 0, lowStockItems = [], maintenanceCount = 0, maintenanceAlerts = [], isSidebarOpen }: NavbarProps) {
  const [isPending, startTransition] = useTransition();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className={`h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-all duration-300 ${
      isSidebarOpen ? "lg:pl-72" : "pl-4"
    }`}>
      <div className="flex items-center flex-1 gap-4">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onMenuClick) onMenuClick();
          }}
          className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 active:scale-95"
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeftOpen className="w-6 h-6" />}
        </button>


      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        {/* Quick Add Button */}
        <div className="relative">
          <button 
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Tambah Cepat</span>
          </button>

          {isQuickAddOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsQuickAddOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                {[
                  { label: "Barang Baru", href: "/items/new", icon: PackagePlus, color: "text-blue-500" },
                  { label: "Buat PO", href: "/po/new", icon: ShoppingCart, color: "text-amber-500" },
                  { label: "Mutasi Stok", href: "/transfers/new-mutation", icon: Activity, color: "text-emerald-500" },
                  { label: "Transfer Barang", href: "/transfers/new-transfer", icon: ArrowLeftRight, color: "text-violet-500" },
                  { label: "Kategori Baru", href: "/categories/new", icon: Tags, color: "text-rose-500" },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsQuickAddOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background transition-colors group"
                  >
                    <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-text-muted hover:text-foreground hover:bg-background rounded-full transition-colors group"
            >
              <Bell className="w-5 h-5 group-hover:shake" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-surface animate-bounce-subtle">
                  {lowStockCount > 99 ? "99+" : lowStockCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border bg-rose-500/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Peringatan Stok Kritis
                    </h3>
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">
                      {lowStockCount} BARANG
                    </span>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item, idx) => (
                        <Link
                          key={idx}
                          href={`/items/${item.id}`}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-background border-b border-border last:border-0 transition-colors group"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{item.name}</span>
                            <span className="text-[10px] text-text-muted font-mono uppercase">{item.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-rose-500">{item.quantity}</span>
                            <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">Sisa Unit</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-text-muted">Semua stok aman terkendali.</p>
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href="/items"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="block w-full py-3 text-center text-xs font-bold bg-background hover:bg-muted transition-colors border-t border-border text-primary"
                  >
                    Lihat Semua Inventaris
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Maintenance & Warranty Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
              className="relative p-2 text-text-muted hover:text-amber-500 hover:bg-background rounded-full transition-colors group"
              title="Pusat Peringatan Maintenance & Garansi"
            >
              <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {maintenanceCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white border-2 border-surface animate-pulse">
                  {maintenanceCount > 99 ? "99+" : maintenanceCount}
                </span>
              )}
            </button>

            {isMaintenanceOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMaintenanceOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border bg-amber-500/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Jadwal Perawatan & Garansi
                    </h3>
                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">
                      {maintenanceCount} ASET
                    </span>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto divide-y divide-border">
                    {maintenanceAlerts.length > 0 ? (
                      maintenanceAlerts.map((item, idx) => {
                        const href = item.type.startsWith("infra") ? `/infrastructure/${item.id}` : `/computers/${item.id}`;
                        const labelType = item.type.includes("warranty") ? "Kadaluarsa Garansi" : "Tenggat Maintenance";
                        
                        return (
                          <Link
                            key={idx}
                            href={href}
                            onClick={() => setIsMaintenanceOpen(false)}
                            className="flex items-start justify-between p-3 hover:bg-background transition-colors group"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                item.category === 'Komputer' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'
                              }`}>
                                {item.category === 'Komputer' ? <Monitor className="w-4 h-4" /> : <Cctv className="w-4 h-4" />}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold bg-background px-1.5 py-0.5 rounded text-text-muted border border-border">
                                    {item.code}
                                  </span>
                                </div>
                                <p className="text-[10px] text-text-muted">
                                  {labelType}: <strong className="text-foreground">{new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                </p>
                              </div>
                            </div>
                            
                            {item.isOverdue ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase shrink-0 mt-0.5">
                                Terlewat
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase shrink-0 mt-0.5">
                                Mendekati
                              </span>
                            )}
                          </Link>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-text-muted">Seluruh jadwal perawatan dan garansi aset berstatus aman.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 bg-background border-t border-border text-center text-xs font-bold divide-x divide-border">
                    <Link
                      href="/computers"
                      onClick={() => setIsMaintenanceOpen(false)}
                      className="py-2.5 text-blue-500 hover:bg-surface transition-colors block"
                    >
                      Data Komputer
                    </Link>
                    <Link
                      href="/infrastructure"
                      onClick={() => setIsMaintenanceOpen(false)}
                      className="py-2.5 text-primary hover:bg-surface transition-colors block"
                    >
                      Infrastruktur & Fasilitas
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative flex items-center pl-3 border-l border-border">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-background transition-all group"
              >
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-xs font-bold leading-tight">{userProfile?.full_name || user.email?.split("@")[0]}</span>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Administrator</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-border mb-2">
                      <p className="text-xs text-text-muted font-medium mb-1 text-right">Logged in as</p>
                      <p className="text-sm font-bold text-foreground truncate text-right">{userProfile?.full_name || user.email}</p>
                    </div>
                    
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background transition-colors group"
                    >
                      <Settings className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                      <span className="font-medium">Pengaturan Akun</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50 group"
                    >
                      <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      <span className="font-bold">Keluar Sistem</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
import { CheckCircle2 } from "lucide-react";
