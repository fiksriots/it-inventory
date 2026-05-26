-- Create IT notes table
CREATE TABLE IF NOT EXISTS public.it_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'default',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_todo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.it_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can select notes" ON public.it_notes FOR SELECT USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can insert notes" ON public.it_notes FOR INSERT WITH CHECK (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can update notes" ON public.it_notes FOR UPDATE USING (((SELECT auth.role()) = 'authenticated'));
CREATE POLICY "Authenticated users can delete notes" ON public.it_notes FOR DELETE USING (((SELECT auth.role()) = 'authenticated'));
