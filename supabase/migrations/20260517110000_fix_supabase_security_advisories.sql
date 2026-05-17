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

-- 7. Muat ulang cache skema API PostgREST
NOTIFY pgrst, 'reload schema';
