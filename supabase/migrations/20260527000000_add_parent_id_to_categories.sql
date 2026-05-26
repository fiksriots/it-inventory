-- Menambahkan kolom parent_id ke tabel categories untuk mendukung sub-kategori
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
