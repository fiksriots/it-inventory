import React from "react";
import { createClient } from "@/utils/supabase/server";
import POListClient from "./po-list-client";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; department?: string }>;
}) {
  const { q, status, department } = await searchParams;
  const supabase = await createClient();

  // Fetch unique departments list from purchase_orders for filtering
  const { data: deptRaw } = await supabase
    .from("purchase_orders")
    .select("department");
  const departments = Array.from(
    new Set((deptRaw || []).map((d) => d.department).filter(Boolean))
  ).sort();

  let query = supabase
    .from("purchase_orders_view")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (department) {
    query = query.eq("department", department);
  }

  if (q) {
    query = query.or(`po_number.ilike.%${q}%,department.ilike.%${q}%,supplier_name.ilike.%${q}%,location_name.ilike.%${q}%`);
  }

  const { data: pos, error, count } = await query;

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

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <POListClient 
        pos={enrichedPos}
        count={count || 0}
        statuses={statuses}
        departments={departments}
        q={q}
        status={status}
        department={department}
        error={error}
      />
    </div>
  );
}
