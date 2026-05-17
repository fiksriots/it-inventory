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
  const generatedSequences: Record<string, number> = {};

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
      
      if (generatedSequences[prefix] === undefined) {
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
        generatedSequences[prefix] = maxSeq;
      }

      generatedSequences[prefix]++;
      sku = `${prefix}-${generatedSequences[prefix].toString().padStart(4, '0')}`;
    }

    // Simpan data barang (upsert berdasarkan SKU agar jika sudah ada, datanya diperbarui)
    const { data: newItem, error: itemErr } = await supabase
      .from("items")
      .upsert({
        name: name.trim(),
        sku: sku.trim(),
        category_id,
        price: parseFloat(priceVal.toString().replace(/[^0-9.-]/g, "")) || 0,
        description: desc.trim()
      }, { onConflict: 'sku' })
      .select()
      .single();

    if (itemErr) {
      console.error(`Gagal mengimpor barang ${name}:`, itemErr);
      continue;
    }

    importedCount++;

    // Masukkan/perbarui stok jika ditentukan
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
          supabase.from("item_stocks").upsert({
            item_id: newItem.id,
            location_id,
            quantity: qty,
            condition: cond
          }, { onConflict: 'item_id,location_id' }),
          supabase.from("inventory_logs").insert([{
            item_id: newItem.id,
            location_id,
            user_id: user?.id,
            mutation_type: 'INBOUND',
            quantity: qty,
            notes: 'Stok diperbarui otomatis via Excel.'
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
  const generatedComputerSequences: Record<string, number> = {};

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

      if (generatedComputerSequences[prefix] === undefined) {
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
        generatedComputerSequences[prefix] = maxSeq;
      }

      generatedComputerSequences[prefix]++;
      asset_number = `${prefix}-${generatedComputerSequences[prefix].toString().padStart(3, '0')}`;
    }

    const { error } = await supabase
      .from("computers")
      .upsert({
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
      }, { onConflict: 'asset_number' });

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
  const generatedInfraSequences: Record<string, number> = {};

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

      if (generatedInfraSequences[prefix] === undefined) {
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
        generatedInfraSequences[prefix] = maxSeq;
      }

      generatedInfraSequences[prefix]++;
      asset_number = `${prefix}-${generatedInfraSequences[prefix].toString().padStart(3, '0')}`;
    }

    const { error } = await supabase
      .from("infrastructure_assets")
      .upsert({
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
      }, { onConflict: 'asset_number' });

    if (error) {
      console.error(`Gagal mengimpor fasilitas ${name}:`, error);
      continue;
    }

    importedCount++;
  }

  revalidatePath("/infrastructure");
  return { success: true, count: importedCount };
}

// ==========================================
// 4. DATA PURCHASE ORDER (PO)
// ==========================================

export async function getAllPurchaseOrdersForExport() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      po_number,
      status,
      total_amount,
      created_at,
      suppliers (name),
      po_items (
        quantity,
        unit_price,
        items (sku, name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error exporting POs:", error);
    throw new Error(error.message);
  }

  const rows: any[] = [];
  data?.forEach((po: any) => {
    const items = po.po_items || [];
    if (items.length === 0) {
      rows.push({
        "Nomor PO": po.po_number,
        "Supplier": po.suppliers?.name || "-",
        "Status": po.status || "Draft",
        "Nama Barang": "-",
        "SKU Barang": "-",
        "Jumlah": 0,
        "Harga Satuan": 0,
        "Total Harga": 0,
        "Grand Total PO": po.total_amount || 0,
        "Tanggal Dibuat": po.created_at || "-"
      });
    } else {
      items.forEach((item: any) => {
        rows.push({
          "Nomor PO": po.po_number,
          "Supplier": po.suppliers?.name || "-",
          "Status": po.status || "Draft",
          "Nama Barang": item.items?.name || "-",
          "SKU Barang": item.items?.sku || "-",
          "Jumlah": item.quantity || 0,
          "Harga Satuan": item.unit_price || 0,
          "Total Harga": (item.quantity || 0) * (item.unit_price || 0),
          "Grand Total PO": po.total_amount || 0,
          "Tanggal Dibuat": po.created_at || "-"
        });
      });
    }
  });
  return rows;
}

