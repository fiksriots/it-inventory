import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "IT Inventory System",
  description: "Modern IT Inventory Management System",
};

import { getNavbarStats } from "@/components/layout/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Ambil data profile tambahan (nama & avatar)
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  const { lowStockCount, lowStockItems } = await getNavbarStats();

  // Jika belum login, arahkan ke halaman login
  if (!user) {
    redirect("/login");
  }

  return (
    <ClientLayout 
      user={user} 
      userProfile={userProfile}
      lowStockCount={lowStockCount} 
      lowStockItems={lowStockItems}
    >
      {children}
    </ClientLayout>
  );
}
