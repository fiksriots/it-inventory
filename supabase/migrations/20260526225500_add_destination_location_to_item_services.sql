-- Menambahkan kolom destination_location_id ke tabel item_services untuk mencatat lokasi tujuan setelah service selesai
ALTER TABLE public.item_services ADD COLUMN IF NOT EXISTS destination_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
