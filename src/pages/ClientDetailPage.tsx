// src/pages/ClientDetailPage.tsx
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, Phone, Mail, Edit2, NotebookPen, ClipboardList,
  MessageCircle, CheckCircle2, Clock, AlertCircle, Star,
  BarChart2, FileText, Download, Loader2, Trash2,
} from 'lucide-react'
import { useClient, useUpdateClient } from '@/hooks/useClients'
import { useNotesByClient, useUpdateNote, useDeleteNote, useCreateNote } from '@/hooks/useNotes'
import { useTasksByLead } from '@/hooks/useTasks'
import { useSimulationsByClient, useDeleteSimulation, useGenerateReport } from '@/hooks/useSimulations'
import { usePresupuestosByClient } from '@/hooks/usePresupuestos'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useProjects } from '@/hooks/useProjects'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ClientForm, type ClientFormValues } from '@/components/clients/ClientForm'
import { Modal } from '@/components/ui/modal'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { extractTitle, extractSnippet } from '@/lib/notes'
import { getUrgency } from '@/lib/tasks'
import { getReportUrl } from '@/lib/pdfService'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type NoteRow   = Database['public']['Tables']['notes']['Row']
type TaskRow   = Database['public']['Tables']['tasks']['Row']
type SimRow    = Database['public']['Tables']['simulations']['Row']
type PRow      = Database['public']['Tables']['presupuestos']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Activity union type ──────────────────────────────────────────────────────

type ActivityItem =
  | { type: 'note';       data: NoteRow; date: string }
  | { type: 'task';       data: TaskRow; date: string }
  | { type: 'simulation'; data: SimRow;  date: string }
  | { type: 'budget';     data: PRow;    date: string }

type Tab = 'actividad' | 'notas' | 'tareas' | 'simulaciones' | 'presupuestos'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days  < 7)  return `${days}d`
  return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })
}

function fmtDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-PY', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(dateStr))
}

function fmtUsd(cents: number): string {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(cents / 100)
}

const TASK_TYPE_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', call: 'Llamada', meeting: 'Reunión',
  email: 'Email', visit: 'Visita',
}

const ESTADO_CLS: Record<string, string> = {
  nuevo:       'bg-blue-50 text-blue-600',
  contactado:  'bg-yellow-50 text-yellow-700',
  respondio:   'bg-green-50 text-green-700',
  no_responde: 'bg-gray-100 text-gray-500',
  descartado:  'bg-red-50 text-red-600',
  convertido:  'bg-emerald-50 text-emerald-700',
}

// ─── Activity row variants ─────────────────────────────────────────────────────

function ActivityNoteRow({ note, onOpen }: { note: NoteRow; onOpen: () => void }) {
  const title   = extractTitle(note.content)
  const snippet = extractSnippet(note.content)
  return (
    <button onClick={onOpen}
      className="w-full text-left flex gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 px-1 rounded-lg transition-colors"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center mt-0.5">
        <NotebookPen className="w-4 h-4 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
        {snippet && <p className="text-xs text-gray-400 truncate mt-0.5">{snippet}</p>}
      </div>
      <span className="flex-shrink-0 text-[11px] text-gray-400 mt-1">{timeAgo(note.updated_at)}</span>
    </button>
  )
}

function ActivityTaskRow({ task }: { task: TaskRow }) {
  const urgency = getUrgency(task)
  const icon = urgency === 'overdue'
    ? <AlertCircle className="w-4 h-4 text-red-400" />
    : urgency === 'today'
    ? <Clock className="w-4 h-4 text-amber-500" />
    : task.status === 'closed'
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : <ClipboardList className="w-4 h-4 text-blue-500" />

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 px-1">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
        <div className="flex gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">{TASK_TYPE_LABEL[task.type] ?? task.type}</span>
          {task.status === 'closed' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Cerrada</span>
          )}
          {urgency === 'overdue' && task.status !== 'closed' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Vencida</span>
          )}
        </div>
      </div>
      <span className="flex-shrink-0 text-[11px] text-gray-400 mt-1">{timeAgo(task.updated_at)}</span>
    </div>
  )
}

