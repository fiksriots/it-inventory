-- Trigger function to delete item_stocks records when quantity <= 0
CREATE OR REPLACE FUNCTION delete_empty_item_stocks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    DELETE FROM item_stocks WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS check_empty_item_stocks ON item_stocks;
CREATE TRIGGER check_empty_item_stocks
AFTER INSERT OR UPDATE OF quantity ON item_stocks
FOR EACH ROW
EXECUTE FUNCTION delete_empty_item_stocks();
