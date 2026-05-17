import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import POEditClient from "./po-edit-client";

export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the PO
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!po) notFound();

  // PO yang sudah selesai tidak dapat diedit/direvisi
  if (po.status === 'Selesai') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-4">
        <h2 className="text-lg font-bold text-rose-500">Revisi Ditolak</h2>
        <p className="text-xs text-text-muted">Purchase Order yang sudah berstatus "Selesai" tidak dapat direvisi karena stok barang sudah didistribusikan ke gudang.</p>
        <a href={`/po/${id}`} className="inline-block text-xs bg-surface border border-border px-4 py-2 rounded-xl text-text-muted hover:text-foreground">
          Kembali ke Detail
        </a>
      </div>
    );
  }

  // Fetch PO Items
  const { data: poItems } = await supabase
    .from("po_items")
    .select("*")
    .eq("po_id", id);

  // Fetch master data
  const [suppliersRes, itemsRes, locationsRes] = await Promise.all([
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("items").select("id, name, sku, price").order("name"),
    supabase.from("locations").select("id, name").order("name")
  ]);

  return (
    <POEditClient 
      po={po}
      initialItems={poItems || []}
      suppliers={suppliersRes.data || []}
      masterItems={itemsRes.data || []}
      locations={locationsRes.data || []}
    />
  );
}
