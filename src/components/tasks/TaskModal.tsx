// src/components/tasks/TaskModal.tsx
// Bottom sheet para crear o editar una tarea.
// Siempre side="bottom". Nunca Dialog centrado.

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Loader2, Phone, MapPin, Mail, Video } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useCreateTask, useUpdateTask, useTask } from '@/hooks/useTasks'
import { useClient } from '@/hooks/useClients'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type TaskRow    = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskType   = TaskRow['type']
type Context    = TaskRow['context']
type Priority   = TaskRow['priority']
type Recurrence = NonNullable<TaskRow['recurrence']>

// ── Chips de tipo ─────────────────────────────────────────────────────────

const TYPE_CHIPS: { value: TaskType; icon: React.ElementType; label: string }[] = [
  { value: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { value: 'call',     icon: Phone,         label: 'Llamar'   },
  { value: 'visit',    icon: MapPin,         label: 'Visita'   },
  { value: 'email',    icon: Mail,           label: 'Email'    },
  { value: 'meeting',  icon: Video,          label: 'Reunión'  },
]

const CONTEXT_OPTIONS: { value: Context; label: string }[] = [
  { value: 'lead',      label: 'Lead'       },
  { value: 'property',  label: 'Propiedad'  },
  { value: 'admin',     label: 'Admin'      },
  { value: 'marketing', label: 'Marketing'  },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low',    label: 'Baja'  },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta'  },
]

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none',    label: 'Sin repetición' },
  { value: 'weekly',  label: 'Semanal'        },
  { value: 'monthly', label: 'Mensual'        },
  { value: 'yearly',  label: 'Anual'          },
]

// ── Helpers de fecha ──────────────────────────────────────────────────────

function toInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromInputValue(val: string): string {
  const [y, mo, d] = val.split('-').map(Number)
  return new Date(y, mo - 1, d, 12, 0, 0).toISOString()
}

// ── Props ─────────────────────────────────────────────────────────────────

interface DefaultValues {
  context?:     Context
  lead_id?:     string
  property_id?: string
}

interface TaskModalProps {
  isOpen:         boolean
  onClose:        () => void
  taskId?:        string
  defaultValues?: DefaultValues
  agencyName?:    string
}

// ── Estado del formulario ─────────────────────────────────────────────────

interface FormState {
  title:        string
  due_date:     string
  type:         TaskType
  context:      Context
  priority:     Priority
  notes:        string
  recurrence:   Recurrence
  meet_link:    string
}

function initialForm(defaults?: DefaultValues): FormState {
  return {
    title:      '',
    due_date:   toInputValue(new Date()),
    type:       'whatsapp',
    context:    defaults?.context ?? 'lead',
    priority:   'medium',
    notes:      '',
    recurrence: 'none',
    meet_link:  '',
  }
}

// ── Estilos reutilizables ─────────────────────────────────────────────────

const inputCls = 'w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37] transition-colors'
const labelCls = 'text-zinc-500 text-xs font-medium tracking-wider uppercase'

// ── Componente ─────────────────────────────────────────────────────────────

