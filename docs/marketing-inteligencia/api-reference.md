# 📚 API Reference

> Documentación completa de la API del módulo Inteligencia de Mercado

---

## 🔗 Endpoints

### 1. Edge Function: Generar Digest

**URL:** `POST https://jjnmehdcmpkobwnrjvvm.supabase.co/functions/v1/market-digest`

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  consultant_id: string;  // UUID del consultant (requerido)
  queries: string[];      // Términos de búsqueda (requerido)
  pais?: string;          // País para contexto (opcional, default: "Paraguay")
}
```

**Ejemplo:**
```json
{
  "consultant_id": "550e8400-e29b-41d4-a716-446655440000",
  "queries": [
    "mercado inmobiliario Paraguay 2026",
    "real estate Paraguay inversión",
    "precios propiedades Asunción Paraguay"
  ],
  "pais": "Paraguay"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "summary": "El mercado inmobiliario de Paraguay muestra crecimiento sostenido...",
    "titulares": [
      {
        "titulo": "Inversiones en CIT Luque superan USD 40M en Q1",
        "url": "https://ejemplo.com/noticia-1",
        "fuente": "ABC Color"
      },
      {
        "titulo": "Demanda de alquileres sube 8% en zona norte",
        "url": "https://ejemplo.com/noticia-2", 
        "fuente": "La Nación"
      }
    ],
    "senal_inversor": "Momento para posicionar off-plan en Luque antes de Q2"
  }
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Tavily error: 429"
}
```

---

### 2. REST API: Obtener Digest

**URL:** `GET https://jjnmehdcmpkobwnrjvvm.supabase.co/rest/v1/market_digests`

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
apikey: <ANON_KEY>
```

**Query Parameters:**
```
consultant_id=eq.<UUID>&fecha=eq.<YYYY-MM-DD>
```

**Ejemplo:**
```http
GET /rest/v1/market_digests?consultant_id=eq.550e8400-e29b-41d4-a716-446655440000&fecha=eq.2026-04-11
```

**Response (200):**
```json
[
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "created_at": "2026-04-11T14:30:00Z",
    "consultant_id": "550e8400-e29b-41d4-a716-446655440000",
    "fecha": "2026-04-11",
    "summary": "El mercado inmobiliario de Paraguay muestra crecimiento...",
    "titulares": [
      {
        "titulo": "Inversiones en CIT Luque superan USD 40M",
        "url": "https://ejemplo.com/noticia-1",
        "fuente": "ABC Color"
      }
    ],
    "senal_inversor": "Momento para posicionar off-plan...",
    "queries": ["mercado inmobiliario Paraguay 2026", ...],
    "status": "published"
  }
]
```

**Nota:** Devuelve array vacío `[]` si no hay digest para esa fecha.

---

### 3. REST API: Listar Histórico

**URL:** `GET https://jjnmehdcmpkobwnrjvvm.supabase.co/rest/v1/market_digests`

**Query Parameters:**
```
consultant_id=eq.<UUID>
order=fecha.desc
limit=10
```

**Ejemplo:**
```http
GET /rest/v1/market_digests?consultant_id=eq.550e8400-e29b-41d4-a716-446655440000&order=fecha.desc&limit=10
```

**Response:** Array de digests ordenados por fecha descendente.

---

## 🔐 Autenticación

Todas las APIs requieren autenticación JWT válida.

### Obtener Token

```typescript
// Desde el frontend (ya autenticado)
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

### Headers Requeridos

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Para REST API (PostgREST):
```http
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

---

## 📊 Esquemas de Datos

### Request: Generate Digest

```typescript
interface GenerateDigestRequest {
  consultant_id: string;      // UUID v4
  queries: string[];          // Mínimo 1, máximo 5 queries
  pais?: string;              // Default: "Paraguay"
}
```

**Validaciones:**
- `consultant_id`: Requerido, debe ser UUID válido
- `queries`: Requerido, array no vacío
- `pais`: Opcional, string

### Response: Digest

