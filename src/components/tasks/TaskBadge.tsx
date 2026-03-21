// src/components/tasks/TaskBadge.tsx
import { cn } from '@/lib/utils'
import { getUrgency } from '@/lib/tasks'
import { urgencyColors } from '@/utils/taskColors'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

interface TaskBadgeProps {
  task: TaskRow
  className?: string
}

/** Formatea due_date como "15 abr" para tareas upcoming */
function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' })
    .format(new Date(isoDate))
    .replace('.', '')  // quita el punto que pone es-PY en algunos meses
}

export function TaskBadge({ task, className }: TaskBadgeProps) {
  const urgency = getUrgency(task)
  const colors  = urgencyColors[urgency]

  const label =
    urgency === 'upcoming'
      ? formatShortDate(task.due_date)
      : colors.badge

  if (!label) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        colors.text,
        colors.border,
        'bg-transparent',
        className
      )}
    >
      {label}
    </span>
  )
}
