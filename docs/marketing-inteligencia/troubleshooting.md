# 🛠️ Troubleshooting

> Solución de problemas comunes del módulo Inteligencia de Mercado

---

## 🔴 Errores del Frontend

### Error: "No hay análisis para hoy"

**Descripción:** Aparece la pantalla vacía con el mensaje "No hay análisis para hoy todavía."

**Solución:**
1. ✅ Esto es **normal** si nunca generaste un digest
2. Click en **"Generar primer análisis"**
3. Esperar 5-10 segundos

---

### Error: "Error al actualizar" (Toast rojo)

**Descripción:** Aparece un toast rojo con mensaje de error.

**Causas y soluciones:**

#### Causa 1: API Keys no configuradas
```
Error: TAVILY_API_KEY not found
```
**Solución:**
```bash
# Configurar secrets en Supabase
supabase secrets set TAVILY_API_KEY=tvly-dev-xxxxx --project-ref jjnmehdcmpkobwnrjvvm
supabase secrets set GROQ_API_KEY=gsk-xxxxx --project-ref jjnmehdcmpkobwnrjvvm
```

#### Causa 2: Rate limit de Tavily
```
Error: Tavily error: 429
```
**Solución:**
- Esperar 1 hora y reintentar
- O revisar cuota mensual (1,000 búsquedas/mes)
- Upgrade en: https://tavily.com

#### Causa 3: Rate limit de Groq
```
Error: Groq error: 429
```
**Solución:**
- Esperar 1 minuto (límite: 30 req/min)
- Reintentar

#### Causa 4: JSON inválido
```
Error: Unexpected token...
```
**Solución:**
- Reintentar (la IA a veces devuelve formato incorrecto)
- Si persiste, revisar logs de la Edge Function

---

### Error: Botón "Actualizar" deshabilitado

**Descripción:** El botón está gris y no se puede clickar.

**Causas:**
1. **Mutation en progreso:** Ya se está generando un digest
   - **Solución:** Esperar a que termine
   
2. **No hay consultant_id:** El usuario no tiene consultant asignado
   - **Solución:** Verificar en tabla `user_roles` que el usuario tenga `consultant_id`

3. **Usuario no es admin:** Solo admins pueden ver el módulo
   - **Solución:** Cambiar rol del usuario a admin

---

### Error: No aparece el menú "Inteligencia IA"

**Descripción:** El menú no aparece en el sidebar bajo "Sistema".

**Checklist:**

1. **¿El usuario es admin?**
   ```sql
   SELECT * FROM user_roles 
   WHERE user_id = 'uuid-del-usuario' 
     AND role = 'admin';
   ```
   Si no devuelve nada, el usuario no es admin.

2. **¿Se importó Brain en Sidebar.tsx?**
   ```typescript
   import { ..., Brain } from 'lucide-react'
   ```

3. **¿Se agregó al NAV_GRUPOS?**
   ```typescript
   { to: '/inteligencia', label: 'Inteligencia IA', icon: Brain }
   ```

4. **¿Se agregó al permisoMap?**
   ```typescript
   '/inteligencia': isAdmin === true
   ```

5. **¿Se agregó al MODULO_PERMISO?**
   ```typescript
   '/inteligencia': 'configuracion'
   ```

---

## 🔴 Errores de la Edge Function

### Error: 401 Unauthorized

**Descripción:** La función devuelve 401.

**Causas:**
1. **JWT inválido:** El token del usuario expiró
   - **Solución:** Re-loguear usuario

2. **Falta header Authorization:**
   - **Solución:** Verificar que el frontend envíe el header

### Error: 404 Not Found

**Descripción:** `Function not found`.

**Causa:** Edge Function no está deployada.

**Solución:**
```bash
cd "/Users/abrahamkohan/Proyecto Web/nexocrm"
supabase functions deploy market-digest --project-ref jjnmehdcmpkobwnrjvvm
```

### Error: 500 Internal Server Error

**Descripción:** Error genérico del servidor.

**Pasos para debug:**

1. **Ver logs:**
   ```bash
   supabase functions logs market-digest --project-ref jjnmehdcmpkobwnrjvvm
   ```

2. **Verificar secrets:**
   ```bash
   supabase secrets list --project-ref jjnmehdcmpkobwnrjvvm
   ```
   Deben aparecer:
   - `TAVILY_API_KEY`
   - `GROQ_API_KEY`

3. **Probar manualmente:**
   ```bash
   curl -X POST \
     https://jjnmehdcmpkobwnrjvvm.supabase.co/functions/v1/market-digest \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "consultant_id": "550e8400-e29b-41d4-a716-446655440000",
       "queries": ["test"]
     }'
   ```

---

## 🔴 Errores de Base de Datos

### Error: "duplicate key value violates unique constraint"

**Descripción:** Violación de constraint `unique_consultant_fecha`.

**Causa:** Intentando insertar un digest para el mismo consultant y fecha.

**Solución:** Esto no debería pasar porque usamos `ON CONFLICT ... DO UPDATE`. Si pasa:

```sql
-- Verificar si ya existe
SELECT * FROM market_digests 
WHERE consultant_id = 'uuid' 
  AND fecha = '2026-04-11';

-- Si existe, hacer UPDATE en lugar de INSERT
UPDATE market_digests 
SET summary = 'nuevo resumen',
    titulares = '[...]'::jsonb
WHERE consultant_id = 'uuid' 
  AND fecha = '2026-04-11';
```

