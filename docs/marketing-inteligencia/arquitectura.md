# 🏗️ Arquitectura Técnica

> Documentación del flujo de datos y componentes del módulo

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                    │
│                         (Browser - React)                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  InteligenciaMercadoPage.tsx                                     │   │
│  │  ─────────────────────────────                                   │   │
│  │  • Botón "Actualizar"                                            │   │
│  │  • Cards: Resumen, Titulares, Señal                             │   │
│  │  • Loading states con Loader2                                    │   │
│  │  • Toast notifications (sonner)                                  │   │
│  └────────────────┬────────────────────────────────────────────────┘   │
│                   │                                                     │
│                   │ useMarketDigest()                                   │
│                   │ @tanstack/react-query                               │
│                   ▼                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  useMarketDigest.ts                                              │   │
│  │  ──────────────────                                              │   │
│  │  • Query: GET /rest/v1/market_digests                            │   │
│  │  • Mutation: POST /functions/v1/market-digest                    │   │
│  │  • Cache invalidation on success                                 │   │
│  └────────────────┬────────────────────────────────────────────────┘   │
│                   │                                                     │
└───────────────────┼─────────────────────────────────────────────────────┘
                    │
                    │ HTTP
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE                                      │
│                                                                         │
│  ┌───────────────────────────────┐    ┌───────────────────────────────┐ │
│  │  Edge Function                 │    │  PostgreSQL                   │ │
│  │  /market-digest                │    │  market_digests               │ │
│  │  ─────────────                 │    │  ───────────────              │ │
│  │                                │    │                               │ │
│  │  1. Recibe request             │    │  • id (uuid)                  │ │
│  │  2. Valida consultant_id       │    │  • consultant_id (uuid)       │ │
│  │  3. Llama Tavily API           │    │  • fecha (date)               │ │
│  │  4. Llama Groq API             │    │  • summary (text)             │ │
│  │  5. Parsea respuesta JSON      │    │  • titulares (jsonb)          │ │
│  │  6. UPSERT a DB                │───▶│  • senal_inversor (text)      │ │
│  │  7. Retorna resultado          │    │  • queries (text[])           │ │
│  │                                │    │  • status (text)              │ │
│  └───────────────────────────────┘    └───────────────────────────────┘ │
│                                                                         │
│  Secrets:                                                               │
│  • TAVILY_API_KEY                                                       │
│  • GROQ_API_KEY                                                         │
│  • SUPABASE_SERVICE_ROLE_KEY                                            │ │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         │ HTTP / API Calls
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                              │
│                                                                         │
│  ┌───────────────────────────────┐    ┌───────────────────────────────┐ │
│  │  Tavily API                    │    │  Groq API                     │ │
│  │  ───────────                   │    │  ───────                      │ │
│  │                                │    │                               │ │
│  │  Input: queries[]              │    │  Input: noticias[]            │ │
│  │  Output: results[]             │    │  Output: JSON analizado       │ │
│  │                                │    │                               │ │
│  │  Búsqueda web avanzada         │    │  Modelo: llama-3.3-70b        │ │
│  │  • Noticias inmobiliarias      │    │  • Resumen ejecutivo          │ │
│  │  • Mercado Paraguay            │    │  • Titulares estructurados    │ │
│  │  • Real estate                 │    │  • Señal para inversor        │ │
│  │                                │    │                               │ │
│  │  Costo: Gratis (1K/mes)        │    │  Costo: Gratis (1M tokens/día)│ │
│  └───────────────────────────────┘    └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos Detallado

### 1. Inicialización

```typescript
// Usuario entra a /inteligencia
InteligenciaMercadoPage 
  └── useMarketDigest()
      └── useQuery(['market-digest', consultantId, today])
          └── GET /rest/v1/market_digests?consultant_id=eq.${id}&fecha=eq.${today}
              └── Si existe: muestra datos
              └── Si no existe: muestra estado vacío
```

### 2. Generación (Usuario aprieta "Actualizar")

```typescript
// mutation.mutate()
supabase.functions.invoke('market-digest', {
  body: {
    consultant_id: "uuid-del-consultant",
    queries: [
      "mercado inmobiliario Paraguay 2026",
      "real estate Paraguay inversión", 
      "precios propiedades Asunción Paraguay"
    ],
    pais: "Paraguay"
  }
})
```

### 3. Edge Function Execution

```typescript
// 1. Validación
if (!consultant_id) throw new Error('consultant_id requerido')

// 2. Tavily API Call
const noticias = await fetch('https://api.tavily.com/search', {
  query: "mercado inmobiliario Paraguay 2026 OR real estate Paraguay inversión OR ...",
  max_results: 8
})

// 3. Groq API Call
const prompt = `Sos un analista inmobiliario experto en Paraguay...
Analizá estas noticias y respondé ÚNICAMENTE con JSON válido...`

const analisis = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' }
})

// 4. Database Upsert
await supabase.from('market_digests').upsert({
  consultant_id,
  fecha: '2026-04-11',
  summary: analisis.summary,
  titulares: analisis.titulares,
  senal_inversor: analisis.senal_inversor,
  status: 'published'
}, { onConflict: 'consultant_id,fecha' })

// 5. Return
return { success: true, data: analisis }
```

### 4. Frontend Update

