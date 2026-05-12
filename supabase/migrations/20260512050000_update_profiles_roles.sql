-- Menambahkan kolom hak akses (role) pada tabel profil pengguna
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Staff';

-- Menonaktifkan pembatasan Row Level Security pada tabel profil
-- untuk memudahkan kueri pengelolaan pengguna tingkat tim oleh Administrator
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Memberikan hak akses penuh kepada peran standar sistem
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- Memberi tahu cache PostgREST agar memuat ulang skema tabel
NOTIFY pgrst, 'reload schema';
