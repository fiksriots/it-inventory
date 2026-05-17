-- Create table for IT Team schedules
CREATE TABLE IF NOT EXISTS public.it_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name TEXT NOT NULL, -- e.g. 'Fikri', 'Raffa'
  schedule_date DATE NOT NULL, -- date of the schedule
  status TEXT NOT NULL CHECK (status IN ('M', 'C', 'DP', 'PH')), -- M=Masuk, C=Cuti, DP=Day Off/Extra, PH=Public Holiday
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint to prevent duplicate schedules for the same member on the same date
ALTER TABLE public.it_schedules ADD CONSTRAINT unique_member_date UNIQUE (member_name, schedule_date);

-- Grant privileges
GRANT ALL ON TABLE public.it_schedules TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.it_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (Cached Subquery Pattern for high performance)
DROP POLICY IF EXISTS "Allow authenticated users full access on it_schedules" ON public.it_schedules;
CREATE POLICY "Allow authenticated users full access on it_schedules"
ON public.it_schedules FOR ALL
TO authenticated
USING (((SELECT auth.role()) = 'authenticated'))
WITH CHECK (((SELECT auth.role()) = 'authenticated'));

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
