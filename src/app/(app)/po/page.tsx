import React from "react";
import { createClient } from "@/utils/supabase/server";
import POListClient from "./po-list-client";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 5;
  const supabase = await createClient();

  let query = supabase
    .from("purchase_orders_view")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (q) {
    query = query.or(`po_number.ilike.%${q}%,department.ilike.%${q}%,supplier_name.ilike.%${q}%,location_name.ilike.%${q}%`);
  }

  // Pagination Range
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data: pos, error, count } = await query.range(from, to);

  // Ambil rincian item untuk masing-masing PO yang terdaftar agar ringkasan cetakan terisi data valid
  const poIds = (pos || []).map(p => p.id);
  let poItems: any[] = [];
  if (poIds.length > 0) {
    const { data } = await supabase
      .from("po_items")
      .select("*, items(name, sku)")
      .in("po_id", poIds);
    poItems = data || [];
  }

  const enrichedPos = (pos || []).map(p => ({
    ...p,
    items: poItems.filter(item => item.po_id === p.id)
  }));

  // Stats (total counts per status)
  const { data: allPos } = await supabase.from("purchase_orders").select("status");

  const statuses = [
    { label: "Draft", count: allPos?.filter(p => p.status === 'Draft').length || 0, color: "text-text-muted", bg: "bg-surface" },
    { label: "Menunggu Persetujuan", count: allPos?.filter(p => p.status === 'Menunggu Persetujuan').length || 0, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Disetujui", count: allPos?.filter(p => p.status === 'Disetujui').length || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Selesai", count: allPos?.filter(p => p.status === 'Selesai').length || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <POListClient 
        pos={enrichedPos}
        count={count || 0}
        currentPage={currentPage}
        totalPages={totalPages || 1}
        statuses={statuses}
        q={q}
        status={status}
        error={error}
      />
    </div>
  );
}
