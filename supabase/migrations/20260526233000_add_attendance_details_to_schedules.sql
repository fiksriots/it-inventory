-- Menambahkan kolom jam masuk, jam keluar, jam lembur, dan catatan lembur ke tabel it_schedules
ALTER TABLE public.it_schedules ADD COLUMN IF NOT EXISTS check_in_time TEXT;
ALTER TABLE public.it_schedules ADD COLUMN IF NOT EXISTS check_out_time TEXT;
ALTER TABLE public.it_schedules ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0;
ALTER TABLE public.it_schedules ADD COLUMN IF NOT EXISTS overtime_notes TEXT;
