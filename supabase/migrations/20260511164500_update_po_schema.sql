-- Add extra fields to purchase_orders
ALTER TABLE purchase_orders 
ADD COLUMN admin_fee DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN shipping_fee DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN discount_amount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN payment_method TEXT,
ADD COLUMN subtotal DECIMAL(15, 2) DEFAULT 0;