---

### Error: "permission denied for table market_digests"

**Descripción:** Error de RLS.

**Causas:**
1. **RLS no habilitado:**
   ```sql
   ALTER TABLE market_digests ENABLE ROW LEVEL SECURITY;
   ```

2. **Policy no creada:**
   ```sql
   CREATE POLICY "market_digests_isolation"
     ON market_digests FOR ALL
     USING (
       consultant_id IN (
         SELECT consultant_id FROM user_roles
         WHERE user_id = auth.uid()
       )
     );
   ```

3. **Usuario no tiene consultant_id:**
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'uuid-del-usuario';
   ```
   Si `consultant_id` es NULL, el usuario no tiene inmobiliaria asignada.

---

### Error: "column does not exist"

**Descripción:** Error al queryar columnas.

**Causa:** La tabla no tiene todas las columnas.

**Solución:** Re-ejecutar la migración SQL completa:

```sql
-- Verificar estructura
\d market_digests

-- Si falta algo, recrear tabla
DROP TABLE IF EXISTS market_digests;
-- ... ejecutar SQL completo de README.md
```

---

## 🔴 Problemas de Conectividad

### La página no carga

**Checklist:**

1. **¿El servidor está corriendo?**
   ```bash
   cd "/Users/abrahamkohan/Proyecto Web/nexocrm"
   npm run dev
   ```
   Debe mostrar: `Local: http://localhost:5173/`

2. **¿El puerto 5173 está libre?**
   ```bash
   lsof -i:5173
   # Si hay procesos, matarlos
   kill -9 $(lsof -ti:5173)
   ```

3. **¿Hay errores de compilación?**
   ```bash
   npx tsc --noEmit
   ```

---

### La Edge Function no responde

**Checklist:**

1. **¿Está deployada?**
   ```bash
   supabase functions list --project-ref jjnmehdcmpkobwnrjvvm
   ```
   Debe aparecer `market-digest`

2. **¿Responde a health check?**
   ```bash
   curl https://jjnmehdcmpkobwnrjvvm.supabase.co/functions/v1/market-digest \
     -X OPTIONS
   ```
   Debe retornar `ok`

3. **¿Los secrets están configurados?**
   ```bash
   supabase secrets list --project-ref jjnmehdcmpkobwnrjvvm
   ```

---

## 🔴 Problemas de Performance

### La generación tarda más de 30 segundos

**Causas:**
1. **Tavily lento:** Problemas de red o API congestionada
2. **Groq lento:** Cola de requests

**Soluciones:**
- Reintentar en unos minutos
- Verificar status de APIs:
  - https://status.tavily.com
  - https://status.groq.com

### El UI se congela

**Causa:** Query de React Query sin timeout.

**Solución temporal:**
```typescript
// En useMarketDigest.ts, agregar timeout
const query = useQuery({
  queryKey: ['market-digest', consultantId, today],
  queryFn: async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    
    const { data } = await supabase
      .from('market_digests')
      .select('*')
      .eq('consultant_id', consultantId)
      .eq('fecha', today)
      .maybeSingle()
      .abortSignal(controller.signal)
    
    clearTimeout(timeout)
    return data
  },
})
```

---

## 🔍 Debugging Avanzado

### Ver logs en tiempo real

**Frontend:**
```bash
# Console del navegador
F12 → Console
```

**Edge Function:**
```bash
# Terminal
supabase functions logs market-digest --project-ref jjnmehdcmpkobwnrjvvm --tail
```

**Base de datos:**
```sql
-- Logs de queries
SET log_statement = 'all';
```

### Test manual de la API

```bash
# 1. Obtener JWT
curl -X POST https://jjnmehdcmpkobwnrjvvm.supabase.co/auth/v1/token \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password"
  }'

# 2. Guardar access_token
export JWT_TOKEN="eyJhbG..."

# 3. Llamar Edge Function
curl -X POST \
  https://jjnmehdcmpkobwnrjvvm.supabase.co/functions/v1/market-digest \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consultant_id": "550e8400-e29b-41d4-a716-446655440000",
    "queries": ["mercado inmobiliario Paraguay"]
  }'
```

---

## 📞 Escalar problemas

Si ninguna solución funciona:

1. **Recolectar información:**
   - Screenshot del error
   - Logs de la consola (F12)
   - Output de `supabase functions logs`

2. **Verificar:**
   - [ ] SQL migration ejecutada
   - [ ] Edge Function deployada
   - [ ] Secrets configurados
   - [ ] Usuario tiene consultant_id
   - [ ] Usuario es admin
   - [ ] No hay errores de TypeScript

3. **Contactar:**
   - Arquitecto del proyecto
   - Equipo de DevOps

---

## ✅ Checklist de Verificación

Antes de reportar un bug, verificar:

- [ ] SQL migration ejecutada correctamente
- [ ] Tabla `market_digests` existe
- [ ] RLS habilitado y policy creada
- [ ] Edge Function deployada y responde
- [ ] Secrets `TAVILY_API_KEY` y `GROQ_API_KEY` configurados
- [ ] Usuario logueado y tiene `consultant_id`
- [ ] Usuario tiene rol `admin`
- [ ] No hay errores en consola del navegador
- [ ] No hay errores de TypeScript
- [ ] Servidor frontend corriendo

---

[← Volver al README](./README.md)
