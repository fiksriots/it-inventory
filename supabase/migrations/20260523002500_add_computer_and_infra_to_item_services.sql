-- Menambahkan kolom computer_id dan infrastructure_asset_id ke tabel item_services
ALTER TABLE public.item_services ADD COLUMN IF NOT EXISTS computer_id UUID REFERENCES public.computers(id) ON DELETE SET NULL;
ALTER TABLE public.item_services ADD COLUMN IF NOT EXISTS infrastructure_asset_id UUID REFERENCES public.infrastructure_assets(id) ON DELETE SET NULL;

-- Memastikan kolom item_id dapat bernilai NULL (karena barang service bisa berupa Aset PC/Infrastruktur langsung tanpa merujuk ke Master Barang)
ALTER TABLE public.item_services ALTER COLUMN item_id DROP NOT NULL;
