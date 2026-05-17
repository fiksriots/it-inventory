-- Membuat tabel riwayat perawatan (maintenance logs) untuk komputer / PC
CREATE TABLE IF NOT EXISTS public.computer_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_title TEXT NOT NULL, -- e.g. 'Maintenance 1', 'Maintenance 2'
  notes TEXT,
  performed_by TEXT,
  status_after TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memberikan hak akses penuh kepada seluruh peran standar sistem
GRANT ALL ON TABLE public.computer_maintenance_logs TO anon, authenticated, service_role;

-- Mengaktifkan RLS dan menyediakan kebijakan akses penuh
ALTER TABLE public.computer_maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.computer_maintenance_logs;
CREATE POLICY "Allow public read access" ON public.computer_maintenance_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.computer_maintenance_logs;
CREATE POLICY "Allow public insert access" ON public.computer_maintenance_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.computer_maintenance_logs;
CREATE POLICY "Allow public update access" ON public.computer_maintenance_logs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.computer_maintenance_logs;
CREATE POLICY "Allow public delete access" ON public.computer_maintenance_logs FOR DELETE USING (true);

-- Memberitahu PostgREST untuk memuat ulang skema cache API Supabase
NOTIFY pgrst, 'reload schema';
