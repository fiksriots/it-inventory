-- Membuat tabel computers untuk mendata aset PC/Laptop beserta spesifikasi teknis
CREATE TABLE computers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- Nama Komputer / Hostname (Contoh: PC-FINANCE-01)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  user_assigned TEXT, -- Nama staf atau penanggung jawab perangkat
  
  -- Spesifikasi Teknis
  ip_address TEXT,
  operating_system TEXT,
  processor TEXT,
  ram TEXT, -- Contoh: 16GB DDR4
  storage TEXT, -- Contoh: 512GB SSD NVMe
  
  -- Status & Pemeliharaan
  status TEXT DEFAULT 'Aktif', -- 'Aktif', 'Maintenance', 'Rusak', 'Pensiun'
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menonaktifkan pembatasan Row Level Security agar konsisten dengan tabel lain
-- dan memudahkan kueri dari antarmuka klien
ALTER TABLE computers DISABLE ROW LEVEL SECURITY;

-- Memberikan hak akses penuh kepada role standar
GRANT ALL ON TABLE public.computers TO anon, authenticated, service_role;

-- Memaksa pemuatan ulang cache skema API PostgREST
NOTIFY pgrst, 'reload schema';
