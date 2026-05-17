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
DROP VIEW IF EXISTS public.purchase_orders_view;
CREATE OR REPLACE VIEW public.purchase_orders_view
WITH (security_invoker = true) AS
SELECT 
    po.*,
    s.name as supplier_name,
    l.name as location_name
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN locations l ON po.location_id = l.id;

-- 5. Muat ulang cache skema API PostgREST
NOTIFY pgrst, 'reload schema';
