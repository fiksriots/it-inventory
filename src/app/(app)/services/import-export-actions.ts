"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. DATA BARANG (ITEMS / PRODUCTS)
// ==========================================

export async function getAllItemsForExport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(`
      sku,
      name,
      price,
      description,
      categories (name),
      item_stocks (
        quantity,
        condition,
        locations (name)
      )
    `)
    .order("sku", { ascending: true });

  if (error) {
    console.error("Error exporting items:", error);
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => {
    // Gabungkan detail stok
    const stocks = item.item_stocks || [];
    const stockDetail = stocks.map((s: any) => `${s.locations?.name || "Gudang"}: ${s.quantity} (${s.condition || "Baru"})`).join(", ");
    const totalQty = stocks.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

    return {
      "SKU": item.sku,
      "Nama Barang": item.name,
      "Kategori": item.categories?.name || "-",
      "Harga (IDR)": item.price || 0,
      "Total Stok": totalQty,
      "Detail Lokasi & Stok": stockDetail || "-",
      "Deskripsi": item.description || "-"
    };
  });
}

export async function importItemsBulk(itemsData: any[]) {
  const supabase = await createClient();

  // Ambil data user saat ini
  const { data: { user } } = await supabase.auth.getUser();

  // Cache kategori dan lokasi yang ada untuk optimasi kecepatan kueri
  const { data: allCategories } = await supabase.from("categories").select("id, name");
  const categoryMap: Record<string, string> = {};
  allCategories?.forEach(cat => {
    categoryMap[cat.name.trim().toLowerCase()] = cat.id;
  });

  const { data: allLocations } = await supabase.from("locations").select("id, name");
  const locationMap: Record<string, string> = {};
  allLocations?.forEach(loc => {
    locationMap[loc.name.trim().toLowerCase()] = loc.id;
  });

  let importedCount = 0;

  for (const row of itemsData) {
    // Normalisasi kunci dari file Excel (bisa berupa bhs indonesia / inggris)
    const name = row["Nama Barang"] || row["Nama"] || row["name"] || row["Name"];
    let sku = row["SKU"] || row["sku"] || row["Kode"];
    const catName = row["Kategori"] || row["kategori"] || row["Category"] || row["category"];
    const priceVal = row["Harga"] || row["Harga (IDR)"] || row["price"] || row["Price"] || "0";
    const desc = row["Deskripsi"] || row["deskripsi"] || row["Description"] || row["description"] || "";
    const locName = row["Lokasi"] || row["lokasi"] || row["Gudang"] || row["Location"] || row["location"];
    const qtyVal = row["Stok"] || row["Total Stok"] || row["Stok Awal"] || row["quantity"] || row["Quantity"] || "0";
    const cond = row["Kondisi"] || row["condition"] || row["Condition"] || "Baru";

    if (!name) continue;

    // Resolve atau buat Kategori
    let category_id = null;
    if (catName) {
      const lowerCat = catName.trim().toLowerCase();
      if (categoryMap[lowerCat]) {
        category_id = categoryMap[lowerCat];
      } else {
        const { data: newCat } = await supabase
          .from("categories")
          .insert([{ name: catName.trim() }])
          .select("id")
          .single();
        if (newCat) {
          category_id = newCat.id;
          categoryMap[lowerCat] = newCat.id;
        }
      }
    }

    // Auto generate SKU jika kosong / -AUTO
    if (!sku || sku === "-AUTO") {
      const prefix = catName ? catName.trim().substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") : "ITEM";
      const { data: existingItems } = await supabase
        .from("items")
        .select("sku")
        .like("sku", `${prefix}-%`);

      let maxSeq = 0;
      if (existingItems && existingItems.length > 0) {
        existingItems.forEach((item: any) => {
          const parts = item.sku.split('-');
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        });
      }
      sku = `${prefix}-${(maxSeq + 1).toString().padStart(4, '0')}`;
    }

    // Simpan data barang
    const { data: newItem, error: itemErr } = await supabase
      .from("items")
      .insert([{
        name: name.trim(),
        sku: sku.trim(),
        category_id,
        price: parseFloat(priceVal.toString().replace(/[^0-9.-]/g, "")) || 0,
        description: desc.trim()
      }])
      .select()
      .single();

    if (itemErr) {
      console.error(`Gagal mengimpor barang ${name}:`, itemErr);
      continue;
    }

    importedCount++;

    // Masukkan stok awal jika ditentukan
    const qty = parseInt(qtyVal.toString());
    if (newItem && locName && !isNaN(qty) && qty > 0) {
      const lowerLoc = locName.trim().toLowerCase();
      let location_id = null;
      if (locationMap[lowerLoc]) {
        location_id = locationMap[lowerLoc];
      } else {
        const { data: newLoc } = await supabase
          .from("locations")
          .insert([{ name: locName.trim() }])
          .select("id")
          .single();
        if (newLoc) {
          location_id = newLoc.id;
          locationMap[lowerLoc] = newLoc.id;
        }
      }

      if (location_id) {
        await Promise.all([
          supabase.from("item_stocks").insert([{
            item_id: newItem.id,
            location_id,
            quantity: qty,
            condition: cond
          }]),
          supabase.from("inventory_logs").insert([{
            item_id: newItem.id,
            location_id,
            user_id: user?.id,
            mutation_type: 'INBOUND',
            quantity: qty,
            notes: 'Diimpor otomatis via Excel.'
          }])
        ]);
      }
    }
  }

  revalidatePath("/items");
  return { success: true, count: importedCount };
}

