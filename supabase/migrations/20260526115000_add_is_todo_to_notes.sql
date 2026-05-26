-- Add is_todo column to it_notes
ALTER TABLE public.it_notes ADD COLUMN IF NOT EXISTS is_todo BOOLEAN NOT NULL DEFAULT FALSE;
