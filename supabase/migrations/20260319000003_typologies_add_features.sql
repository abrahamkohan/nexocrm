-- Agregar campo features a tipologías
-- Permite cargar características por unidad como array de texto
-- Ejemplo: ["Balcón", "Vista al río", "Cocina equipada", "Placard"]

ALTER TABLE typologies
ADD COLUMN features text[] DEFAULT '{}';
