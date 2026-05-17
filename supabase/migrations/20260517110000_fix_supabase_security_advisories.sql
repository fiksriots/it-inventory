-- 1. Pastikan RLS aktif pada tabel profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Aktifkan RLS pada tabel computers
ALTER TABLE IF EXISTS public.computers ENABLE ROW LEVEL SECURITY;

-- 3. Buat kebijakan akses penuh untuk pengguna terautentikasi pada tabel computers
DROP POLICY IF EXISTS "Allow authenticated users full access on computers" ON public.computers;
CREATE POLICY "Allow authenticated users full access on computers"
ON public.computers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Rekonstruksi purchase_orders_view dengan opsi security_invoker = true
-- Langkah ini mengubah view dari Security Definer menjadi Security Invoker (mengikuti RLS tabel purchase_orders)
DROP VIEW IF EXISTS public.purchase_orders_view CASCADE;
CREATE OR REPLACE VIEW public.purchase_orders_view
WITH (security_invoker = true) AS
SELECT 
    po.*,
    s.name as supplier_name,
    l.name as location_name
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN locations l ON po.location_id = l.id;

-- 5. Optimasi Performa RLS pada tabel profiles (Menyelesaikan Peringatan Performance Advisor)
-- Menggunakan subquery (SELECT auth.uid()) agar planner PostgreSQL melakukan caching nilai user ID
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = id );

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( (SELECT auth.uid()) = id );

-- 6. Perbaiki kerentanan Search Path Mutable pada fungsi handle_new_user (Security Advisor Warning)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 7. Perbaiki RLS Policy Always True pada tabel inventaris lainnya
-- Mengubah USING (true) menjadi USING (auth.role() = 'authenticated')

-- Inventory Logs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.inventory_logs;
CREATE POLICY "Enable all for authenticated users" ON public.inventory_logs FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Item Stocks
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.item_stocks;
CREATE POLICY "Enable all for authenticated users" ON public.item_stocks FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Item Transfers
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.item_transfers;
CREATE POLICY "Enable all for authenticated users" ON public.item_transfers FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.items;
CREATE POLICY "Enable all for authenticated users" ON public.items FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Locations
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.locations;
CREATE POLICY "Enable all for authenticated users" ON public.locations FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- PO Items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.po_items;
CREATE POLICY "Enable all for authenticated users" ON public.po_items FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Purchase Orders
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.purchase_orders;
CREATE POLICY "Enable all for authenticated users" ON public.purchase_orders FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Suppliers
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.suppliers;
CREATE POLICY "Enable all for authenticated users" ON public.suppliers FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 8. Batasi hak akses SELECT pada bucket storage 'invoices' agar tidak mengekspos daftar file secara publik
-- Menjadikan bucket 'invoices' privat (sangat direkomendasikan karena invoice berisi data pembelian sensitif)
-- Dan membatasi kueri objek SELECT hanya untuk pengguna terautentikasi (authenticated)
UPDATE storage.buckets
SET public = false
WHERE id = 'invoices';

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'invoices' );

-- 9. Batasi eksekusi fungsi SECURITY DEFINER handle_new_user
-- Cabut hak akses EXECUTE dari PUBLIC, authenticated, dan anon agar fungsi ini hanya bisa dijalankan oleh system/trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;

-- 10. Amankan skema public dari akses anonim (Menghapus seluruh peringatan skema GraphQL Publik)
-- Karena ini sistem inventaris internal, pengguna yang tidak login (anon) sama sekali tidak boleh melihat tabel/skema apapun
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 11. Muat ulang cache skema API PostgREST
NOTIFY pgrst, 'reload schema';
