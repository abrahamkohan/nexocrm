// src/components/tasks/TaskItem.tsx

import { useRef, useState } from 'react'
import { MessageCircle, Phone, MapPin, Mail, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWhatsApp } from '@/hooks/useWhatsApp'
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
  const isClosed = urgency === 'closed'
  const isLead = task.context === 'lead'
  const hasPhone = isLead && !!lead?.phone
  const hasMeet = task.type === 'meeting' && !!task.meet_link

  const TypeIcon = TYPE_ICON[task.type] ?? MessageCircle

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

  function handleWhatsApp() {
    if (!lead?.phone) return
    const message = getTemplate(task.title, {
      leadName: lead.full_name,
      agencyName,
      taskPriority: task.priority,
    })
    openWhatsApp(lead.phone, message, task.id)
  }

  const date = task.due_date ? new Date(task.due_date) : new Date()
  const day = date.getDate()
  const month = date
    .toLocaleDateString('es-PY', { month: 'short' })
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-white p-4 flex flex-col gap-3 transition-all duration-150',
        'shadow-[0_10px_25px_rgba(0,0,0,0.08)]',
        'active:scale-[0.98]',
        isClosed && 'opacity-50',
        swipeHint === 'complete' && 'translate-x-1',
        swipeHint === 'reschedule' && '-translate-x-1'
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TypeIcon className="w-4 h-4" />
          <span className="font-medium">{TYPE_LABEL[task.type]}</span>
        </div>

        {/* FECHA PRO */}
        <div className="
          w-14 h-14
          rounded-xl
          flex flex-col items-center justify-center
          leading-none
          bg-gradient-to-br from-[#FFB86B] to-[#FF7A7A]
          text-white
          shadow-[0_6px_16px_rgba(0,0,0,0.15)]
        ">
          <span className="text-[10px] font-medium opacity-80">
            {month}
          </span>
          <span className="text-lg font-bold">
            {day}
          </span>
        </div>
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
          'text-base font-semibold leading-tight',
          isClosed ? 'text-gray-400 line-through' : 'text-black'
        )}
      >
        {task.title}
      </p>

      {/* META */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{PRIORITY_DOT[task.priority]}</span>
        <span>
          {CONTEXT_LABEL[task.context]} · {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {/* ACCIONES */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {hasPhone && !isClosed && (
          <button
            onClick={handleWhatsApp}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: '#25D366' }}
          >
            WhatsApp
          </button>
        )}

        {hasPhone && !isClosed && (
          <a
            href={`tel:${lead!.phone!.replace(/\s/g, '')}`}
            className="h-8 px-3 flex items-center justify-center rounded-lg text-xs font-semibold bg-gray-100 text-gray-700"
          >
            Llamar
          </a>
        )}

        {hasMeet && !isClosed && (
          <a
            href={task.meet_link!}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 flex items-center justify-center rounded-lg text-xs font-semibold bg-blue-100 text-blue-600"
          >
            Meet
          </a>
        )}

        <button
          onClick={() => onComplete(task)}
          disabled={isClosed}
          className={cn(
            'h-8 px-3 rounded-full text-xs font-semibold transition',
            isClosed
              ? 'bg-gray-200 text-gray-400'
              : 'bg-black/5 text-black/70'
          )}
        >
          {isClosed ? 'Cerrado' : '✓ Hecho'}
        </button>
      </div>
    </div>
  )
}
