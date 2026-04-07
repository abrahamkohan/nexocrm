# 🚀 Roadmap: Deploy NexoCRM a nexocrm.app

## Resumen
Este documento detalla todos los pasos, APIs y configuraciones necesarias para clonar y deployar el sistema a un nuevo dominio.

---

## 1. Variables de Entorno Requeridas

### Variables del Frontend (`.env`)

```
# === SUPABASE (OBLIGATORIO) ===
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# === APP CONFIG ===
VITE_APP_URL=https://nexocrm.app

# === OPCIONALES ===
VITE_VAPID_PUBLIC_KEY=  # Para push notifications
VITE_LEAD_QUICK_TOKEN=  # Para links de leads rápidos
```

---

## 2. APIs y Servicios Externos

### ✅ Supabase (ya configurado)
- [ ] Proyecto de Supabase (puede ser el mismo o nuevo)
- [ ] URL y Anon Key
- [ ] Auth configurado (email, Google)
- [ ] Base de datos con tablas
- [ ] Edge Functions desplegadas

### 🔐 Google OAuth (para login con Google)
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google+ API
- [ ] Crear OAuth Consent Screen
- [ ] Crear Credentials (OAuth Client ID)
- **Origins autorizados:**
  - `https://nexocrm.app`
  - `http://localhost:5173`
- **Redirect URIs:**
  - `https://nexocrm.app/auth/google/callback`
  - `http://localhost:5173/auth/google/callback`

### 📦 Google Calendar API (para sincronización)
- [ ] Habilitar Google Calendar API
- [ ] Same OAuth credentials que arriba
- [ ] Scopes: `https://www.googleapis.com/auth/calendar`

### 🗺️ Google Maps API (para ubicación de propiedades)
- [ ] Crear proyecto en Google Cloud
- [ ] Habilitar Maps JavaScript API
- [ ] Habilitar Geocoding API
- [ ] Crear API Key con restricciones:
  - HTTP referrers: `nexocrm.app/*`

### 📱 PWA Push Notifications (VAPID)
- [ ] Generar keys con: `npx web-push generate-vapid-keys`
- [ ] Guardar public key en `VITE_VAPID_PUBLIC_KEY`
- [ ] Guardar private key en Edge Function de notifications

### 💾 WhatsApp Business API (opcional)
- [ ] Meta Developer Account
- [ ] Crear App de WhatsApp
- [ ] Obtener Phone Number ID
- [ ] Obtener Access Token

### 📧 Email (SendGrid/Mailgun - opcional)
- [ ] Para emails de recovery y notificaciones
- [ ] API Key configurada en Edge Functions

---

## 3. Supabase - Configuración

### Base de Datos
- [ ] Ejecutar todas las migrations en `/supabase/migrations/`
- [ ] Verificar RLS policies
- [ ] Verificar triggers

### Edge Functions a desplegar:
```
supabase/functions/
├── capture-lead/          # Webhook para leads
├── daily-digest/         # Resumen diario
├── google-calendar-sync/ # Sincronización calendar
├── google-oauth/         # OAuth flow
├── invite-user/          # Invitar usuarios
├── notify-commission/    # Notificaciones comisiones
├── notify-lead-converted/# Lead convertido
├── notify-new-lead/      # Nuevo lead
├── notify-overdue-tasks/ # Tareas vencidas
├── pwa-manifest/         # PWA manifest
├── resolve-maps/        # Resolver links de maps
├── send-push/            # Enviar push notifications
└── telegram-bot/         # Bot de Telegram
```

### Auth
- [ ] Providers: Email/Password + Google
- [ ] Site URL: `https://nexocrm.app`
- [ ] Redirect URLs: `https://nexocrm.app/auth/callback`

---

## 4. Vercel - Configuración

### Proyecto Nuevo
1. [ ] Ir a Vercel Dashboard
2. [ ] Importar desde GitHub (`abrahamkohan/nexocrm`)
3. [ ] Framework Preset: Vite
4. [ ] Build Command: `npm run build`
5. [ ] Output Directory: `dist`

### Environment Variables en Vercel
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=https://nexocrm.app
```

### Dominio
1. [ ] Ir a Settings → Domains
2. [ ] Agregar `nexocrm.app`
3. [ ] Configurar DNS según instrucciones de Vercel
4. [ ] Esperar propagación (puede tomar hasta 24h)

### DNS Records típicos:
```
A @ 76.76.21.21
CNAME www @
```

---

## 5. GitHub - Configuración

### Repo Settings
1. [ ] Ir a Settings → Branches
2. [ ] Proteger rama `main` (requerir review)
3. [ ] Habilitar GitHub Actions

### Secrets (si usas Actions)
- [ ] `VERCEL_TOKEN` (de Vercel)
- `VERCEL_ORG_ID` 
- `VERCEL_PROJECT_ID`

---

## 6. Checklist de Deploy

### Pre-deploy
- [ ] Variables de entorno configuradas
- [ ] Supabase proyecto listo
- [ ] Edge Functions desplegadas
- [ ] Dominio comprado (nexocrm.app)

### Deploy
- [ ] Conectar Vercel con GitHub
- [ ] Deploy automático configurado
- [ ] Dominio conectado en Vercel
- [ ] SSL habilitado (automático en Vercel)

### Post-deploy
- [ ] Probar login con email
- [ ] Probar login con Google
- [ ] Probar creación de propiedad
- [ ] Probar création de cliente
- [ ] Probar Edge Functions
- [ ] Verificar PWA installable
- [ ] Test en mobile

---

## 7. Comandos Útiles

```bash
# Desplegar Edge Functions
supabase functions deploy --project-ref tu-ref

# Ver logs de Edge Functions
supabase functions logs nombre-funcion

# Regenerar tipos de Supabase
npx supabase gen types typescript --project-id tu-proyecto > src/types/database.ts
```

---

## 8. Arquitectura Multi-tenant

El sistema ya soporta multi-tenant. Para un nuevo dominio:

1. [ ] Crear registro en tabla `consultants`:
```sql
INSERT INTO consultants (uuid, nombre, subdomain, activo)
VALUES (gen_random_uuid(), 'NexoCRM', 'nexocrm', true);
```

2. [ ] Configurar subdomain en Supabase
3. [ ] El sistema automáticamente detectará el subdomain

---

## 9. Troubleshooting Común

| Problema | Solución |
|----------|----------|
| Auth redirect error | Verificar Site URL en Supabase |
| Maps no carga | Revisar API Key de Google |
| Edge Functions fallan | Ver logs en Supabase dashboard |
| Build fail en Vercel | Verificar node version (18+) |
| CORS errors | Agregar dominio a allowed origins |

---

## 10. Links Útiles

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com
- **Meta for Developers:** https://developers.facebook.com

---

*Documento generado automáticamente - NexoCRM Deployment Guide v1.0*