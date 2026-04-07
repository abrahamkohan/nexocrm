// src/hooks/useWhatsApp.ts
// Toda la lógica de WhatsApp para el módulo de tareas.
// Reutiliza cleanDigits() de src/lib/phone.ts.

import { cleanDigits } from '@/lib/phone'
import { useMarkContacted } from '@/hooks/useTasks'

// ── Templates por tipo de tarea ───────────────────────────────────────────

type TemplateVars = {
  leadName:        string
  agencyName:      string
  propertyAddress?: string
  taskPriority?:   'low' | 'medium' | 'high'
}

const TEMPLATES: Record<string, (v: TemplateVars) => string> = {
  'Seguimiento inicial': ({ leadName, agencyName }) =>
    `Hola ${leadName}, te contacto de ${agencyName}. Quería comunicarme con vos en relación a tu consulta. ¿Cuándo podemos hablar?`,

  'Enviar propuesta': ({ leadName, agencyName }) =>
    `Hola ${leadName}, te envío la propuesta que estuvimos coordinando desde ${agencyName}. Cualquier consulta, avisame.`,

  'Confirmar reunión': ({ leadName }) =>
    `Hola ${leadName}, te confirmo nuestra reunión. ¿Sigue bien para vos?`,

  'Seguimiento': ({ leadName, agencyName }) =>
    `Hola ${leadName}, ¿cómo estás? Te contacto de ${agencyName} para ver cómo seguimos.`,

  'Visita propiedad': ({ leadName, propertyAddress }) =>
    propertyAddress
      ? `Hola ${leadName}, te escribo para coordinar la visita a ${propertyAddress}. ¿Cuándo te vendría bien?`
      : `Hola ${leadName}, te escribo para coordinar la visita. ¿Cuándo te vendría bien?`,
}

/** Fallback genérico */
function defaultTemplate({ leadName, agencyName }: TemplateVars, taskTitle: string): string {
  return `Hola ${leadName}, te contacto de ${agencyName} por: ${taskTitle}`
}

// ── Limpiar número paraguayo → wa.me/595XXXXXXXXX ─────────────────────────
// Reutiliza cleanDigits() de phone.ts para quitar caracteres no numéricos,
// luego elimina el 0 inicial y el prefijo 595 si ya viene incluido.

function cleanParaguayanPhone(phone: string): string {
  const digits = cleanDigits(phone)           // quita todo lo que no sea número
  if (digits.startsWith('595')) return digits  // ya tiene prefijo país
  return digits.replace(/^0/, '')              // quita 0 inicial local
}

// ── Hook principal ─────────────────────────────────────────────────────────

export function useWhatsApp() {
  const markContacted = useMarkContacted()

  /**
   * Construye la URL wa.me con número paraguayo + mensaje codificado.
   * Devuelve null si no hay teléfono.
   */
  function buildUrl(phone: string, message: string): string | null {
    if (!phone) return null
    const clean = cleanParaguayanPhone(phone)
    if (!clean) return null
    return `https://wa.me/595${clean}?text=${encodeURIComponent(message)}`
  }

  /**
   * Devuelve el template pre-cargado para el título de tarea dado.
   * Si no hay match exacto, usa el fallback genérico.
   */
  function getTemplate(taskTitle: string, vars: TemplateVars): string {
    const fn = TEMPLATES[taskTitle]
    return fn ? fn(vars) : defaultTemplate(vars, taskTitle)
  }

  /**
   * Abre WhatsApp con el mensaje pre-cargado.
   * Si se pasa taskId, marca la tarea como 'contacted' (optimistic update).
   */
  function openWhatsApp(phone: string, message: string, taskId?: string): void {
    const url = buildUrl(phone, message)
    if (!url) return
    if (taskId) markContacted.mutate(taskId)
    window.location.href = url
  }

  return { buildUrl, getTemplate, openWhatsApp }
}