```typescript
// On mutation success
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['market-digest', consultantId, today]
  })
  toast.success('Análisis actualizado')
}

// Query refetches automatically
// UI re-renders with new data
```

---

## 🗄️ Multi-Tenancy

### Isolación por Tenant

```sql
-- Cada digest pertenece a un consultant
SELECT * FROM market_digests 
WHERE consultant_id = 'uuid-del-consultant'
  AND fecha = '2026-04-11';

-- RLS Policy: Usuario solo ve digests de su consultant
CREATE POLICY "market_digests_isolation"
  ON market_digests FOR ALL
  USING (
    consultant_id IN (
      SELECT consultant_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );
```

### Flujo de Autenticación

```
Usuario logueado
    │
    ├── auth.uid() → JWT token
    │
    ├── user_roles → consultant_id
    │
    └── market_digests WHERE consultant_id = ${consultant_id}
```

---

## 📦 Componentes React

### Hook: `useMarketDigest.ts`

```typescript
interface UseMarketDigestReturn {
  // Query
  query: {
    data: MarketDigest | null    // Datos del digest de hoy
    isLoading: boolean            // Loading inicial
    isError: boolean              // Error en fetch
  }
  
  // Mutation
  mutation: {
    mutate: () => void            // Trigger generación
    isPending: boolean            // Loading durante generación
    isError: boolean              // Error en generación
  }
}
```

### Página: `InteligenciaMercadoPage.tsx`

```
Estados de UI:
├── Loading inicial
│   └── Spinner centrado
│
├── Empty state (no digest)
│   ├── Icono TrendingUp
│   ├── Texto: "No hay análisis para hoy"
│   └── Botón: "Generar primer análisis"
│
└── Content (digest exists)
    ├── Card: Resumen ejecutivo
    ├── Card: Titulares del día (links)
    ├── Card: Señal para el inversor (ámbar)
    └── Footer: Fecha del análisis
```

---

## 🔐 Seguridad

### Capas de Protección

| Capa | Implementación | Descripción |
|------|----------------|-------------|
| **Ruta** | `RequireRole role="admin"` | Solo admins acceden a `/inteligencia` |
| **Menú** | `permisoMap['/inteligencia'] = isAdmin` | Solo admins ven el menú en sidebar |
| **RLS** | Policy en DB | Usuario solo ve digests de su consultant |
| **API** | Service Role Key | Edge Function escribe sin restricciones |
| **Validación** | `if (!consultant_id) throw` | Requiere consultant_id en request |

---

## ⚡ Performance

### Optimizaciones

1. **Query Caching**
   - React Query cachea el digest por 5 minutos
   - `staleTime: 5 * 60 * 1000`

2. **Single Request**
   - Un digest por día por consultant
   - `UNIQUE(consultant_id, fecha)`

3. **Edge Function**
   - Corre en el edge de Supabase
   - Latencia baja para usuarios en Sudamérica

4. **Lazy Loading**
   - Query solo se ejecuta si `consultantId` existe
   - `enabled: !!consultantId`

---

## 📊 Diagrama de Secuencia

```
Usuario    Frontend    useMarketDigest    Edge Function    Tavily    Groq    PostgreSQL
  │           │              │                 │             │        │          │
  │──Click──▶│              │                 │             │        │          │
  │          │──mutate()───▶│                 │             │        │          │
  │          │              │──invoke()──────▶│             │        │          │
  │          │              │                 │──fetch()───▶│        │          │
  │          │              │                 │◀──results───│        │          │
  │          │              │                 │──fetch()───────────▶│          │
  │          │              │                 │◀──analysis──────────│          │
  │          │              │                 │──upsert()─────────────────────▶│
  │          │              │                 │◀──success──────────────────────│
  │          │              │◀──response─────│             │        │          │
  │          │◀─invalidate─│                 │             │        │          │
  │          │──refetch()──▶│                 │             │        │          │
  │          │              │──select()──────────────────────────────────────▶│
  │          │              │◀──data──────────────────────────────────────────│
  │◀─render──│              │                 │             │        │          │
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- @tanstack/react-query
- Lucide React (iconos)
- Sonner (toasts)

### Backend
- Supabase Edge Functions (Deno)
- PostgreSQL
- Row Level Security (RLS)

### APIs Externas
- Tavily API (búsqueda web)
- Groq API (LLM - Llama 3 70B)

### Infraestructura
- Vercel (hosting frontend)
- Supabase (DB + Edge Functions)
- Cloudflare (DNS/Proxy)

---

## 📈 Escalabilidad

### Límites Actuales

| Recurso | Límite | Uso Actual |
|---------|--------|------------|
| Tavily API | 1,000 búsquedas/mes | ~60/mes |
| Groq API | 1M tokens/día | ~500 tokens/día |
| Edge Functions | 500K invocations/mes | ~60/mes |
| PostgreSQL | 500MB (gratis) | ~1KB/digest |

### Plan de Escalabilidad

**Si crece el uso (>1000 digest/mes):**
1. Cachear resultados de Tavily por 6 horas
2. Implementar rate limiting por consultant
3. Agregar tier de pago en Tavily ($29/mes para 10K búsquedas)

**Si crece el número de tenants (>1000):**
1. Particionar tabla por `consultant_id`
2. Implementar soft delete (archivar digests antiguos)
3. Agregar índices adicionales

---

[← Volver al README](./README.md)
