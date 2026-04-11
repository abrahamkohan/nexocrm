# 🗄️ Database Schema

> Schema completo de la tabla `market_digests`

---

## 📋 Tabla: `market_digests`

Almacena los análisis de mercado generados diariamente por cada consultant.

### Definición SQL

```sql
CREATE TABLE IF NOT EXISTS market_digests (
  -- Identificación
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Multi-tenant (obligatorio)
  consultant_id   UUID NOT NULL,
  
  -- Fecha del análisis (único por consultant/día)
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Contenido generado
  summary         TEXT,                     -- Resumen ejecutivo
  titulares       JSONB DEFAULT '[]',       -- Array de noticias
  senal_inversor  TEXT,                     -- Consejo práctico
  queries         TEXT[],                   -- Qué se buscó
  
  -- Estado
  status          TEXT DEFAULT 'published'  -- published | draft | archived
);

-- Constraint: Un digest por día por consultant
ALTER TABLE market_digests 
  ADD CONSTRAINT unique_consultant_fecha 
  UNIQUE (consultant_id, fecha);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS market_digests_consultant_fecha
  ON market_digests(consultant_id, fecha DESC);
```

---

## 📊 Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Identificador único del digest |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp de creación |
| `consultant_id` | UUID | No | - | UUID del consultant (tenant) |
| `fecha` | DATE | No | `CURRENT_DATE` | Fecha del análisis (YYYY-MM-DD) |
| `summary` | TEXT | Sí | `NULL` | Resumen ejecutivo del mercado |
| `titulares` | JSONB | Sí | `'[]'` | Array de noticias con título, URL, fuente |
| `senal_inversor` | TEXT | Sí | `NULL` | Consejo práctico para inversores |
| `queries` | TEXT[] | Sí | `NULL` | Array de términos de búsqueda usados |
| `status` | TEXT | No | `'published'` | Estado: published, draft, archived |

---

## 🔒 Row Level Security (RLS)

### Política de Aislamiento

```sql
-- Habilitar RLS
ALTER TABLE market_digests ENABLE ROW LEVEL SECURITY;

-- Política: Usuario solo ve digests de su consultant
CREATE POLICY "market_digests_isolation"
  ON market_digests 
  FOR ALL
  USING (
    consultant_id IN (
      SELECT consultant_id 
      FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
```

### Explicación

- `auth.uid()` → ID del usuario logueado (JWT)
- `user_roles` → Tabla que vincula usuario con consultant
- Resultado: Usuario solo puede ver/crear/editar digests de su propia inmobiliaria

---

## 📈 Índices

### Índice Principal

```sql
CREATE INDEX market_digests_consultant_fecha
  ON market_digests(consultant_id, fecha DESC);
```

**Uso:** Optimiza la consulta del digest de hoy y el histórico.

**Query que usa este índice:**
```sql
SELECT * FROM market_digests 
WHERE consultant_id = 'uuid' 
  AND fecha = '2026-04-11';
```

---

## 💾 Ejemplos de Datos

### Insert (Manual)

```sql
INSERT INTO market_digests (
  consultant_id,
  fecha,
  summary,
  titulares,
  senal_inversor,
  queries,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '2026-04-11',
  'El mercado inmobiliario de Paraguay muestra crecimiento sostenido en consultas de unidades off-plan.',
  '[
    {"titulo": "Inversiones en CIT Luque superan USD 40M", "url": "https://abc.com.py/noticia", "fuente": "ABC Color"},
    {"titulo": "Demanda de alquileres sube 8%", "url": "https://lanacion.com.py/noticia", "fuente": "La Nación"}
  ]'::jsonb,
  'Momento para posicionar off-plan en Luque antes de Q2',
  ARRAY['mercado inmobiliario Paraguay', 'real estate inversión'],
  'published'
);
```

### Upsert (Edge Function)

```sql
INSERT INTO market_digests (
  consultant_id,
  fecha,
  summary,
  titulares,
  senal_inversor,
  queries,
  status
) VALUES (
  'uuid-aqui',
  '2026-04-11',
  'Resumen...',
  '[...]'::jsonb,
  'Señal...',
  ARRAY['query1', 'query2'],
  'published'
)
ON CONFLICT (consultant_id, fecha) 
DO UPDATE SET
  summary = EXCLUDED.summary,
  titulares = EXCLUDED.titulares,
  senal_inversor = EXCLUDED.senal_inversor,
  queries = EXCLUDED.queries,
  status = EXCLUDED.status,
  created_at = NOW();
```

### Select (Digest de hoy)

```sql
SELECT * FROM market_digests 
WHERE consultant_id = '550e8400-e29b-41d4-a716-446655440000'
  AND fecha = CURRENT_DATE;
```

### Select (Histórico)

```sql
SELECT * FROM market_digests 
WHERE consultant_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY fecha DESC
LIMIT 10;
```

### Update (Cambiar status)

```sql
UPDATE market_digests 
SET status = 'archived'
WHERE id = 'uuid-del-digest';
```

