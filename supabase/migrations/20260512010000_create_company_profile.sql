-- Create company_profile table
CREATE TABLE IF NOT EXISTS company_profile (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'IT Inventory',
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_row_only CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read company profile"
ON company_profile FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update/insert (admin)
CREATE POLICY "Allow authenticated users to insert company profile"
ON company_profile FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update company profile"
ON company_profile FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert initial data if not exists
INSERT INTO company_profile (id, name)
VALUES (1, 'IT Inventory System')
ON CONFLICT (id) DO NOTHING;