// ==========================================
// 2. DATA ASET KOMPUTER / PC
// ==========================================

export async function getAllComputersForExport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("computers")
    .select(`
      asset_number,
      name,
      user_assigned,
      ip_address,
      operating_system,
      processor,
      ram,
      storage,
      status,
      last_maintenance_date,
      next_maintenance_date,
      notes,
      locations (name)
    `)
    .order("asset_number", { ascending: true });

  if (error) {
    console.error("Error exporting computers:", error);
    throw new Error(error.message);
  }

  return (data || []).map((c: any) => ({
    "Nomor Aset": c.asset_number,
    "Nama Komputer": c.name,
    "Lokasi": c.locations?.name || "-",
    "User Assigned": c.user_assigned || "-",
    "Alamat IP": c.ip_address || "-",
    "Sistem Operasi": c.operating_system || "-",
    "Processor": c.processor || "-",
    "RAM": c.ram || "-",
    "Storage": c.storage || "-",
    "Status": c.status || "Aktif",
    "Terakhir Maintenance": c.last_maintenance_date || "-",
    "Maintenance Berikutnya": c.next_maintenance_date || "-",
    "Catatan": c.notes || "-"
  }));
}

export async function importComputersBulk(computersData: any[]) {
  const supabase = await createClient();

  const { data: allLocations } = await supabase.from("locations").select("id, name");
  const locationMap: Record<string, string> = {};
  allLocations?.forEach(loc => {
    locationMap[loc.name.trim().toLowerCase()] = loc.id;
  });

  let importedCount = 0;

  for (const row of computersData) {
    const name = row["Nama Komputer"] || row["Nama"] || row["name"] || row["Name"];
    let asset_number = row["Nomor Aset"] || row["asset_number"] || row["Asset_Number"] || row["Kode"];
    const locName = row["Lokasi"] || row["lokasi"] || row["Location"] || row["location"];
    const user_assigned = row["User Assigned"] || row["user_assigned"] || row["User"] || row["Pengguna"];
    const ip_address = row["Alamat IP"] || row["ip_address"] || row["IP"];
    const operating_system = row["Sistem Operasi"] || row["operating_system"] || row["OS"];
    const processor = row["Processor"] || row["processor"];
    const ram = row["RAM"] || row["ram"];
    const storage = row["Storage"] || row["storage"];
    const status = row["Status"] || row["status"] || "Aktif";
    const last_maint = row["Terakhir Maintenance"] || row["last_maintenance_date"];
    const next_maint = row["Maintenance Berikutnya"] || row["next_maintenance_date"];
    const notes = row["Catatan"] || row["notes"] || "";

    if (!name) continue;

    // Resolve lokasi
    let location_id = null;
    if (locName) {
      const lowerLoc = locName.trim().toLowerCase();
      if (locationMap[lowerLoc]) {
        location_id = locationMap[lowerLoc];
      } else {
        const { data: newLoc } = await supabase
          .from("locations")
          .insert([{ name: locName.trim() }])
          .select("id")
          .single();
        if (newLoc) {
          location_id = newLoc.id;
          locationMap[lowerLoc] = newLoc.id;
        }
      }
    }

    // Auto-generate Asset Number
    if (!asset_number || asset_number === "-AUTO") {
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const prefix = `PC-${dateStr}`;

      const { data: existingComps } = await supabase
        .from("computers")
        .select("asset_number")
        .like("asset_number", `${prefix}-%`);

      let maxSeq = 0;
      if (existingComps && existingComps.length > 0) {
        existingComps.forEach((c: any) => {
          const parts = c.asset_number.split('-');
          const seqStr = parts[parts.length - 1];
          const seqNum = parseInt(seqStr, 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        });
      }
      asset_number = `${prefix}-${(maxSeq + 1).toString().padStart(3, '0')}`;
    }

    const { error } = await supabase
      .from("computers")
      .insert([{
        name: name.trim(),
        asset_number: asset_number.trim(),
        location_id,
        user_assigned: user_assigned ? user_assigned.toString().trim() : null,
        ip_address: ip_address ? ip_address.toString().trim() : null,
        operating_system: operating_system ? operating_system.toString().trim() : null,
        processor: processor ? processor.toString().trim() : null,
        ram: ram ? ram.toString().trim() : null,
        storage: storage ? storage.toString().trim() : null,
        status: status.toString().trim(),
        last_maintenance_date: last_maint ? last_maint.toString().trim() : null,
        next_maintenance_date: next_maint ? next_maint.toString().trim() : null,
        notes: notes.toString().trim()
      }]);

    if (error) {
      console.error(`Gagal mengimpor komputer ${name}:`, error);
      continue;
    }

    importedCount++;
  }

  revalidatePath("/computers");
  return { success: true, count: importedCount };
}

// ==========================================
// 3. DATA INFRASTRUKTUR / FASILITAS FISIK
// ==========================================

export async function getAllInfrastructureForExport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("infrastructure_assets")
    .select(`
      asset_number,
      name,
      category,
      status,
      ip_address,
      last_maintenance_date,
      next_maintenance_date,
      vendor_name,
      notes,
      locations (name)
    `)
    .order("asset_number", { ascending: true });

  if (error) {
    console.error("Error exporting infrastructure:", error);
    throw new Error(error.message);
  }

  return (data || []).map((inf: any) => ({
    "Nomor Aset": inf.asset_number,
    "Nama Fasilitas": inf.name,
    "Kategori": inf.category || "Lainnya",
    "Lokasi": inf.locations?.name || "-",
    "Status": inf.status || "Aktif",
    "Alamat IP": inf.ip_address || "-",
    "Vendor / Teknisi": inf.vendor_name || "-",
    "Terakhir Maintenance": inf.last_maintenance_date || "-",
    "Maintenance Berikutnya": inf.next_maintenance_date || "-",
    "Catatan": inf.notes || "-"
  }));
}

