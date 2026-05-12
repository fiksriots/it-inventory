import { createClient } from "@/utils/supabase/server";

export async function getNavbarStats() {
  const supabase = await createClient();

  // 1. Ambil stok barang kritis
  const { data: rawStocks } = await supabase
    .from("item_stocks")
    .select("quantity, items(id, name, sku)")
    .lt("quantity", 5);

  const lowStockItems = (rawStocks || []).map(item => ({
    id: item.items ? (item.items as any).id : "",
    name: item.items ? (item.items as any).name : "",
    sku: item.items ? (item.items as any).sku : "",
    quantity: item.quantity
  }));

  // 2. Ambil notifikasi jadwal maintenance Infrastruktur & Fasilitas
  const { data: rawInfra } = await supabase
    .from("infrastructure_assets")
    .select("id, name, asset_number, category, next_maintenance_date")
    .not("next_maintenance_date", "is", null);

  const todayMs = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const infraAlerts = (rawInfra || []).filter(item => {
    if (!item.next_maintenance_date) return false;
    const dateMs = new Date(item.next_maintenance_date).getTime();
    // Mendekati (<= 30 hari ke depan) atau terlewat
    return (dateMs - todayMs) <= thirtyDaysMs;
  }).map(item => {
    const isOverdue = new Date(item.next_maintenance_date) < new Date();
    return {
      id: item.id,
      name: item.name,
      code: item.asset_number,
      category: item.category,
      type: "infra_maintenance",
      date: item.next_maintenance_date,
      isOverdue
    };
  });

  // 3. Ambil notifikasi jadwal maintenance & masa garansi Komputer
  const { data: rawComputers } = await supabase
    .from("computers")
    .select("id, name, asset_number, next_maintenance_date, warranty_expiry_date");

  const compAlerts: any[] = [];

  (rawComputers || []).forEach(comp => {
    // Cek tenggat waktu Maintenance
    if (comp.next_maintenance_date) {
      const mDateMs = new Date(comp.next_maintenance_date).getTime();
      if ((mDateMs - todayMs) <= thirtyDaysMs) {
        compAlerts.push({
          id: comp.id,
          name: comp.name,
          code: comp.asset_number,
          category: "Komputer",
          type: "comp_maintenance",
          date: comp.next_maintenance_date,
          isOverdue: new Date(comp.next_maintenance_date) < new Date()
        });
      }
    }
    // Cek kadaluarsa Garansi
    if (comp.warranty_expiry_date) {
      const wDateMs = new Date(comp.warranty_expiry_date).getTime();
      if ((wDateMs - todayMs) <= thirtyDaysMs) {
        compAlerts.push({
          id: comp.id,
          name: comp.name,
          code: comp.asset_number,
          category: "Komputer",
          type: "comp_warranty",
          date: comp.warranty_expiry_date,
          isOverdue: new Date(comp.warranty_expiry_date) < new Date()
        });
      }
    }
  });

  // Gabungkan seluruh notifikasi dan urutkan berdasarkan yang paling mendesak
  const maintenanceAlerts = [...infraAlerts, ...compAlerts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.slice(0, 5),
    maintenanceCount: maintenanceAlerts.length,
    maintenanceAlerts: maintenanceAlerts.slice(0, 8)
  };
}
