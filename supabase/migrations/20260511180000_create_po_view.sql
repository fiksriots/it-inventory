-- View to simplify searching and filtering for PO list
CREATE OR REPLACE VIEW purchase_orders_view AS
SELECT 
    po.*,
    s.name as supplier_name,
    l.name as location_name
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN locations l ON po.location_id = l.id;
