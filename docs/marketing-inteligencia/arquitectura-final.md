# MÓDULO MARKETING IA — ARQUITECTURA FINAL

**CRM SaaS Inmobiliario — NexoCRM**  
**Estado: FINAL · LISTO PARA IMPLEMENTACIÓN**  
**Versión: 3.1 — Validada con ajustes de producción**

---

## 1. OBJETIVO DEL MÓDULO

Motor de contenido inteligente para brokers inmobiliarios.

Transforma el CRM en:

- **Inteligencia** → análisis diario del mercado
- **Contenido** → Reel, Post, WhatsApp generados por IA
- **Adquisición** → blog público SEO + CTA de conversión

Todo el contenido nace de un único origen: el digest de mercado.

---

## 2. PRINCIPIO CENTRAL

👉 **TODO el contenido nace desde un DIGEST**

No existe:
- contenido suelto
- generación independiente
- mensaje de WhatsApp sin digest asociado

Cada pieza de contenido generado (Reel, Post, WhatsApp) tiene un `digest_id` que lo vincula al análisis original.

---

## 3. IDIOMA

Regla general:

| Elemento | Idioma |
|----------|--------|
| Interfaz del CRM (botones, menú, páginas) | Español |
| Contenido generado por IA (Reel, Post, WhatsApp, blog) | Español |
| Disclaimer legal | Español |
| CTA del blog | Español |
| Queries de búsqueda (Tavily) | Mixto: inglés para fuentes internacionales, español para fuentes locales |
| Prompts de IA | Español |

**Audiencia objetivo**: clientes e inversores que hablan español.

---

## 4. MODELO DE DATOS

### 4.1 market_digests

Análisis del mercado generado diariamente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| consultant_id | uuid | FK a consultants (multi-tenant) |
| created_at | timestamptz | Fecha de creación |
| fecha | date | Fecha del análisis (1 por día por consultant) |
| summary | text | Resumen ejecutivo del mercado |
| titulares | jsonb | `[{"titulo": "...", "url": "...", "fuente": "..."}]` |
| senal_inversor | text | Señal para el inversor |
| queries | text[] | Queries usadas para generar este digest (auditoría) |
| status | text | `draft` o `published` |
| blog_published_at | timestamptz | Null = no visible en blog. Con fecha = visible |
| quality | text | `ok` o `low` |

**Nota**: `blog_published_at` reemplaza a `is_public`. Un timestamp da más información que un booleano: cuándo se publicó, permite ordenar, y permite despublicar seteando a null.

### 4.2 digest_contents

Contenido generado a partir de un digest.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| digest_id | uuid | FK a market_digests |
| consultant_id | uuid | FK a consultants (denormalizado para RLS) |
| type | text | `reel`, `post`, `whatsapp` (text, no enum, para flexibilidad futura) |
| content | jsonb | Contenido generado por IA (estructura varía por tipo, ver sección 7.3) |
| edited_content | jsonb | Versión editada por el usuario (nullable, misma estructura que content) |
| raw_response | text | Respuesta completa de la IA sin procesar (para debug y auditoría) |
| status | text | `draft`, `approved` o `error` |
| error_message | text | Mensaje de error si status = error (nullable) |
| model | text | Modelo usado (ej: `groq/llama-3.3-70b-versatile`) |
| prompt_version | text | Versión del prompt (ej: `v1`) |
| created_at | timestamptz | Fecha de generación |

**Regla de lectura**: si `edited_content` no es null → usar `edited_content`. Si es null → usar `content`.

**Regla de escritura**: nunca sobrescribir `content`. Si el usuario regenera, se crea un nuevo registro con `status = draft`. La auditoría se mantiene siempre.

### 4.3 consultant_settings

Configuración del módulo por broker.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| consultant_id | uuid | PK, FK a consultants |
| market_queries | jsonb | Queries de búsqueda activas |
| pais | text | País de análisis (default: "Paraguay") |
| idioma | text | Idioma del contenido generado (default: "es") |
| objetivo | text | Enfoque del contenido (default: "inversion") |
| created_at | timestamptz | Fecha de creación |
| updated_at | timestamptz | Última modificación |

**Regla de creación**: se auto-crea con defaults al primer uso del módulo. Si no existe registro, la Edge Function usa los defaults hardcodeados como fallback (nunca fallar por falta de configuración).

---

## 5. VALORES POR DEFECTO

Cuando un consultant nuevo accede al módulo por primera vez, se crea `consultant_settings` con:

```
pais: "Paraguay"
idioma: "es"
objetivo: "inversion"
market_queries: [
  "Paraguay economic growth foreign investment 2026",
  "Paraguay real estate market opportunities",
  "Asunción infrastructure development projects",
  "Paraguay tax benefits foreign investors",
  "Paraguay stability ranking Latin America"
]
```

