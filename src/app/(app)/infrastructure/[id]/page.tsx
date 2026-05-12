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
      locations (name)
    `)
    .eq("id", id)
    .single();

  if (!asset) {
    notFound();
  }

  // Ambil seluruh daftar lokasi untuk fitur pengeditan
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");

  return <InfrastructureDetailClient asset={asset} locations={locations || []} />;
}
