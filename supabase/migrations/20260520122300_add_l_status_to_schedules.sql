-- Update the CHECK constraint on it_schedules to allow 'L' (Libur)

ALTER TABLE public.it_schedules DROP CONSTRAINT IF EXISTS it_schedules_status_check;

ALTER TABLE public.it_schedules ADD CONSTRAINT it_schedules_status_check 
CHECK (status IN ('M', 'C', 'DP', 'PH', 'L'));

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
