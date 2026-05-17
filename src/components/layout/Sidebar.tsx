"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ArrowRightLeft, ShoppingCart, Users, Settings, X, Tags, Wrench, Monitor, Cctv, Printer, Calendar, FolderKanban, ClipboardList, Cpu } from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const menuSections = [
    {
      title: "Ringkasan",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: FolderKanban, label: "Project Planning", href: "/projects" },
        { icon: ClipboardList, label: "Laporan Harian", href: "/daily-logs" },
      ]
    },
    {
      title: "Manajemen Inventaris",
      items: [
        { icon: Package, label: "Master Barang", href: "/items" },
        { icon: Tags, label: "Kategori Barang", href: "/categories" },
        { icon: ArrowRightLeft, label: "Mutasi & Transfer", href: "/transfers" },
        { icon: ShoppingCart, label: "Purchase Orders", href: "/po" },
        { icon: Wrench, label: "Service Barang", href: "/services" },
      ]
    },
    {
      title: "Manajemen Aset IT",
      items: [
        { icon: Monitor, label: "Data Komputer", href: "/computers" },
        { icon: Cctv, label: "Infrastruktur & Fasilitas", href: "/infrastructure" },
      ]
    },
    {
      title: "Data Master & Tim",
      items: [
        { icon: Users, label: "Departemen & Lokasi", href: "/locations" },
        { icon: Users, label: "Supplier", href: "/suppliers" },
        { icon: Calendar, label: "Jadwal Kerja IT", href: "/schedules" },
      ]
    },
    {
      title: "Laporan & Sistem",
      items: [
        { icon: Printer, label: "Laporan & Cetak", href: "/reports" },
        { icon: Settings, label: "Pengaturan", href: "/settings" },
      ]
    }
  ];

  return (
    <aside className="w-64 h-full min-h-screen bg-surface border-r border-border flex flex-col">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
            <Cpu className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">OpsFlow <span className="text-primary">IT</span></span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-text-muted hover:text-foreground rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {menuSections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest px-3 mb-2">
              {section.title}
            </div>
            {section.items.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-foreground hover:bg-background transition-all duration-200 group text-sm"
              >
                <item.icon className="w-4.5 h-4.5 group-hover:text-primary transition-colors" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Developer Footer */}
      <div className="p-4.5 border-t border-border mt-auto bg-surface/40 text-center">
        <div className="flex flex-col items-center justify-center gap-1 animate-in fade-in duration-300">
          <p className="text-[9px] text-text-muted/50 font-black tracking-widest uppercase">OpsFlow IT Platform</p>
          <p className="text-[10.5px] text-text-muted font-bold flex items-center gap-1 justify-center">
            Website ini dibuat oleh <span className="font-black text-primary hover:text-primary-hover transition-colors">FiksRiots</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
