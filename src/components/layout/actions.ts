import { createClient } from "@/utils/supabase/server";

export async function getNavbarStats() {
  const supabase = await createClient();

  // Get low stock items details
  const { data: lowStockItems } = await supabase
    .from("item_stocks")
    .select("quantity, items(id, name, sku)")
    .lt("quantity", 5)
    .limit(5); // Limit to 5 most critical items for the popup

  return {
    lowStockCount: lowStockItems?.length || 0,
    lowStockItems: (lowStockItems || []).map(item => ({
      id: (item.items as any).id,
      name: (item.items as any).name,
      sku: (item.items as any).sku,
      quantity: item.quantity
    }))
  };
}
