-- Membuat tabel item_services untuk mencatat riwayat perbaikan/maintenance perangkat
CREATE TABLE item_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number TEXT UNIQUE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Lokasi pengambilan barang rusak
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL, -- Vendor / tempat service
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Keluhan dan Kondisi
  problem_description TEXT,
  initial_condition TEXT DEFAULT 'Rusak', -- Kondisi awal sebelum diservice
  final_condition TEXT, -- Kondisi akhir setelah diservice (misal: Normal)
  
  -- Data Pengiriman
  sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by_name TEXT, -- Nama kurir/ekspedisi/staf pengirim
  service_doc_url TEXT, -- Dokumen tanda terima perbaikan/surat jalan
  
  -- Status & Biaya
  status TEXT DEFAULT 'Proses Service', -- 'Proses Service', 'Selesai', 'Dibatalkan'
  cost DECIMAL(15, 2) DEFAULT 0,
  invoice_url TEXT, -- Bukti faktur/invoice setelah selesai
  
  -- Waktu Penyelesaian
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Catatan teknisi/hasil perbaikan
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menonaktifkan Row Level Security agar konsisten dengan tabel lain di skema awal
ALTER TABLE item_services DISABLE ROW LEVEL SECURITY;

-- Memberikan akses penuh ke peran standar
GRANT ALL ON TABLE public.item_services TO anon, authenticated, service_role;

