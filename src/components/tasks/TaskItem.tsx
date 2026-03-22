// src/components/tasks/TaskItem.tsx
// Card optimizada mobile-first — más compacta, accionable y clara.

import { useRef, useState } from 'react'
import { MessageCircle, Phone, MapPin, Mail, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { urgencyColors } from '@/utils/taskColors'
import { getUrgency } from '@/lib/tasks'
import { TaskBadge } from './TaskBadge'
import type { Database } from '@/types/database'

type TaskRow = Database['public']['Tables']['tasks']['Row']

export interface TaskLead {
  id: string
  full_name: string
  phone: string | null
}

interface TaskItemProps {
  task: TaskRow
  lead?: TaskLead
  agencyName?: string
  onComplete: (task: TaskRow) => void
  onReschedule: (task: TaskRow) => void
  onOpenPeek?: (leadId: string) => void
}

// ── Config ─────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  call: Phone,
  visit: MapPin,
  email: Mail,
  meeting: Video,
}

const TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamar',
  visit: 'Visita',
  email: 'Email',
  meeting: 'Reunión',
}

const CONTEXT_LABEL: Record<string, string> = {
  lead: 'lead',
  property: 'propiedad',
  admin: 'admin',
  marketing: 'marketing',
}

const PRIORITY_DOT: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '⚪',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
}

// ── Componente ─────────────────────────────────────────

export function TaskItem({
  task,
  lead,
  agencyName = 'Kohan & Campos',
  onComplete,
  onReschedule,
  onOpenPeek,
}: TaskItemProps) {
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const urgency = getUrgency(task)
  const colors = urgencyColors[urgency]
  const isClosed = urgency === 'closed'
  const isLead = task.context === 'lead'
  const hasPhone = isLead && !!lead?.phone
  const hasMeet = task.type === 'meeting' && !!task.meet_link

  const TypeIcon = TYPE_ICON[task.type] ?? MessageCircle

  // ── Swipe ────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null)
  const [swipeHint, setSwipeHint] = useState<'complete' | 'reschedule' | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff > 40) setSwipeHint('complete')
    else if (diff < -40) setSwipeHint('reschedule')
    else setSwipeHint(null)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff > 60) onComplete(task)
    else if (diff < -60) onReschedule(task)
    touchStartX.current = null
    setSwipeHint(null)
  }

  // ── WhatsApp ─────────────────────────────────────────
  function handleWhatsApp() {
    if (!lead?.phone) return
    const message = getTemplate(task.title, {
      leadName: lead.full_name,
      agencyName,
      taskPriority: task.priority,
    })
    openWhatsApp(lead.phone, message, task.id)
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-2.5 flex flex-col gap-2 transition-all duration-150',
        colors.border,
        isClosed && 'opacity-50',
        swipeHint === 'complete' && 'translate-x-1 border-green-500/60',
        swipeHint === 'reschedule' && '-translate-x-1 border-yellow-400/60'
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {TYPE_LABEL[task.type]}
          </span>
        </div>

        <TaskBadge task={task} />
      </div>

      {/* LEAD */}
      {isLead && lead && (
        <button
          onClick={() => onOpenPeek?.(lead.id)}
          className="text-xs font-semibold text-[#D4AF37] text-left truncate"
        >
          {lead.full_name}
        </button>
      )}

      {/* TITULO */}
      <p
        className={cn(
          'text-sm font-medium leading-tight',
          isClosed ? 'text-muted-foreground line-through' : 'text-foreground'
        )}
      >
        {task.title}
      </p>

      {/* META */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{PRIORITY_DOT[task.priority]}</span>
        <span>
          {CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {/* ACCIONES */}
      <div className="flex items-center gap-2 pt-1">
        {hasPhone && !isClosed && (
          <button
            onClick={handleWhatsApp}
            className="flex-1 h-8 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            WhatsApp
          </button>
        )}

        {hasPhone && !isClosed && (
          <a
            href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
            className="flex-1 h-8 flex items-center justify-center rounded-lg text-xs font-semibold bg-white/5 text-white/70"
          >
            Llamar
          </a>
        )}

        {hasMeet && !isClosed && (
          <a
            href={task.meet_link!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-8 flex items-center justify-center rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400"
          >
            Meet
          </a>
        )}

        <button
          onClick={() => onComplete(task)}
          disabled={isClosed}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-semibold',
            isClosed
              ? 'bg-zinc-800/50 text-zinc-600'
              : 'bg-[#D4AF37] text-black'
          )}
        >
          {isClosed ? 'Cerrado' : 'Resolver'}
        </button>
      </div>
    </div>
  )
}