function ActivitySimRow({ sim }: { sim: SimRow }) {
  const snap    = sim.snapshot_project  as Record<string, unknown>
  const snapTyp = sim.snapshot_typology as Record<string, unknown>
  const project = (snap?.name    as string) ?? 'Proyecto'
  const typology = (snapTyp?.name as string) ?? 'Tipología'
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 px-1">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mt-0.5">
        <BarChart2 className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">Simulación — {project}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{typology}</p>
      </div>
      <span className="flex-shrink-0 text-[11px] text-gray-400 mt-1">{timeAgo(sim.created_at)}</span>
    </div>
  )
}

function ActivityBudgetRow({ budget }: { budget: PRow }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 px-1">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mt-0.5">
        <FileText className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">Presupuesto — {budget.unidad_nombre}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtUsd(budget.precio_usd)}</p>
      </div>
      <span className="flex-shrink-0 text-[11px] text-gray-400 mt-1">{timeAgo(budget.created_at)}</span>
    </div>
  )
}

// ─── Simulaciones tab ─────────────────────────────────────────────────────────

function SimulacionesTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { data: sims = [], isLoading } = useSimulationsByClient(clientId)
  const deleteSim    = useDeleteSimulation(clientId)
  const generateReport = useGenerateReport(clientId)

  if (isLoading) return <p className="text-sm text-gray-400 text-center py-10">Cargando...</p>
  if (sims.length === 0) return (
    <div className="text-center py-14">
      <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Sin simulaciones</p>
      <p className="text-xs text-gray-300 mt-1">Generá una desde el Simulador</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {sims.map(sim => {
        const snap    = sim.snapshot_project  as Record<string, unknown>
        const snapTyp = sim.snapshot_typology as Record<string, unknown>
        const project  = (snap?.name    as string) ?? 'Proyecto'
        const typology = (snapTyp?.name as string) ?? 'Tipología'
        const isGenerating = generateReport.isPending && (generateReport.variables as { sim: SimRow })?.sim?.id === sim.id

        return (
          <div key={sim.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">{project} — {typology}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(sim.created_at)}</p>
              </div>
              <button
                onClick={() => { if (confirm('¿Eliminar simulación?')) deleteSim.mutate(sim.id) }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => generateReport.mutate({ sim, clientName })}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isGenerating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</>
                  : <><FileText className="w-3.5 h-3.5" /> Generar informe</>
                }
              </button>
              {sim.report_path && (
                <a
                  href={getReportUrl(sim.report_path)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Presupuestos tab ─────────────────────────────────────────────────────────

function PresupuestosTab({ clientId }: { clientId: string }) {
  const { data: budgets = [], isLoading } = usePresupuestosByClient(clientId)

  if (isLoading) return <p className="text-sm text-gray-400 text-center py-10">Cargando...</p>
  if (budgets.length === 0) return (
    <div className="text-center py-14">
      <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Sin presupuestos</p>
      <p className="text-xs text-gray-300 mt-1">Creá uno desde la sección Presupuestos</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {budgets.map(b => (
        <div key={b.id} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">{b.unidad_nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.created_at)}</p>
            </div>
            <span className="text-sm font-bold text-gray-700">{fmtUsd(b.precio_usd)}</span>
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            {b.cuotas_cantidad > 0 && <span>{b.cuotas_cantidad} cuotas</span>}
            {b.cochera_nombre  && <span>+ {b.cochera_nombre}</span>}
          </div>
          <a
            href={`/presupuestos/${b.id}/pdf`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Ver PDF
          </a>
        </div>
      ))}
    </div>
  )
}

// ─── NotesList ────────────────────────────────────────────────────────────────

function NotesList({
  notes, onOpen, onArchive, onDelete, onFlag,
}: {
  notes: NoteRow[]
  onOpen:    (n: NoteRow) => void
  onArchive: (id: string) => void
  onDelete:  (id: string) => void
  onFlag:    (id: string, f: boolean) => void
}) {
  if (notes.length === 0) return (
    <div className="text-center py-14">
      <NotebookPen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Sin notas para este cliente</p>
    </div>
  )
  return (
    <div className="flex flex-col">
      {notes.map(note => {
        const title   = extractTitle(note.content)
        const snippet = extractSnippet(note.content)
        return (
          <div key={note.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group">
            <button onClick={() => onOpen(note)} className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
                {note.is_flagged && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
              </div>
              {snippet && <p className="text-xs text-gray-400 truncate mt-0.5">{snippet}</p>}
              <p className="text-[11px] text-gray-300 mt-1">{timeAgo(note.updated_at)}</p>
            </button>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onFlag(note.id, !note.is_flagged)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-amber-400 hover:bg-amber-50 transition-colors">
                <Star className={`w-3.5 h-3.5 ${note.is_flagged ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <button onClick={() => onArchive(note.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs">↓</button>
              <button onClick={() => { if (confirm('¿Eliminar nota?')) onDelete(note.id) }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-xs">✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── TasksList ────────────────────────────────────────────────────────────────

function TasksList({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) return (
    <div className="text-center py-14">
      <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Sin tareas para este cliente</p>
    </div>
  )
  const open   = tasks.filter(t => t.status !== 'closed')
  const closed = tasks.filter(t => t.status === 'closed')
  return (
    <div className="flex flex-col">
      {open.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Pendientes</p>
          {open.map(t => <ActivityTaskRow key={t.id} task={t} />)}
        </>
      )}
      {closed.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 mt-5">Cerradas</p>
          {closed.map(t => <ActivityTaskRow key={t.id} task={t} />)}
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()

  const [tab,        setTab]      = useState<Tab>('actividad')
  const [editOpen,   setEditOpen] = useState(false)
  const [taskOpen,   setTaskOpen] = useState(false)
  const [editNote,   setEditNote] = useState<NoteRow | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: client, isLoading } = useClient(id)
  const { data: notes    = []     } = useNotesByClient(id)
  const { data: tasks    = []     } = useTasksByLead(id)
  const { data: sims     = []     } = useSimulationsByClient(id)
  const { data: budgets  = []     } = usePresupuestosByClient(id)
  const { data: projects = []     } = useProjects()

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createNote   = useCreateNote()
  const updateNote   = useUpdateNote()
  const deleteNote   = useDeleteNote()
  const updateClient = useUpdateClient()

  // ── Activity timeline ─────────────────────────────────────────────────────
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...notes.map(n   => ({ type: 'note'       as const, data: n, date: n.updated_at })),
      ...tasks.map(t   => ({ type: 'task'       as const, data: t, date: t.updated_at })),
      ...sims.map(s    => ({ type: 'simulation' as const, data: s, date: s.created_at })),
      ...budgets.map(b => ({ type: 'budget'     as const, data: b, date: b.created_at })),
    ]
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [notes, tasks, sims, budgets])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleNewNote() {
    const note = await createNote.mutateAsync({ content: '', location: 'inbox', client_id: id })
    setEditNote(note)
  }

  function handleArchive(noteId: string) { updateNote.mutate({ id: noteId, input: { location: 'archive' } }) }
  function handleDeleteNote(noteId: string) { deleteNote.mutate(noteId) }
  function handleFlag(noteId: string, flagged: boolean) { updateNote.mutate({ id: noteId, input: { is_flagged: flagged } }) }

  async function handleEditClient(values: ClientFormValues) {
    try {
      await updateClient.mutateAsync({
        id,
        input: {
          full_name:   values.full_name,
          email:       values.email  || null,
          phone:       values.phone  || null,
          nationality: values.nationality || null,
          notes:       values.notes  || null,
          tipo:        values.tipo,
          fuente:      values.fuente || null,
          apodo:       values.apodo  || null,
        },
      })
      toast.success('Guardado')
      setEditOpen(false)
    } catch {
      toast.error('Error al guardar')
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !client) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Cargando...</div>
  )

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials  = client.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const estadoCls = client.estado ? (ESTADO_CLS[client.estado] ?? 'bg-gray-100 text-gray-500') : ''
  const openTasks = tasks.filter(t => t.status !== 'closed').length

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'actividad',    label: 'Actividad',    count: activity.length },
    { key: 'notas',        label: 'Notas',        count: notes.length },
    { key: 'tareas',       label: 'Tareas',       count: openTasks > 0 ? openTasks : tasks.length },
    { key: 'simulaciones', label: 'Simulaciones', count: sims.length },
    { key: 'presupuestos', label: 'Presupuestos', count: budgets.length },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-14">
        <button onClick={() => navigate('/clientes')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[15px]">Clientes</span>
        </button>
      </div>

      {/* Client card */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[18px]"
            style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">{client.full_name}</h1>
                {client.apodo && <p className="text-sm text-gray-400 mt-0.5 italic">"{client.apodo}"</p>}
              </div>
              <button onClick={() => setEditOpen(true)}
                className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                client.tipo === 'cliente' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
              }`}>
                {client.tipo === 'cliente' ? 'Cliente' : 'Lead'}
              </span>
              {client.estado && (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${estadoCls}`}>
                  {client.estado}
                </span>
              )}
              {client.fuente && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{client.fuente}</span>
              )}
              {client.nationality && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{client.nationality}</span>
              )}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-4 flex flex-col gap-2.5">
          {client.phone && (
            <div className="flex items-center gap-3">
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {client.phone}
              </a>
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${client.full_name}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
              >
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>
            </div>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {client.email}
            </a>
          )}
        </div>

        {client.notes && (
          <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
            {client.notes}
          </p>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <button onClick={handleNewNote} disabled={createNote.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
            <NotebookPen className="w-4 h-4" /> Nueva nota
          </button>
          <button onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
            <ClipboardList className="w-4 h-4" /> Nueva tarea
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-4">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[11px] min-w-[18px] text-center px-1 py-0.5 rounded-full font-semibold ${
                  tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 pb-24">

        {/* ACTIVIDAD — timeline unificado */}
        {tab === 'actividad' && (
          activity.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Sin actividad registrada</p>
              <p className="text-xs text-gray-300 mt-1">Creá una nota o tarea para este cliente</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {activity.map(item => {
                if (item.type === 'note')       return <ActivityNoteRow   key={`n-${item.data.id}`} note={item.data}   onOpen={() => setEditNote(item.data)} />
                if (item.type === 'task')       return <ActivityTaskRow   key={`t-${item.data.id}`} task={item.data} />
                if (item.type === 'simulation') return <ActivitySimRow    key={`s-${item.data.id}`} sim={item.data} />
                if (item.type === 'budget')     return <ActivityBudgetRow key={`b-${item.data.id}`} budget={item.data} />
                return null
              })}
            </div>
          )
        )}

        {tab === 'notas'        && <NotesList notes={notes} onOpen={setEditNote} onArchive={handleArchive} onDelete={handleDeleteNote} onFlag={handleFlag} />}
        {tab === 'tareas'       && <TasksList tasks={tasks} />}
        {tab === 'simulaciones' && <SimulacionesTab clientId={id} clientName={client.full_name} />}
        {tab === 'presupuestos' && <PresupuestosTab clientId={id} />}
      </div>

      {/* Modals */}
      <TaskModal isOpen={taskOpen} onClose={() => setTaskOpen(false)}
        defaultValues={{ context: 'lead', lead_id: id }} />

      {editNote && (
        <NoteEditor note={editNote} clients={[client] as ClientRow[]} projects={projects}
          onClose={() => setEditNote(null)} />
      )}

      <MobileFormScreen open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente">
        <ClientForm key={client.id} defaultValues={client} onSubmit={handleEditClient}
          onCancel={() => setEditOpen(false)} isSubmitting={updateClient.isPending} mode="full" stickyButtons />
      </MobileFormScreen>

      <div className="hidden md:block">
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente" size="lg">
          <ClientForm key={client.id} defaultValues={client} onSubmit={handleEditClient}
            onCancel={() => setEditOpen(false)} isSubmitting={updateClient.isPending} mode="full" />
        </Modal>
      </div>
    </div>
  )
}