export async function importPurchaseOrdersBulk(poData: any[]) {
  const supabase = await createClient();

  // Ambil data user saat ini
  const { data: { user } } = await supabase.auth.getUser();

  // Cache suppliers, locations, items
  const { data: allSuppliers } = await supabase.from("suppliers").select("id, name");
  const supplierMap: Record<string, string> = {};
  allSuppliers?.forEach(s => {
    supplierMap[s.name.trim().toLowerCase()] = s.id;
  });

  const { data: allLocations } = await supabase.from("locations").select("id, name");
  const locationMap: Record<string, string> = {};
  allLocations?.forEach(loc => {
    locationMap[loc.name.trim().toLowerCase()] = loc.id;
  });

  const { data: allItems } = await supabase.from("items").select("id, sku, name");
  const itemSkuMap: Record<string, string> = {};
  const itemNameMap: Record<string, string> = {};
  allItems?.forEach(item => {
    itemSkuMap[item.sku.trim().toLowerCase()] = item.id;
    itemNameMap[item.name.trim().toLowerCase()] = item.id;
  });

  // Group rows by Nomor PO
  const poGroups: Record<string, any[]> = {};
  poData.forEach(row => {
    const poNum = row["Nomor PO"] || row["no_po"] || row["PO_Number"] || row["Nomor_PO"];
    if (!poNum) return;
    const key = poNum.toString().trim();
    if (!poGroups[key]) {
      poGroups[key] = [];
    }
    poGroups[key].push(row);
  });

  let importedPOCount = 0;

  for (const poNum of Object.keys(poGroups)) {
    const rows = poGroups[poNum];
    const firstRow = rows[0];

    const supName = firstRow["Supplier"] || firstRow["supplier"] || "Supplier Umum";
    const status = firstRow["Status"] || firstRow["status"] || "Draft";
    const dateStr = firstRow["Tanggal Dibuat"] || firstRow["Tanggal"] || firstRow["created_at"];

    // 1. Resolve Supplier
    let supplier_id = null;
    if (supName) {
      const lowerSup = supName.trim().toLowerCase();
      if (supplierMap[lowerSup]) {
        supplier_id = supplierMap[lowerSup];
      } else {
        const { data: newSup } = await supabase
          .from("suppliers")
          .insert([{ name: supName.trim() }])
          .select("id")
          .single();
        if (newSup) {
          supplier_id = newSup.id;
          supplierMap[lowerSup] = newSup.id;
        }
      }
    }

    // 2. Upsert Purchase Order Header
    let po_id = null;
    const { data: existingPO } = await supabase
      .from("purchase_orders")
      .select("id")
      .eq("po_number", poNum)
      .single();

    const poHeaderData: any = {
      po_number: poNum,
      supplier_id,
      status: status.toString().trim(),
      created_by: user?.id || null
    };

    if (dateStr) {
      poHeaderData.created_at = new Date(dateStr).toISOString();
    }

    if (existingPO) {
      po_id = existingPO.id;
      await supabase
        .from("purchase_orders")
        .update(poHeaderData)
        .eq("id", po_id);
      
      // Delete old items to re-insert cleanly
      await supabase.from("po_items").delete().eq("po_id", po_id);
    } else {
      const { data: newPO } = await supabase
        .from("purchase_orders")
        .insert([poHeaderData])
        .select("id")
        .single();
      if (newPO) {
        po_id = newPO.id;
      }
    }

    if (!po_id) continue;

    let grandTotal = 0;

    // 3. Process PO Items
    for (const row of rows) {
      const itemName = row["Nama Barang"] || row["Nama"] || row["item_name"];
      let itemSku = row["SKU Barang"] || row["SKU"] || row["sku"];
      const qty = parseInt(row["Jumlah"] || row["quantity"] || row["qty"] || "0");
      const price = parseFloat(row["Harga Satuan"] || row["unit_price"] || row["price"] || "0");

      if (!itemName && !itemSku) continue;
      if (qty <= 0) continue;

      // Resolve or create Item
      let item_id = null;
      const lowerSku = itemSku ? itemSku.toString().trim().toLowerCase() : "";
      const lowerName = itemName ? itemName.toString().trim().toLowerCase() : "";

      if (lowerSku && itemSkuMap[lowerSku]) {
        item_id = itemSkuMap[lowerSku];
      } else if (lowerName && itemNameMap[lowerName]) {
        item_id = itemNameMap[lowerName];
      } else {
        // Create new item
        const finalSku = itemSku || `ITEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const { data: newItem } = await supabase
          .from("items")
          .insert([{
            name: itemName ? itemName.trim() : "Barang Tanpa Nama",
            sku: finalSku,
            price: price || 0
          }])
          .select("id, sku, name")
          .single();
        
        if (newItem) {
          item_id = newItem.id;
          itemSkuMap[newItem.sku.toLowerCase()] = newItem.id;
          itemNameMap[newItem.name.toLowerCase()] = newItem.id;
        }
      }

      if (item_id) {
        const itemTotal = qty * price;
        grandTotal += itemTotal;

        // Insert PO Item
        await supabase.from("po_items").insert([{
          po_id,
          item_id,
          quantity: qty,
          unit_price: price
        }]);

        // 4. Jika status PO adalah "Selesai", perbarui stoknya!
        if (status === "Selesai") {
          let location_id = null;
          const locKeys = Object.keys(locationMap);
          if (locKeys.length > 0) {
            location_id = locationMap[locKeys[0]];
          } else {
            const { data: newLoc } = await supabase
              .from("locations")
              .insert([{ name: "Gudang Utama" }])
              .select("id")
              .single();
            if (newLoc) {
              location_id = newLoc.id;
              locationMap["gudang utama"] = newLoc.id;
            }
          }

          if (location_id) {
            const { data: existingStock } = await supabase
              .from("item_stocks")
              .select("quantity")
              .eq("item_id", item_id)
              .eq("location_id", location_id)
              .single();

            if (existingStock) {
              await supabase
                .from("item_stocks")
                .update({ quantity: existingStock.quantity + qty })
                .eq("item_id", item_id)
                .eq("location_id", location_id);
            } else {
              await supabase
                .from("item_stocks")
                .insert([{
                  item_id,
                  location_id,
                  quantity: qty,
                  condition: 'Baru'
                }]);
            }

            await supabase.from("inventory_logs").insert([{
              item_id,
              location_id,
              user_id: user?.id,
              mutation_type: 'INBOUND',
              quantity: qty,
              notes: `Stok bertambah otomatis dari import PO nomor ${poNum}.`
            }]);
          }
        }
      }
    }

    // Update grand total di PO Header
    await supabase
      .from("purchase_orders")
      .update({ total_amount: grandTotal })
      .eq("id", po_id);

    importedPOCount++;
  }

  revalidatePath("/po");
  return { success: true, count: importedPOCount };
}
