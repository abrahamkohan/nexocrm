-- Columna para recordatorio anticipado (30 min antes del vencimiento)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS advance_notified boolean NOT NULL DEFAULT false;
