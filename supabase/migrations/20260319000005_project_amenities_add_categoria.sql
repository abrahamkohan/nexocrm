-- Agregar categoria a amenities del proyecto
-- Permite agrupar amenities en Interior / Edificio en el frontend

ALTER TABLE project_amenities
ADD COLUMN categoria text DEFAULT 'edificio';
