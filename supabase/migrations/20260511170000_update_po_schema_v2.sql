-- Update purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS requested_by TEXT,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS supplier_type TEXT DEFAULT 'Offline';

-- Update po_items table
ALTER TABLE po_items 
ADD COLUMN IF NOT EXISTS custom_item_name TEXT,
ADD COLUMN IF NOT EXISTS item_link TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'PCS';
