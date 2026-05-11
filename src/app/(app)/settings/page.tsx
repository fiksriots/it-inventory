import { createClient } from "@/utils/supabase/server";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user profile
  let userProfile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    userProfile = data;
  }
  
  // Get company profile
  const { data: company } = await supabase
    .from("company_profile")
    .select("*")
    .single();

  // Get recent activity logs for Security tab with joined profiles
  const { data: logs } = await supabase
    .from("inventory_logs")
    .select(`
      id,
      mutation_type,
      quantity,
      notes,
      created_at,
      items (name),
      profiles (email, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  // Jika query gagal (misal karena migrasi belum dijalankan), gunakan array kosong
  const safeLogs = logs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-text-muted mt-1">Kelola profil Anda dan konfigurasi sistem inventaris.</p>
      </div>

      <SettingsClient user={user} userProfile={userProfile} company={company} logs={safeLogs} />
    </div>
  );
}
