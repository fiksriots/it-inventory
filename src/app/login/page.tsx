"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Loader2, Lock, Mail, Package } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle di pojok kanan atas */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IT Inventory</h1>
          <p className="text-text-muted mt-1 text-sm">Masuk ke sistem manajemen inventaris</p>
        </div>

        {/* Card Login */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-8">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-medium text-center">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="admin@perusahaan.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          © 2025 IT Inventory System. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