Las queries están en inglés porque buscan fuentes internacionales, pero el contenido generado siempre se produce en español.

**Migración de datos existentes**: en el primer acceso con la nueva arquitectura, leer las queries de `localStorage`, guardarlas en `consultant_settings.market_queries`, y dejar de usar localStorage definitivamente. Migración one-time, no permanente.

---

## 6. GENERACIÓN DE DIGEST

### Flujo

1. Leer `market_queries` desde `consultant_settings` (DB)
2. Si no existe → usar defaults
3. Enviar queries a Tavily → obtener noticias
4. Enviar noticias a Groq → generar análisis
5. Guardar en `market_digests`

### Reglas

- **Unicidad**: 1 digest por día por consultant
- **Regeneración**: UPSERT por fecha. Si ya existe un digest para hoy, se sobrescribe con `status = draft`
- **Protección de blog**: si el digest está publicado en el blog (`blog_published_at` no null), debe despublicarse antes de regenerar. La Edge Function verifica esto y devuelve error si no se cumple.

---

## 7. GENERACIÓN DE CONTENIDO

### 7.1 Arquitectura

Una única Edge Function: `content-generator`

Recibe `type` como parámetro y adapta el prompt según el tipo. No hay tres funciones separadas.

### 7.2 Input

```
digest_id
type (reel | post | whatsapp)
pais (de consultant_settings)
idioma (de consultant_settings)
objetivo (de consultant_settings)
```

### 7.3 Output por tipo (JSON estructurado)

**Reel**:
```json
{
  "hook": "Texto en pantalla (0-3 segundos)",
  "guion": "Lo que se dice en el video",
  "visual": "Lo que se muestra visualmente",
  "cta": "Texto final en pantalla con llamado a la acción"
}
```

**Post**:
```json
{
  "texto": "Contenido principal del post para Instagram",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}
```

**WhatsApp**:
```json
{
  "mensaje": "Mensaje corto, tono natural, orientado a generar conversación"
}
```

**Regla del WhatsApp**: el mensaje no debe superar los 500 caracteres para funcionar correctamente con el formato `wa.me/?text=...`.

### 7.4 Guardado

Siempre se guarda con `status = draft`. No se genera contenido sin persistirlo.

Cuando el usuario lo usa (copia, aprueba), se cambia a `status = approved`.

### 7.5 Edición

El usuario puede modificar el contenido generado. Se guarda en `edited_content` manteniendo la misma estructura JSON.

**Regla de lectura**: si `edited_content` existe → usar `edited_content`. Si no → usar `content`.

---

## 8. CONTROL DE CALIDAD

### 8.1 Contenido débil

Si el análisis generado es genérico o poco específico → marcar como `quality = low`.

La UI muestra una advertencia: *"El análisis generado puede ser demasiado genérico. Considerá regenerarlo más tarde o revisarlo antes de publicar."*

### 8.2 Contenido riesgoso (LEGAL)

El prompt de Groq debe incluir una lista de palabras y frases prohibidas:

- "garantizado"
- "sin riesgo"
- "rentabilidad asegurada"
- "ganancia segura"
- "retorno garantizado"
- "inversión sin pérdida"

Si la IA incluye alguna de estas frases, el sistema debe:
1. No bloquear el contenido (no errores duros)
2. Marcarlo con una advertencia visible en la UI
3. Permitir al usuario editarlo o regenerarlo

### 8.3 Disclaimer obligatorio

Todo contenido generado por IA debe incluir este disclaimer:

> "Contenido generado con IA. Consultá con un asesor profesional antes de tomar decisiones de inversión."

Se agrega:
- Al final del post de blog
- Al final del Post de Instagram
- Dentro del mensaje de WhatsApp (si no supera el límite de caracteres)
- No se incluye en el Reel (el CTA reemplaza este rol)

---

## 9. PUBLICACIÓN

### 9.1 Publicación interna (CRM)

Campo: `status`

- `draft` → editable, no visible para otros
- `published` → visible dentro del CRM para el equipo

Un digest publicado internamente NO es lo mismo que publicado en el blog.

### 9.2 Publicación en blog (público)

Campo: `blog_published_at`

- `null` → no visible en el blog
- con fecha → visible en `/mercado`

Publicar en el blog es una acción explícita e intencional del broker. No es automático.

### 9.3 Inmutabilidad

Una vez que un digest se publica en el blog (`blog_published_at` no null), su contenido no se puede editar.

Si hay un error:
1. Despublicar (setear `blog_published_at` a null)
2. Regenerar o editar
3. Volver a publicar

Esto protege la integridad de URLs indexadas por Google.

---

