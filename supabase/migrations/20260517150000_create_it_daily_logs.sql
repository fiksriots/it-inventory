-- Create IT Daily Logs (Laporan Kerja Harian) Table
CREATE TABLE IF NOT EXISTS public.it_daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_name TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Selesai' CHECK (status IN ('Selesai', 'Pending', 'Terhambat')),
    image_url TEXT,
    technician_name TEXT NOT NULL DEFAULT 'Tim IT Support',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.it_daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can select daily logs" 
    ON public.it_daily_logs FOR SELECT 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can insert daily logs" 
    ON public.it_daily_logs FOR INSERT 
    WITH CHECK (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can update daily logs" 
    ON public.it_daily_logs FOR UPDATE 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can delete daily logs" 
    ON public.it_daily_logs FOR DELETE 
    USING (((SELECT auth.role()) = 'authenticated'));
