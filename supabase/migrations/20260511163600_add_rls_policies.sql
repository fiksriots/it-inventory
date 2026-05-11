-- Enable RLS for all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allowing authenticated users full access for now, as it is an internal system)

-- Categories
CREATE POLICY "Enable all for authenticated users" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Locations
CREATE POLICY "Enable all for authenticated users" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Items
CREATE POLICY "Enable all for authenticated users" ON items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Item Stocks
CREATE POLICY "Enable all for authenticated users" ON item_stocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory Logs
CREATE POLICY "Enable all for authenticated users" ON inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Item Transfers
CREATE POLICY "Enable all for authenticated users" ON item_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers
CREATE POLICY "Enable all for authenticated users" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Enable all for authenticated users" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PO Items
CREATE POLICY "Enable all for authenticated users" ON po_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
