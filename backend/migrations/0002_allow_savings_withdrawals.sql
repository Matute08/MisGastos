ALTER TABLE savings_records
  DROP CONSTRAINT IF EXISTS savings_records_status_check;

ALTER TABLE savings_records
  ADD CONSTRAINT savings_records_status_check
  CHECK (status IN ('ahorrado', 'usado', 'retirado'));