### Delete (Eliminar digest)

```sql
DELETE FROM market_digests 
WHERE consultant_id = 'uuid-aqui'
  AND fecha = '2026-04-11';
```

---

## 📊 Estructura JSON: Titulares

### Schema JSONB

```typescript
interface Titular {
  titulo: string;   // Título de la noticia
  url: string;      // URL original  
  fuente: string;   // Nombre del medio (ABC Color, La Nación, etc.)
}

type Titulares = Titular[];
```

### Ejemplo

```json
[
  {
    "titulo": "Inversiones en CIT Luque superan USD 40M en Q1",
    "url": "https://www.abc.com.py/economia/inversiones-cit-luque-2026",
    "fuente": "ABC Color"
  },
  {
    "titulo": "Demanda de alquileres sube 8% en zona norte de Asunción",
    "url": "https://www.lanacion.com.py/inmobiliario/alquileres-zona-norte",
    "fuente": "La Nación"
  },
  {
    "titulo": "Paraguay lidera rentabilidad del Cono Sur",
    "url": "https://www.ultimahora.com/paraguay-rentabilidad-cono-sur",
    "fuente": "Última Hora"
  }
]
```

### Query JSONB

```sql
-- Buscar titulares que contengan cierta palabra
SELECT * FROM market_digests 
WHERE titulares @> '[{"titulo": "Luque"}]'::jsonb;

-- Contar número de titulares
SELECT jsonb_array_length(titulares) as cantidad 
FROM market_digests 
WHERE id = 'uuid-del-digest';

-- Extraer solo URLs
SELECT jsonb_agg(t->>'url') as urls
FROM market_digests,
     jsonb_array_elements(titulares) as t
WHERE id = 'uuid-del-digest';
```

---

## 🔗 Relaciones

### Con Tabla `consultants`

```
market_digests.consultant_id → consultants.uuid
```

**Nota:** No hay Foreign Key constraint (igual que el resto del sistema).

### Con Tabla `user_roles`

```
market_digests.consultant_id → user_roles.consultant_id
```

Usado en la política RLS para determinar qué digests puede ver el usuario.

---

## 📈 Queries Útiles

### Dashboard Stats

```sql
-- Cantidad de digests por consultant
SELECT 
  consultant_id,
  COUNT(*) as total_digests,
  MIN(fecha) as primera_fecha,
  MAX(fecha) as ultima_fecha
FROM market_digests
GROUP BY consultant_id;

-- Digests por mes
SELECT 
  DATE_TRUNC('month', fecha) as mes,
  COUNT(*) as cantidad
FROM market_digests
GROUP BY mes
ORDER BY mes DESC;

-- Consultants más activos
SELECT 
  consultant_id,
  COUNT(*) as digests_generados
FROM market_digests
WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY consultant_id
ORDER BY digests_generados DESC
LIMIT 10;
```

### Mantenimiento

```sql
-- Archivar digests antiguos (más de 1 año)
UPDATE market_digests 
SET status = 'archived'
WHERE fecha < CURRENT_DATE - INTERVAL '1 year';

-- Eliminar digests de consultants inactivos
DELETE FROM market_digests 
WHERE consultant_id NOT IN (
  SELECT uuid FROM consultants WHERE activo = true
);

-- Tamaño de la tabla
SELECT pg_size_pretty(pg_total_relation_size('market_digests'));
```

---

## 🔄 Backup y Restore

### Exportar

```bash
# Exportar tabla completa
pg_dump -h db.xxx.supabase.co -U postgres -t market_digests > market_digests_backup.sql

# Exportar solo datos de un consultant
psql -h db.xxx.supabase.co -U postgres -c "
  COPY (
    SELECT * FROM market_digests 
    WHERE consultant_id = 'uuid-aqui'
  ) TO STDOUT WITH CSV HEADER
" > digest_export.csv
```

### Importar

```sql
-- Importar desde CSV
COPY market_digests (
  consultant_id, fecha, summary, titulares, 
  senal_inversor, queries, status
)
FROM '/path/to/digest_export.csv'
WITH CSV HEADER;
```

---

## 📝 Notas de Diseño

### Por qué no Foreign Key

- El sistema usa `consultant_id` como UUID sin FK constraint
- Esto permite flexibilidad si se migra el consultant
- Consistente con el resto de las tablas del sistema

### Por qué JSONB para titulares

- Estructura flexible (pueden agregarse campos como `relevancia`, `categoria`)
- Queryable con operadores JSONB (`@>`, `->>`, etc.)
- Más eficiente que tabla separada para N titulares por digest

### Por qué UNIQUE(consultant_id, fecha)

- Garantiza un digest por día por inmobiliaria
- Permite upsert simple con `ON CONFLICT`
- Previene duplicados accidentales

### Por qué status

- `published`: Visible para usuarios
- `draft`: En edición (futuro feature)
- `archived`: Oculto pero preservado

---

[← Volver al README](./README.md)
