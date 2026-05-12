import React from "react";
import { createClient } from "@/utils/supabase/server";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. Ambil data Master Barang beserta Stok dan Lokasinya
  const { data: items } = await supabase
    .from("items")
    .select("*, categories(name), item_stocks(quantity, condition, location_id, locations(name))")
    .order("name");

  // 2. Ambil data Infrastruktur & Fasilitas
  const { data: infrastructureAssets } = await supabase
    .from("infrastructure_assets")
    .select("*, locations(name)")
    .order("name");

  // 3. Ambil data Komputer & PC
  const { data: computers } = await supabase
    .from("computers")
    .select("*, locations(name)")
    .order("name");

  // 4. Ambil daftar Lokasi untuk dropdown filter
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");

  // 5. Ambil semua data Purchase Orders beserta rincian itemnya
  const { data: posRaw } = await supabase
    .from("purchase_orders_view")
    .select("*")
    .order("created_at", { ascending: false });

  const safePos = posRaw || [];
  const poIds = safePos.map(p => p.id);
  let poItems: any[] = [];
  
  if (poIds.length > 0) {
    const { data } = await supabase
      .from("po_items")
      .select("*, items(name, sku)")
      .in("po_id", poIds);
    poItems = data || [];
  }

  const enrichedPos = safePos.map(p => ({
    ...p,
    items: poItems.filter(item => item.po_id === p.id)
  }));

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <ReportsClient 
        items={items || []}
        infrastructureAssets={infrastructureAssets || []}
        computers={computers || []}
        locations={locations || []}
        pos={enrichedPos}
      />
    </div>
  );
}
