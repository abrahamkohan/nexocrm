-- Agregar galería de imágenes y campo floor_plan separado a tipologías
-- images[]: rutas en storage para renders/fotos de la unidad (múltiples)
-- floor_plan: ruta en storage para el plano de la unidad (único)

ALTER TABLE typologies
ADD COLUMN images text[] DEFAULT '{}';

ALTER TABLE typologies
ADD COLUMN floor_plan text;

-- Migrar datos existentes: floor_plan_path → floor_plan
UPDATE typologies
SET floor_plan = floor_plan_path
WHERE floor_plan_path IS NOT NULL AND floor_plan IS NULL;
