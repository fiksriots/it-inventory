-- 1. Tambahkan kolom condition ke item_stocks
ALTER TABLE item_stocks ADD COLUMN condition TEXT DEFAULT 'Normal';

-- 2. Update data awal: Ambil kondisi dari tabel items (jika ada) ke item_stocks
UPDATE item_stocks s
SET condition = i.condition
FROM items i
WHERE s.item_id = i.id;

-- 3. Ubah constraint Unique: Sekarang unik berdasarkan item + lokasi + kondisi
ALTER TABLE item_stocks DROP CONSTRAINT IF EXISTS item_stocks_item_id_location_id_key;
ALTER TABLE item_stocks ADD CONSTRAINT item_stocks_item_loc_cond_unique UNIQUE (item_id, location_id, condition);

-- 4. (Opsional) Hapus kolom condition di tabel items karena sudah tidak akurat di sana
-- ALTER TABLE items DROP COLUMN condition; 
-- Kita biarkan dulu agar tidak merusak query yang sedang berjalan, tapi nanti tidak akan kita gunakan.
