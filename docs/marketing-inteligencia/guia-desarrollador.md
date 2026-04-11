# 👨‍💻 Guía para Desarrolladores

> Cómo extender y mantener el módulo Inteligencia de Mercado

---

## 🎯 Casos de Uso para Extensión

### 1. Agregar nuevo tipo de contenido

**Escenario:** Queremos agregar una sección "Tendencias por zona" al digest.

**Pasos:**

1. **Modificar el prompt de Groq** (`supabase/functions/market-digest/index.ts`):
```typescript
const prompt = `Sos un analista inmobiliario experto en ${pais}.
Analizá estas noticias y respondé ÚNICAMENTE con JSON válido:
{
  "summary": "...",
  "titulares": [...],
  "senal_inversor": "...",
  "tendencias_zona": [  // ← NUEVO
    {"zona": "Luque", "tendencia": "Alza", "porcentaje": "8%"}
  ]
}`
```

2. **Agregar columna a la DB**:
```sql
ALTER TABLE market_digests 
ADD COLUMN tendencias_zona JSONB DEFAULT '[]';
```

3. **Actualizar el upsert**:
```typescript
.upsert({
  // ... campos existentes
  tendencias_zona: parsed.tendencias_zona ?? [],
})
```

4. **Mostrar en UI** (`InteligenciaMercadoPage.tsx`):
```typescript
{digest.tendencias_zona?.length > 0 && (
  <Card>
    <h3>Tendencias por Zona</h3>
    {digest.tendencias_zona.map((t, i) => (
      <div key={i}>{t.zona}: {t.tendencia} ({t.porcentaje})</div>
    ))}
  </Card>
)}
```

---

### 2. Cambiar el modelo de IA

**Escenario:** Queremos usar GPT-4 en lugar de Llama 3.

**Pasos:**

1. **Abrir cuenta en OpenAI**: https://platform.openai.com
2. **Obtener API key**
3. **Agregar secret**:
```bash
supabase secrets set OPENAI_API_KEY=sk-xxxxx --project-ref jjnmehdcmpkobwnrjvvm
```

4. **Modificar Edge Function**:
```typescript
// Reemplazar llamada a Groq
const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  }),
})
```

5. **Deploy**:
```bash
supabase functions deploy market-digest --project-ref jjnmehdcmpkobwnrjvvm
```

---

### 3. Agregar filtros de búsqueda personalizados

**Escenario:** El usuario quiere elegir qué temas buscar.

**Pasos:**

1. **Agregar UI de filtros** (`InteligenciaMercadoPage.tsx`):
```typescript
const [temas, setTemas] = useState([
  { id: 'mercado', label: 'Mercado General', checked: true },
  { id: 'inversion', label: 'Inversión', checked: true },
  { id: 'alquileres', label: 'Alquileres', checked: false },
])

// Checkbox para cada tema
{temas.map(t => (
  <label key={t.id}>
    <input 
      type="checkbox" 
      checked={t.checked}
      onChange={() => toggleTema(t.id)}
    />
    {t.label}
  </label>
))}
```

2. **Construir queries dinámicos**:
```typescript
const queriesMap = {
  mercado: 'mercado inmobiliario Paraguay',
  inversion: 'real estate Paraguay inversión',
  alquileres: 'alquileres Paraguay precios',
}

const selectedQueries = temas
  .filter(t => t.checked)
  .map(t => queriesMap[t.id])

// En la mutation
body: {
  consultant_id: consultantId,
  queries: selectedQueries,
}
```

3. **Guardar queries usados** (ya está implementado en `queries` column)

---

### 4. Implementar histórico navegable

**Escenario:** El usuario quiere ver análisis de días anteriores.

**Pasos:**

1. **Crear hook nuevo** (`src/hooks/useMarketDigestHistory.ts`):
```typescript
export function useMarketDigestHistory() {
  const { consultant } = useBrand()
  
  return useQuery({
    queryKey: ['market-digest-history', consultant.uuid],
    queryFn: async () => {
      const { data } = await supabase
        .from('market_digests')
        .select('id, fecha, summary')
        .eq('consultant_id', consultant.uuid)
        .order('fecha', { ascending: false })
        .limit(30)
      return data
    },
  })
}
```

2. **Agregar selector de fecha** en la UI:
```typescript
const [selectedDate, setSelectedDate] = useState(today)
const { data: history } = useMarketDigestHistory()

<select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
  {history?.map(d => (
    <option key={d.id} value={d.fecha}>
      {new Date(d.fecha).toLocaleDateString()}
    </option>
  ))}
</select>
```

3. **Modificar hook principal** para aceptar fecha:
```typescript
export function useMarketDigest(date?: string) {
  const targetDate = date || today
  // ... usar targetDate en query
}
```

---

### 5. Agregar exportación a PDF

**Escenario:** El usuario quiere descargar el análisis como PDF.

