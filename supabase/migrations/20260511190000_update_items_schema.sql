-- Add code to categories for SKU generation
ALTER TABLE categories ADD COLUMN IF NOT EXISTS code TEXT;

-- Add condition to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Baru';
