# Sistema Kohan & Campos — CRM Inmobiliario

CRM inmobiliario completo para gestión de clientes, propiedades, proyectos, comisiones y simulaciones de inversión.

**URL producción:** https://sistema.kohancampos.com.py
**Stack:** Vite + React + TypeScript + React Router v7 + Supabase + TanStack Query + Tailwind
**Deploy:** GitHub → Vercel (auto-deploy en push a `main`)

---

## Módulos

### CRM
- **Clientes** — gestión de leads y clientes con estados, fuente, nacionalidad, fecha de nacimiento, apodo, referido. Formulario en página separada (no modal). Toggle "Todos / Míos" para admins.
- **Tareas** — sistema completo con tipos (WhatsApp, llamada, reunión, email, visita), prioridades, recurrencia, escalado. Vista "Mi día" con tareas vencidas/pendientes/hoy/mañana.
- **Notas** — notas libres vinculadas a clientes o proyectos, con inbox, banderas y recordatorios.

### Inventario
- **Propiedades** — propiedades propias en venta/alquiler con fotos, amenities, precio, estado.
- **Proyectos** — proyectos inmobiliarios con tipologías, planos, financiación, análisis de inversión. Pueden marcarse como `publicado_en_web = true` para aparecer en el simulador público.

### Ventas
- **Comisiones** — registro de ventas con cálculo bidireccional (valor+% → importe), toggle venta/alquiler, co-broker, propietario, splits por agente, ingresos parciales y facturación.

### Análisis
- **Simulador** (privado) — simulación de inversión con 4 escenarios: Airbnb/STR, alquiler tradicional, plusvalía y flip. Guarda simulaciones vinculadas a clientes.
- **Simulador público** — accesible sin login en `/simulador`. Muestra proyectos públicos, calcula los 3 escenarios principales y tiene CTA de contacto → `/lead-quick`.
- **Presupuestos** — generación de presupuestos de proyectos con PDF descargable.
- **Informes** — historial de simulaciones + reporte por agente (leads, clientes, tareas pendientes/vencidas por miembro del equipo).

### Sistema (solo admin)
- **Recursos** — biblioteca de documentos y materiales.
- **Configuración** — datos de consultora (nombre, logo, contacto, redes), links cortos para referidos, agentes/socios con % de comisión, gestión de equipo (invitar, cambiar rol, eliminar acceso).

---

## Roles y acceso

| Rol | Acceso |
|-----|--------|
| `admin` | Todo el sistema |
| `agente` | CRM + Inventario + Análisis. Sin Ventas ni Sistema. Dashboard simplificado. |

- Los admins ven todos los registros. Los agentes solo ven los asignados a ellos (`assigned_to`).
- La sección Sistema (Recursos + Configuración) está protegida con `RequireRole role="admin"`.
- Las Ventas (Comisiones) están protegidas con `RequireRole role="admin"`.

### Dashboard por rol
- **Admin:** dashboard con widgets arrastrables (KPIs, mercado, actividad, proyectos, gráficos, recursos).
- **Agente:** dashboard simplificado con sus stats (leads, clientes, tareas pendientes/vencidas) + vista "Mi día".

---

## Seguridad (RLS)

Políticas activas en Supabase:

| Tabla | Política |
|-------|----------|
| `clients` | Admin ve todo. Agente solo ve `assigned_to = uid()`. |
| `properties` | Admin ve todo. Agente solo ve `assigned_to = uid()`. |
| `tasks` | Admin ve todo. Agente solo ve `assigned_to = uid()`. |
| `commissions` | Admin ve todo. Agente solo ve `assigned_to = uid()`. |
| `projects` | Lectura anónima si `publicado_en_web = true`. |
| `typologies` | Lectura anónima si proyecto es público. |

La función `is_admin()` en Supabase verifica el rol del usuario autenticado.

---

## Realtime

Supabase Realtime activo en tabla `tasks`. El hook `useRealtimeTasks` (montado en `AppShell`) invalida el cache automáticamente y muestra un toast cuando aparece una tarea vencida.

---

## Rutas públicas (sin login)

| Ruta | Descripción |
|------|-------------|
| `/simulador` | Simulador público de inversión |
| `/lead-quick` | Formulario rápido de carga de lead |
| `/l/:ref` | Link corto para referidos |
| `/informes/:id` | Reporte HTML de simulación |
| `/presupuestos/:id/pdf` | PDF de presupuesto |

---

## Equipo actual

- **Abraham Kohan** — admin (`abrahamkohan.py@gmail.com`)
- **Arturo** — admin (`artcamp96@gmail.com`)

---

## Comandos

```bash
npm run dev          # Servidor local
npm run build        # Build de producción (no correr manualmente)
git push             # Deploy automático a Vercel
```

## Variables de entorno

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_APP_URL=https://sistema.kohancampos.com.py
```