export async function importInfrastructureBulk(infraData: any[]) {
  const supabase = await createClient();

  const { data: allLocations } = await supabase.from("locations").select("id, name");
  const locationMap: Record<string, string> = {};
  allLocations?.forEach(loc => {
    locationMap[loc.name.trim().toLowerCase()] = loc.id;
  });

  let importedCount = 0;

  for (const row of infraData) {
    const name = row["Nama Fasilitas"] || row["Nama"] || row["name"] || row["Name"];
    let asset_number = row["Nomor Aset"] || row["asset_number"] || row["Asset_Number"] || row["Kode"];
    const category = row["Kategori"] || row["category"] || row["Category"] || "Lainnya";
    const locName = row["Lokasi"] || row["lokasi"] || row["Location"] || row["location"];
    const status = row["Status"] || row["status"] || "Aktif";
    const ip_address = row["Alamat IP"] || row["ip_address"] || row["IP"];
    const vendor_name = row["Vendor / Teknisi"] || row["Vendor"] || row["Teknisi"] || row["vendor_name"];
    const last_maint = row["Terakhir Maintenance"] || row["last_maintenance_date"];
    const next_maint = row["Maintenance Berikutnya"] || row["next_maintenance_date"];
    const notes = row["Catatan"] || row["notes"] || "";

    if (!name) continue;

    // Resolve lokasi
    let location_id = null;
    if (locName) {
      const lowerLoc = locName.trim().toLowerCase();
      if (locationMap[lowerLoc]) {
        location_id = locationMap[lowerLoc];
      } else {
        const { data: newLoc } = await supabase
          .from("locations")
          .insert([{ name: locName.trim() }])
          .select("id")
          .single();
        if (newLoc) {
          location_id = newLoc.id;
          locationMap[lowerLoc] = newLoc.id;
        }
      }
    }

    // Auto-generate Asset Number
    if (!asset_number || asset_number === "-AUTO") {
      const catPrefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "INF");
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      const prefix = `${catPrefix}-${dateStr}`;

      const { data: existingAssets } = await supabase
        .from("infrastructure_assets")
        .select("asset_number")
        .like("asset_number", `${prefix}-%`);

      let maxSeq = 0;
      if (existingAssets && existingAssets.length > 0) {
        existingAssets.forEach((asset: any) => {
          const parts = asset.asset_number.split('-');
          const seqStr = parts[parts.length - 1];
          const seqNum = parseInt(seqStr, 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        });
      }
      asset_number = `${prefix}-${(maxSeq + 1).toString().padStart(3, '0')}`;
    }

    const { error } = await supabase
      .from("infrastructure_assets")
      .insert([{
        name: name.trim(),
        asset_number: asset_number.trim(),
        category: category.toString().trim(),
        location_id,
        status: status.toString().trim(),
        ip_address: ip_address ? ip_address.toString().trim() : null,
        vendor_name: vendor_name ? vendor_name.toString().trim() : null,
        last_maintenance_date: last_maint ? last_maint.toString().trim() : null,
        next_maintenance_date: next_maint ? next_maint.toString().trim() : null,
        notes: notes.toString().trim()
      }]);

    if (error) {
      console.error(`Gagal mengimpor fasilitas ${name}:`, error);
      continue;
    }

    importedCount++;
  }

  revalidatePath("/infrastructure");
  return { success: true, count: importedCount };
}
