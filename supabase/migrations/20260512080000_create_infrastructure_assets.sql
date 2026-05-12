-- Membuat tabel khusus untuk mendata fasilitas fisik/infrastruktur (CCTV, DVR, Portal Gate, dll)
CREATE TABLE IF NOT EXISTS public.infrastructure_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'CCTV', 'DVR', 'Gate/Portal', 'AC/Pendingin', 'Lainnya'
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Aktif', -- 'Aktif', 'Maintenance', 'Rusak', 'Nonaktif'
  ip_address TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  vendor_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memberikan hak akses penuh kepada seluruh peran standar sistem
GRANT ALL ON TABLE public.infrastructure_assets TO anon, authenticated, service_role;

-- Mengaktifkan RLS dan menyediakan kebijakan akses penuh (Bypass Policies)
-- Hal ini memastikan bahwa operasi CRUD tidak terblokir meskipun antarmuka Supabase Studio mewajibkan RLS aktif
ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.infrastructure_assets;
CREATE POLICY "Allow public read access" ON public.infrastructure_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.infrastructure_assets;
CREATE POLICY "Allow public insert access" ON public.infrastructure_assets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.infrastructure_assets;
CREATE POLICY "Allow public update access" ON public.infrastructure_assets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.infrastructure_assets;
CREATE POLICY "Allow public delete access" ON public.infrastructure_assets FOR DELETE USING (true);

-- Memberitahu PostgREST untuk memuat ulang skema cache API Supabase
NOTIFY pgrst, 'reload schema';
