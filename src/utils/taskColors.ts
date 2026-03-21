// src/utils/taskColors.ts
// Clases Tailwind por urgencia de tarea.
// getUrgency() vive en src/lib/tasks.ts — nunca se persiste en DB.

import type { TaskUrgency } from '@/lib/tasks'

interface UrgencyStyle {
  text:   string   // color del texto principal
  border: string   // color del borde de la card
  badge:  string   // texto del badge
}

export const urgencyColors: Record<TaskUrgency, UrgencyStyle> = {
  overdue:  { text: 'text-red-500',    border: 'border-red-500',    badge: 'Atrasado'  },
  today:    { text: 'text-yellow-400', border: 'border-yellow-400', badge: 'Hoy'       },
  upcoming: { text: 'text-zinc-400',   border: 'border-zinc-700',   badge: ''          },
  closed:   { text: 'text-zinc-600',   border: 'border-zinc-800',   badge: 'Cerrado'   },
}
