-- Menambahkan kolom image_url untuk menyimpan bukti dokumentasi perawatan
ALTER TABLE public.infrastructure_maintenance_logs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.computer_maintenance_logs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Memberitahu PostgREST untuk memuat ulang skema cache API Supabase
NOTIFY pgrst, 'reload schema';
