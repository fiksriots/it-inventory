import Link from "next/link";
import { LayoutDashboard, Package, ArrowRightLeft, ShoppingCart, Users, Settings } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Master Barang", href: "/items" },
    { icon: ArrowRightLeft, label: "Mutasi & Transfer", href: "/transfers" },
    { icon: ShoppingCart, label: "Purchase Orders", href: "/po" },
    { icon: Users, label: "Supplier", href: "/suppliers" },
    { icon: Settings, label: "Pengaturan", href: "/settings" },
  ];

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
          <Package className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">IT Inventory</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-3">
          Menu Utama
        </div>
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-foreground hover:bg-background transition-all duration-200 group"
          >
            <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-text-muted truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
