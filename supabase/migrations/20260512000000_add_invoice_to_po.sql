-- Add invoice_url to purchase_orders
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;
