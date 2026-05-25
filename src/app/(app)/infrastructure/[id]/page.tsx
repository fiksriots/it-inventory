import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InfrastructureDetailClient from "./infrastructure-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InfrastructureDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Ambil rincian fasilitas dengan penggabungan lokasi dan pengguna yang mendaftarkan
  const { data: asset } = await supabase
    .from("infrastructure_assets")
    .select(`
      *,
      locations (name, parent:parent_id(name))
    `)
    .eq("id", id)
    .single();

  if (!asset) {
    notFound();
  }

  // Ambil seluruh daftar lokasi untuk fitur pengeditan
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, parent:parent_id(name)")
    .order("name");

  const { data: itemsList } = await supabase
    .from("items")
    .select("id, name, sku")
    .order("name");

  // Ambil riwayat perawatan (maintenance history)
  let maintenanceLogs: any[] = [];
  let dbTableMissing = false;

  try {
    const { data: logs, error: logsError } = await supabase
      .from("infrastructure_maintenance_logs")
      .select("*")
      .eq("asset_id", id)
      .order("maintenance_date", { ascending: false });

    if (logsError) {
      if (logsError.code === "PGRST205" || logsError.message.includes("does not exist")) {
        dbTableMissing = true;
      } else {
        console.error("Error fetching maintenance logs:", logsError);
      }
    } else {
      maintenanceLogs = logs || [];
    }
  } catch (err) {
    console.error("Failed to query maintenance logs:", err);
    dbTableMissing = true;
  }

  return (
    <InfrastructureDetailClient
      asset={asset}
      locations={locations || []}
      itemsList={itemsList || []}
      maintenanceLogs={maintenanceLogs}
      dbTableMissing={dbTableMissing}
    />
  );
}