**Opción A: Usar biblioteca cliente (jsPDF)**

```bash
npm install jspdf html2canvas
```

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

async function exportarPDF() {
  const element = document.getElementById('digest-content')
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF()
  pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
  pdf.save(`analisis-${digest.fecha}.pdf`)
}
```

**Opción B: Generar en servidor (Puppeteer en Edge Function)**

Más complejo, requiere instalar puppeteer en la Edge Function (pesado).

---

### 6. Integrar con sistema de notificaciones

**Escenario:** Notificar al usuario cuando hay nuevo digest disponible.

**Pasos:**

1. **Crear tabla de notificaciones**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Agregar trigger en market_digests**:
```sql
CREATE OR REPLACE FUNCTION notify_new_digest()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message)
  SELECT user_id, 'new_digest', 'Nuevo análisis de mercado disponible'
  FROM user_roles
  WHERE consultant_id = NEW.consultant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_digest
  AFTER INSERT ON market_digests
  FOR EACH ROW EXECUTE FUNCTION notify_new_digest();
```

3. **Mostrar notificaciones en UI** (componente de notificaciones existente)

---

## 🔧 Mantenimiento

### Actualizar dependencias

**Edge Function:**
```typescript
// Verificar versiones de imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Ver en: https://deno.land/std@0.168.0

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Ver en: https://esm.sh/@supabase/supabase-js
```

### Monitoreo

**Dashboards a revisar:**

1. **Supabase → Edge Functions → Logs**
   - Revisar errores 500
   - Verificar tiempos de respuesta

2. **Supabase → Database → Performance**
   - Revisar queries lentos
   - Verificar uso de índices

3. **Tavily Dashboard**
   - https://app.tavily.com/home
   - Verificar uso mensual (límite: 1,000)

4. **Groq Dashboard**
   - https://console.groq.com/usage
   - Verificar tokens usados

### Backups

**Automáticos (Supabase):**
- Backups diarios incluyen la tabla `market_digests`

**Manuales:**
```bash
# Exportar
supabase db dump --project-ref jjnmehdcmpkobwnrjvvm > backup.sql
```

---

## 🧪 Testing

### Test manual

```bash
# 1. Deployar a staging (si existe)
supabase functions deploy market-digest --project-ref staging-ref

# 2. Probar con curl
curl -X POST \
  https://staging-ref.supabase.co/functions/v1/market-digest \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"consultant_id": "test-uuid", "queries": ["test"]}'
```

### Test automático (opcional)

Crear archivo `tests/market-digest.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('useMarketDigest', () => {
  it('should fetch digest for today', async () => {
    // Mock de supabase
    // Test del hook
  })
  
  it('should generate new digest', async () => {
    // Test de la mutation
  })
})
```

---

## 📚 Recursos útiles

### Documentación de APIs

- **Tavily API**: https://docs.tavily.com
- **Groq API**: https://console.groq.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **React Query**: https://tanstack.com/query/latest

### Ejemplos de prompts

**Prompts efectivos para análisis inmobiliario:**

```
"Sos un analista senior de J.P. Morgan especializado en real estate latinoamericano. 
Analizá estas noticias y dame un resumen ejecutivo de máximo 3 oraciones que un 
inversor de alto patrimonio podría usar para tomar decisiones."
```

```
"Actuá como el director de investigación de Century 21 Paraguay. 
Identificá las 3 oportunidades de inversión más importantes mencionadas 
en estas noticias y rankealas por potencial de retorno."
```

---

## 🚀 Roadmap sugerido

### Features futuras

- [ ] **Histórico navegable** - Calendario para ver análisis pasados
- [ ] **Comparar fechas** - Ver diferencias entre dos días
- [ ] **Exportar PDF** - Descargar análisis
- [ ] **Compartir** - Enviar análisis por email/WhatsApp
- [ ] **Alertas** - Notificar cuando hay cambios importantes
- [ ] **Filtros** - Elegir temas a buscar
- [ ] **Gráficos** - Visualizar tendencias históricas
- [ ] **API pública** - Permitir acceso desde otros sistemas

---

## 🤝 Contribuir

### Convenciones de código

- **Commits**: Seguir conventional commits
  ```
  feat(market-intel): agregar histórico navegable
  fix(market-intel): corregir error en parseo de JSON
  docs(market-intel): actualizar README
  ```

- **Branches**: 
  ```
  feature/market-intel-historico
  fix/market-intel-timeout
  ```

- **PRs**: Incluir screenshots y descripción del cambio

### Code review checklist

- [ ] El código sigue el patrón del proyecto
- [ ] Hay manejo de errores
- [ ] Se actualizó la documentación
- [ ] Se probó manualmente
- [ ] No hay console.logs de debug
- [ ] Los tipos TypeScript son correctos

---

[← Volver al README](./README.md)
