# 📊 Módulo Inteligencia de Mercado

> Sistema de análisis inmobiliario con IA integrado al CRM NexoCRM

**Versión:** 1.0.0  
**Fecha:** Abril 2026  
**Status:** ✅ En producción

---

## 🎯 Propósito

Generar análisis diarios del mercado inmobiliario paraguayo usando inteligencia artificial, permitiendo a los brokers tomar decisiones informadas y crear contenido de marketing basado en datos reales.

---

## ✨ Features

- 🔍 **Búsqueda automática** de noticias vía Tavily API
- 🤖 **Análisis con IA** usando Llama 3 70B (Groq)
- 🏢 **Multi-tenant** - Cada inmobiliaria ve solo sus datos
- 📱 **UI integrada** en el CRM - Sidebar → Sistema → Inteligencia IA
- 📝 **Resumen ejecutivo** - Estado del mercado en 2-3 oraciones
- 📰 **Titulares del día** - Hasta 5 noticias con fuentes
- 💡 **Señal para el inversor** - Consejo práctico concreto
- 🔄 **Un digest por día** - Evita duplicados automáticamente

---

## 📁 Estructura de Archivos

```
/Users/abrahamkohan/Proyecto Web/nexocrm/
├── docs/marketing-inteligencia/          ← Esta documentación
│   ├── README.md                          ← Este archivo
│   ├── arquitectura.md                    ← Flujo técnico
│   ├── api-reference.md                   ← Referencia de API
│   ├── database-schema.md                 ← Schema SQL
│   ├── guia-usuario.md                    ← Manual de usuario
│   └── troubleshooting.md                 ← Solución de problemas
│
├── supabase/
│   └── functions/
│       └── market-digest/
│           └── index.ts                   ← Edge Function
│
├── src/
│   ├── hooks/
│   │   └── useMarketDigest.ts             ← React Query hook
│   │
│   ├── pages/
│   │   └── InteligenciaMercadoPage.tsx    ← Página principal
│   │
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx                ← Modificado: agregado menú
│   │
│   └── router.tsx                         ← Modificado: agregada ruta
│
└── supabase/migrations/                   ← SQL ejecutado manualmente
```

---

## 🚀 Quick Start

### Para usuarios (Brokers)

1. Loguearse en el CRM como **admin**
2. En el sidebar, ir a **Sistema → Inteligencia IA**
3. Click en **"Actualizar"**
4. Esperar 5-10 segundos
5. Ver el análisis del día

### Para desarrolladores

Ver [`guia-desarrollador.md`](./guia-desarrollador.md)

---

## 🔧 Configuración

### Variables de Entorno (Supabase Secrets)

```bash
TAVILY_API_KEY=tvly-dev-xxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxx
```

Configurar en: Supabase Dashboard → Edge Functions → Secrets

---

## 📊 Costos Operativos

| Servicio | Costo mensual (estimado) |
|----------|-------------------------|
| Tavily API | Gratis (1,000 búsquedas) |
| Groq API | Gratis (30 req/min) |
| Supabase Edge Functions | Gratis (500K invocations) |
| **Total** | **$0/mes** |

Con uso de ~60 ejecuciones/mes (2 por día), el plan gratuito cubre todo.

---

## 🎨 UI/UX

### Pantalla principal

```
┌──────────────────────────────────────────────────────────────┐
│ Inteligencia de Mercado                              [↻ Actualizar] │
│ Análisis diario del mercado inmobiliario generado con IA      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [📈 Resumen ejecutivo]                                       │
│ El mercado de Asunción muestra incremento sostenido...       │
│                                                              │
│ [📰 Titulares del día]                                       │
│ 01 - Inversiones en CIT Luque superan USD 40M          ↗     │
│ 02 - Demanda de alquileres sube 8% en zona norte       ↗     │
│ ...                                                          │
│                                                              │
│ [💡 Señal para el inversor]  ← Fondo ámbar                   │
│ Momento para posicionar off-plan en Luque antes de Q2        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔒 Seguridad

- **RLS (Row Level Security)** en tabla `market_digests`
- Solo accesible para **admins** (`RequireRole role="admin"`)
- Cada tenant ve solo sus datos (`consultant_id`)
- Edge Function usa **service role key** para escribir

---

## 📞 Soporte

**Problemas comunes:**

- ❌ "No hay análisis para hoy" → Click en "Actualizar"
- ❌ "Error al actualizar" → Revisar API keys en Supabase
- ❌ No aparece el menú → Verificar que el usuario sea admin

Ver [`troubleshooting.md`](./troubleshooting.md) para más detalles.

---

## 📝 Changelog

### v1.0.0 (Abril 2026)
- ✅ Lanzamiento inicial
- ✅ Integración Tavily + Groq
- ✅ UI completa en React
- ✅ Multi-tenant implementado

---

**Documentación técnica completa:**

- [`arquitectura.md`](./arquitectura.md) - Flujo de datos y componentes
- [`api-reference.md`](./api-reference.md) - Referencia de API
- [`database-schema.md`](./database-schema.md) - Schema SQL completo
- [`guia-usuario.md`](./guia-usuario.md) - Manual paso a paso
- [`troubleshooting.md`](./troubleshooting.md) - Solución de problemas