export function TaskModal({
  isOpen,
  onClose,
  taskId,
  defaultValues,
  agencyName = 'Kohan & Campos',
}: TaskModalProps) {
  const { session }    = useAuth()
  const currentUserId  = session?.user?.id ?? ''

  const isEdit = !!taskId
  const { data: existingTask, isLoading: loadingTask } = useTask(taskId ?? '')
  const { data: lead } = useClient(defaultValues?.lead_id ?? existingTask?.lead_id ?? '')

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { openWhatsApp, getTemplate } = useWhatsApp()

  const [form,     setForm]     = useState<FormState>(() => initialForm(defaultValues))
  const [moreOpen, setMoreOpen] = useState(false)
  const isSaving = createTask.isPending || updateTask.isPending

  useEffect(() => {
    if (isOpen && isEdit && existingTask) {
      setForm({
        title:      existingTask.title,
        due_date:   toInputValue(new Date(existingTask.due_date)),
        type:       existingTask.type,
        context:    existingTask.context,
        priority:   existingTask.priority,
        notes:      existingTask.notes ?? '',
        recurrence: existingTask.recurrence ?? 'none',
        meet_link:  existingTask.meet_link ?? '',
      })
    } else if (isOpen && !isEdit) {
      setForm(initialForm(defaultValues))
      setMoreOpen(false)
    }
  }, [isOpen, isEdit, existingTask, defaultValues])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(withWhatsApp: boolean) {
    if (!form.title.trim() || !form.due_date) return

    const payload: Partial<TaskInsert> = {
      title:       form.title.trim(),
      due_date:    fromInputValue(form.due_date),
      type:        form.type,
      context:     form.context,
      priority:    form.priority,
      notes:       form.notes.trim() || null,
      recurrence:  form.recurrence,
      meet_link:   form.meet_link.trim() || null,
      lead_id:     defaultValues?.lead_id ?? existingTask?.lead_id ?? null,
      property_id: defaultValues?.property_id ?? existingTask?.property_id ?? null,
    }

    if (isEdit && taskId) {
      updateTask.mutate({ id: taskId, input: payload })
    } else {
      createTask.mutate({
        ...payload,
        assigned_to: currentUserId,
        created_by:  currentUserId,
        title:       payload.title!,
        due_date:    payload.due_date!,
      } as TaskInsert)
    }

    if (withWhatsApp && lead?.phone) {
      const msg = getTemplate(form.title, {
        leadName:     lead.full_name,
        agencyName,
        taskPriority: form.priority,
      })
      openWhatsApp(lead.phone, msg)
    }

    onClose()
  }

  const lockedLeadId     = defaultValues?.lead_id     ?? (isEdit ? existingTask?.lead_id     : null)
  const lockedPropertyId = defaultValues?.property_id ?? (isEdit ? existingTask?.property_id : null)
  const hasLeadPhone     = form.context === 'lead' && !!lead?.phone
  const canSave          = form.title.trim().length > 0 && form.due_date.length > 0

  if (isEdit && loadingTask) return null

  return (
    <Sheet open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] flex flex-col p-0 border-zinc-800 bg-zinc-950"
        style={{ backgroundColor: 'rgb(9,9,11)' }}
      >
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-700" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">

          {/* Título del sheet */}
          <p className="text-zinc-100 text-base font-semibold mb-5">
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </p>

          <div className="flex flex-col gap-4">

            {/* ── Título ── */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Título *</label>
              <input
                type="text"
                placeholder="Ej: Seguimiento inicial"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className={inputCls}
                autoFocus
              />
            </div>

            {/* ── Fecha ── */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Fecha *</label>
              <input
                type="date"
                value={form.due_date}
                min={toInputValue(new Date())}
                onChange={e => set('due_date', e.target.value)}
                className={inputCls}
              />
              {form.due_date && (
                <p className="text-xs text-zinc-500">
                  {new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })
                    .format(new Date(form.due_date + 'T12:00:00'))}
                </p>
              )}
            </div>

            {/* ── Tipo (chips) ── */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_CHIPS.map(chip => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => set('type', chip.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                      form.type === chip.value
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    )}
                  >
                    <chip.icon className="w-3.5 h-3.5" />
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Contexto ── */}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Contexto</label>
              <select
                value={form.context}
                onChange={e => set('context', e.target.value as Context)}
                className={inputCls}
              >
                {CONTEXT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Lead readonly */}
            {lockedLeadId && lead && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Lead</label>
                <div className="flex items-center h-11 px-3 rounded-lg border border-zinc-800 bg-zinc-800/50 text-sm text-zinc-400">
                  {lead.full_name}
                </div>
              </div>
            )}

            {/* Propiedad readonly */}
            {lockedPropertyId && !lockedLeadId && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Propiedad</label>
                <div className="flex items-center h-11 px-3 rounded-lg border border-zinc-800 bg-zinc-800/50 text-sm text-zinc-400">
                  {lockedPropertyId}
                </div>
              </div>
            )}

            {/* Meet link — solo si type = meeting */}
            {form.type === 'meeting' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Link de reunión (Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={form.meet_link}
                  onChange={e => set('meet_link', e.target.value)}
                  className={inputCls}
                />
              </div>
            )}

            {/* ── Más opciones ── */}
            <div className="border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {moreOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {moreOpen ? 'Menos opciones' : 'Más opciones'}
              </button>

              {moreOpen && (
                <div className="flex flex-col gap-4 mt-4">

                  {/* Prioridad */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Prioridad</label>
                    <div className="flex gap-2">
                      {PRIORITY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set('priority', opt.value)}
                          className={cn(
                            'flex-1 h-11 rounded-lg border text-xs font-medium transition-all',
                            form.priority === opt.value
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Notas</label>
                    <textarea
                      rows={2}
                      placeholder="Contexto adicional..."
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                    />
                  </div>

                  {/* Recurrencia */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Repetición</label>
                    <select
                      value={form.recurrence}
                      onChange={e => set('recurrence', e.target.value as Recurrence)}
                      className={inputCls}
                    >
                      {RECURRENCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Footer fijo ── */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 px-5 py-4 flex flex-col gap-2" style={{ backgroundColor: 'rgb(9,9,11)' }}>
          {hasLeadPhone && (
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={() => handleSave(true)}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#25D366' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Guardar + WhatsApp
            </button>
          )}
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => handleSave(false)}
            className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#D4AF37', color: '#000' }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
        </div>

      </SheetContent>
    </Sheet>
  )
}
