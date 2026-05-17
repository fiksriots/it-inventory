-- Create Project Planning Tables

CREATE TABLE IF NOT EXISTS public.it_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.it_project_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.it_projects(id) ON DELETE CASCADE,
    log_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    content TEXT NOT NULL,
    progress_percent_after INTEGER NOT NULL CHECK (progress_percent_after >= 0 AND progress_percent_after <= 100),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_project_logs ENABLE ROW LEVEL SECURITY;

-- Highly optimized RLS policies with cached subqueries
CREATE POLICY "Authenticated users can select projects" 
    ON public.it_projects FOR SELECT 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can insert projects" 
    ON public.it_projects FOR INSERT 
    WITH CHECK (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can update projects" 
    ON public.it_projects FOR UPDATE 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can delete projects" 
    ON public.it_projects FOR DELETE 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can select project logs" 
    ON public.it_project_logs FOR SELECT 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can insert project logs" 
    ON public.it_project_logs FOR INSERT 
    WITH CHECK (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can update project logs" 
    ON public.it_project_logs FOR UPDATE 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can delete project logs" 
    ON public.it_project_logs FOR DELETE 
    USING (((SELECT auth.role()) = 'authenticated'));

-- Automatically register 'project-documentation' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documentation', 'project-documentation', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage objects bucket 'project-documentation'
CREATE POLICY "Public read access on project docs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-documentation');

CREATE POLICY "Authenticated write access on project docs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'project-documentation' AND ((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated delete access on project docs"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'project-documentation' AND ((SELECT auth.role()) = 'authenticated'));

-- Create Project RAB (Rencana Anggaran Biaya) Table
CREATE TABLE IF NOT EXISTS public.it_project_rab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.it_projects(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'pcs',
    price_per_unit NUMERIC NOT NULL DEFAULT 0 CHECK (price_per_unit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_project_rab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select rab" 
    ON public.it_project_rab FOR SELECT 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can insert rab" 
    ON public.it_project_rab FOR INSERT 
    WITH CHECK (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can update rab" 
    ON public.it_project_rab FOR UPDATE 
    USING (((SELECT auth.role()) = 'authenticated'));

CREATE POLICY "Authenticated users can delete rab" 
    ON public.it_project_rab FOR DELETE 
    USING (((SELECT auth.role()) = 'authenticated'));
