import type { Metadata } from "next";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "IT Inventory System",
  description: "Modern IT Inventory Management System",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Jika belum login, arahkan ke halaman login
  if (!user) {
    redirect("/login");
  }

  return <ClientLayout user={user}>{children}</ClientLayout>;
}