## 10. BLOG PÚBLICO (SPRING SEPARADO)

> **⚠️ IMPORTANTE**: El blog público es un sprint propio, no una fase más del MVP. Las fases 1-3 (tablas, Edge Function, UI de contenido) validan el producto. El blog viene después con su propio diseño y testing.

### 10.1 Rutas

```
/mercado                  → listado de digests publicados
/mercado/2026-04-11       → detalle por fecha
```

Formato de fecha en URL: `YYYY-MM-DD` (ISO 8601).

Rutas públicas: no requieren autenticación.

### 10.2 Listado (`/mercado`)

- Mostrar digests donde `blog_published_at` no sea null
- Ordenar por `blog_published_at` DESC
- Mostrar: fecha, título (resumen truncado), calidad

### 10.3 Detalle (`/mercado/YYYY-MM-DD`)

Contenido visible:
- Resumen ejecutivo (`summary`)
- Titulares con links reales (`titulares`)
- Señal para el inversor (`senal_inversor`)
- Disclaimer legal al final

### 10.4 CTA

Al final de cada post:

> **"¿Querés invertir en Paraguay? Contactanos"**

Con link al WhatsApp del broker o formulario de contacto.

### 10.5 SEO

Cada post debe tener metadata:

| Campo | Contenido |
|-------|-----------|
| title | "Inteligencia de Mercado Paraguay — {fecha}" |
| description | Primeras 150 caracteres del `summary` |
| og:title | Igual que title |
| og:description | Igual que description |
| og:image | Imagen por defecto del broker o genérica del módulo |

### 10.6 Consideraciones técnicas

- Las rutas públicas necesitan políticas RLS para `anonymous`
- `/mercado` sin consultant identifier funcionará en single-tenant. Cuando se escale a multi-tenant, se necesitará `/mercado/{slug-del-broker}`
- SSR recomendado para SEO (React Helmet o metadata en server)

---

## 11. WHATSAPP

### Flujo

1. Generar mensaje desde el digest
2. Mostrar resultado en la UI
3. Botón "Copiar mensaje" → copia al portapapeles
4. Botón "Abrir WhatsApp" → abre `https://wa.me/?text=MENSAJE_CODIFICADO`

El usuario elige a quién enviar el mensaje. No se automatiza el envío.

### Reglas

- Mensaje máximo: 500 caracteres
- Si el contenido generado supera el límite → truncar inteligentemente manteniendo el CTA
- Tono: natural, conversacional, orientado a generar respuesta

---

## 12. EXPERIENCIA DE USUARIO

### Flujo principal

```
1. Generar digest
      ↓
2. Revisar contenido
      ↓
3. Publicar internamente
      ↓
4. Generar contenido derivado
   ├── Generar Reel
   ├── Generar Post
   ├── Generar WhatsApp
   └── Generar todo
      ↓
5. Usar contenido (copiar, abrir WhatsApp)
      ↓
6. Publicar en blog (acción explícita, sprint separado)
```

### Principios de la UI

- Todo en español
- No generar contenido automáticamente — siempre bajo acción del usuario
- Siempre mostrar de qué digest viene el contenido
- Botones claros con acción explícita
- Disclaimer visible en todo contenido generado

---

## 13. GENERACIÓN MASIVA

Botón **"Generar todo"**: ejecuta Reel + Post + WhatsApp de forma secuencial con un delay entre cada llamada para evitar rate limits de Groq.

**Implementación**: no hacer las 3 llamadas en paralelo. El tier gratuito de Groq (30 req/min) puede rechazar llamadas simultáneas. Secuencial con 1-2 segundos de delay entre cada una.

Los botones individuales (Generar Reel, Generar Post, Generar WhatsApp) siguen existiendo para regenerar uno solo si no le gustó al usuario.

---

## 14. EDGE FUNCTIONS

### Funciones existentes (sin cambios)

| Función | Estado |
|---------|--------|
| `market-digest` | Funciona correctamente. Sin cambios necesarios. |
| `suggest-queries` | Funciona correctamente. Deploy con `--no-verify-jwt`. |

### Funciones nuevas

| Función | Propósito |
|---------|-----------|
| `content-generator` | Genera contenido (Reel, Post, WhatsApp) a partir de un digest |

### Reglas para Edge Functions

- Deploy siempre con `--no-verify-jwt`
- Dentro del CRM (páginas autenticadas): usar `supabase.functions.invoke()` — funciona correctamente con sesión activa
- Para páginas públicas sin autenticación (blog): usar `fetch()` directo con URL pública
- Manejo de errores: nunca fallar silenciosamente

---

## 15. MANEJO DE ERRORES

### 15.1 Error en digest

Si falla la IA (Groq caído, timeout, rate limit):
- **No guardar** el digest
- Mostrar error al usuario
- Permitir retry manual