```typescript
interface MarketDigest {
  id: string;                 // UUID del digest
  created_at: string;         // ISO 8601 timestamp
  consultant_id: string;      // UUID del consultant
  fecha: string;              // YYYY-MM-DD
  summary: string | null;     // Resumen ejecutivo
  titulares: Titular[];       // Array de noticias
  senal_inversor: string | null;  // Consejo para inversor
  queries: string[];          // Qué se buscó
  status: 'draft' | 'published' | 'archived';
}

interface Titular {
  titulo: string;             // Título de la noticia
  url: string;                // URL original
  fuente: string;             // Nombre del medio
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| `400` | Bad Request - `consultant_id` faltante | Verificar que se envíe el UUID |
| `401` | Unauthorized - Token inválido | Re-loguear usuario |
| `403` | Forbidden - No es admin | Verificar permisos del usuario |
| `429` | Too Many Requests - Rate limit | Esperar y reintentar |
| `500` | Internal Server Error | Revisar logs de Edge Function |

### Errores Comunes

**Tavily API Error:**
```json
{
  "success": false,
  "error": "Tavily error: 429"
}
```
**Causa:** Rate limit de Tavily (1,000 búsquedas/mes)  
**Solución:** Esperar al mes siguiente o upgrade de plan

**Groq API Error:**
```json
{
  "success": false,
  "error": "Groq error: 429"
}
```
**Causa:** Rate limit de Groq (30 req/min)  
**Solución:** Esperar 1 minuto y reintentar

**JSON Parse Error:**
```json
{
  "success": false,
  "error": "Unexpected token..."
}
```
**Causa:** Groq no devolvió JSON válido  
**Solución:** Reintentar (es raro, pero puede pasar)

---

## 🧪 Ejemplos de Uso

### JavaScript/TypeScript (Frontend)

```typescript
import { supabase } from '@/lib/supabase'

// Generar nuevo digest
async function generarDigest() {
  const { data, error } = await supabase.functions.invoke('market-digest', {
    body: {
      consultant_id: '550e8400-e29b-41d4-a716-446655440000',
      queries: ['mercado inmobiliario Paraguay'],
      pais: 'Paraguay'
    }
  })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Digest generado:', data)
}

// Obtener digest de hoy
async function obtenerDigestHoy(consultantId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('market_digests')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('fecha', today)
    .maybeSingle()
    
  if (error) {
    console.error('Error:', error)
    return null
  }
  
  return data
}

// Listar histórico
async function listarHistorico(consultantId: string) {
  const { data, error } = await supabase
    .from('market_digests')
    .select('*')
    .eq('consultant_id', consultantId)
    .order('fecha', { ascending: false })
    .limit(10)
    
  return data || []
}
```

### cURL

```bash
# Generar digest
curl -X POST \
  https://jjnmehdcmpkobwnrjvvm.supabase.co/functions/v1/market-digest \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consultant_id": "550e8400-e29b-41d4-a716-446655440000",
    "queries": ["mercado inmobiliario Paraguay"]
  }'

# Obtener digest
curl -X GET \
  "https://jjnmehdcmpkobwnrjvvm.supabase.co/rest/v1/market_digests?consultant_id=eq.550e8400-e29b-41d4-a716-446655440000&fecha=eq.2026-04-11" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "apikey: $ANON_KEY"
```

---

## 📈 Rate Limiting

### Límites por Servicio

| Servicio | Límite | Ventana |
|----------|--------|---------|
| Tavily API | 1,000 búsquedas | Por mes |
| Groq API | 30 requests | Por minuto |
| Groq API | 1,000,000 tokens | Por día |
| Supabase Edge Functions | 500,000 invocations | Por mes |

### Estrategia de Reintentos

```typescript
async function generarDigestConRetry(intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const { data } = await supabase.functions.invoke('market-digest', {
        body: { /* ... */ }
      })
      return data
    } catch (error) {
      if (i === intentos - 1) throw error
      
      // Esperar 2^i segundos (exponential backoff)
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
}
```

---

## 🔍 Debugging

### Logs de Edge Function

Ver logs en tiempo real:
```bash
supabase functions logs market-digest --project-ref jjnmehdcmpkobwnrjvvm
```

O en el dashboard:
https://supabase.com/dashboard/project/jjnmehdcmpkobwnrjvvm/functions/market-digest/logs

### Headers de Debug

Agregar header para ver más info:
```http
X-Debug: true
```

---

[← Volver al README](./README.md)
