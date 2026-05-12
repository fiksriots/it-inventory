-- Menambahkan 5 parameter tingkat enterprise pada tabel computers jika belum ada
ALTER TABLE public.computers 
  ADD COLUMN IF NOT EXISTS mac_address TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS remote_support_id TEXT;

-- Memastikan hak akses tetap berlaku utuh untuk kolom-kolom baru
GRANT ALL ON TABLE public.computers TO anon, authenticated, service_role;

-- Memberitahu PostgREST untuk memuat ulang cache skema API
NOTIFY pgrst, 'reload schema';
