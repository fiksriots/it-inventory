-- Menambahkan kolom parent_id ke tabel locations untuk mendukung hirarki sub-lokasi
ALTER TABLE locations 
ADD COLUMN parent_id UUID REFERENCES locations(id) ON DELETE SET NULL;