### 15.2 Error en contenido

Si falla la generación de contenido (Reel, Post, WhatsApp):
- **Guardar** el registro con `status = error`
- Guardar el mensaje de error en `error_message`
- Mostrar error al usuario con opción de regenerar

### 15.3 Rate limiting

**Regla documentada**: máximo 10 generaciones por hora por consultant.

**Implementación MVP**: no implementar. Contar registros en `digest_contents` por consultant en cada request agrega complejidad que no justifica con un solo tenant. Documentar como regla de negocio para implementar cuando haya múltiples brokers usando el sistema en paralelo.

---

## 16. MULTI-TENANT

- Todas las tablas tienen `consultant_id`
- RLS obligatorio en todas las tablas
- Cada consultant ve solo sus propios datos
- La tabla `consultant_settings` filtra por `consultant_id`
- El blog público filtra por `blog_published_at` no null (single-tenant en primera etapa)

**Primera etapa**: single-tenant (un solo broker, Kohan Campos). El blog en `/mercado` muestra digests de ese broker.

**Futura expansión**: multi-tenant con rutas tipo `/mercado/{slug-del-broker}`. El modelo de datos ya lo soporta con `consultant_id`.

---

## 17. LIMPIEZA

Regla de negocio (documentada, no implementar en MVP):

- Contenido con `status = draft` sin aprobar después de 7 días → marcar como `archived` o eliminar
- Dejar documentado como regla para implementar cuando el sistema tenga volumen

---

## 18. AUDITORÍA

El sistema permite responder:

- ¿Qué queries generaron este digest? → campo `queries` en `market_digests`
- ¿Qué contenido se generó desde este digest? → consulta `digest_contents` por `digest_id`
- ¿Qué contenido se usó realmente? → `status = approved` en `digest_contents`
- ¿Qué modelo y prompt se usó? → campos `model` y `prompt_version` en `digest_contents`
- ¿Cuándo se publicó en el blog? → `blog_published_at` en `market_digests`

---

## 19. REGLAS CRÍTICAS

| Regla | Motivo |
|-------|--------|
| No generar contenido sin digest | El digest es el único origen de verdad |
| No usar localStorage para configuración | Se pierde entre dispositivos y navegadores |
| No usar boolean para publicación pública | Un timestamp da auditoría y ordenamiento |
| No sobrescribir contenido generado | Crear nuevo registro, mantener historial |
| Siempre mantener trazabilidad | Cada pieza de contenido vincula a su digest y modelo |
| Siempre incluir disclaimer legal | Protección legal en real estate |
| Todo en español | UI y contenido generado orientado a hispanohablantes |
| Deploy siempre con `--no-verify-jwt` | Evitar errores 401 en Edge Functions |

---

## 20. ESTRUCTURA DE ARCHIVOS (REFERENCIA)

```
supabase/
  functions/
    market-digest/index.ts         ← ya existe
    suggest-queries/index.ts       ← ya existe  
    content-generator/index.ts     ← NUEVA (Fase 2)

src/
  pages/
    InteligenciaMercadoPage.tsx    ← ya existe (modificar en Fase 3)
    MercadoBlogPage.tsx            ← NUEVA (Sprint separado: Blog)
    MercadoPostPage.tsx            ← NUEVA (Sprint separado: Blog)
  hooks/
    useMarketDigest.ts             ← ya existe (modificar en Fase 1)
    useContentGenerator.ts         ← NUEVA (Fase 3)
  components/
    marketing/
      QueryAssistant.tsx           ← ya existe
      ContentGenerator.tsx         ← NUEVA (Fase 3)
      ContentPreview.tsx           ← NUEVA (Fase 3)
  lib/
    blog.ts                        ← NUEVA (Sprint separado: Blog)
```

---

## 21. PLAN DE IMPLEMENTACIÓN

| Fase | Qué | Detalle |
|------|-----|---------|
| **1** | **Tablas** | Crear `digest_contents`, `consultant_settings`. Agregar `blog_published_at` a `market_digests`. Migrar queries de localStorage a DB. |
| **2** | **Edge Function** | Crear `content-generator` con soporte para Reel, Post y WhatsApp. |
| **3** | **UI de contenido** | Botones de generación en el digest. Preview de contenido generado. Botones copiar y abrir WhatsApp. Botón "Generar todo". |
| **4** | **Blog público** | Sprint separado. Rutas `/mercado` y `/mercado/:fecha`. SEO. Páginas públicas sin auth. CTA de conversión. |

Las fases 1-3 son el MVP que valida el producto. El blog (fase 4) es un sprint propio.

---

**Este módulo es el núcleo del diferencial del SaaS. No es una feature.**