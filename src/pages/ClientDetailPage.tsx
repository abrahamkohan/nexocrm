// src/pages/ClientDetailPage.tsx
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ChevronLeft, Phone, Mail, Edit2, NotebookPen, ClipboardList,
  MessageCircle, CheckCircle2, Clock, AlertCircle, Star,
} from 'lucide-react'
import { useClient, useUpdateClient } from '@/hooks/useClients'
import { useNotesByClient, useUpdateNote, useDeleteNote, useCreateNote } from '@/hooks/useNotes'
import { useTasksByLead } from '@/hooks/useTasks'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useProjects } from '@/hooks/useProjects'
import { TaskModal } from '@/components/tasks/TaskModal'
import { ClientForm, type ClientFormValues } from '@/components/clients/ClientForm'
import { Modal } from '@/components/ui/modal'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { extractTitle, extractSnippet } from '@/lib/notes'
import { getUrgency } from '@/lib/tasks'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type NoteRow = Database['public']['Tables']['notes']['Row']
type TaskRow = Database['public']['Tables']['tasks']['Row']
type ClientRow = Database['public']['Tables']['clients']['Row']

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityItem =
  | { type: 'note'; data: NoteRow;  date: string }
  | { type: 'task'; data: TaskRow;  date: string }

type Tab = 'actividad' | 'notas' | 'tareas'

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

// ─── ActivityRow ──────────────────────────────────────────────────────────────

function ActivityNoteRow({ note, onOpen }: { note: NoteRow; onOpen: () => void }) {
  const title   = extractTitle(note.content)
  const snippet = extractSnippet(note.content)
  return (
    <button
      onClick={onOpen}
      className="w-full text-left flex gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/70 px-1 rounded-lg transition-colors active:bg-gray-100"
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
  const urgencyIcon = urgency === 'overdue'
    ? <AlertCircle className="w-4 h-4 text-red-400" />
    : urgency === 'today'
    ? <Clock className="w-4 h-4 text-amber-500" />
    : task.status === 'closed'
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : <ClipboardList className="w-4 h-4 text-blue-500" />

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 px-1">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mt-0.5">
        {urgencyIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
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
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <NotebookPen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Sin notas para este cliente</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0">
      {notes.map(note => {
        const title = extractTitle(note.content)
        const snippet = extractSnippet(note.content)
        return (
          <div key={note.id}
            className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group"
          >
            <button
              onClick={() => onOpen(note)}
              className="flex-1 min-w-0 text-left"
            >
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
                className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs font-medium">
                ↓
              </button>
              <button onClick={() => { if (confirm('¿Eliminar nota?')) onDelete(note.id) }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-xs">
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SimpleTaskList ───────────────────────────────────────────────────────────

function SimpleTaskList({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Sin tareas para este cliente</p>
      </div>
    )
  }
  const open   = tasks.filter(t => t.status !== 'closed')
  const closed = tasks.filter(t => t.status === 'closed')

  return (
    <div className="flex flex-col gap-0">
      {open.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Pendientes</p>
          {open.map(task => <ActivityTaskRow key={task.id} task={task} />)}
        </>
      )}
      {closed.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 mt-4">Cerradas</p>
          {closed.map(task => <ActivityTaskRow key={task.id} task={task} />)}
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate    = useNavigate()

  const [tab,        setTab]        = useState<Tab>('actividad')
  const [editOpen,   setEditOpen]   = useState(false)
  const [taskOpen,   setTaskOpen]   = useState(false)
  const [editNote,   setEditNote]   = useState<NoteRow | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: client, isLoading } = useClient(id)
  const { data: notes   = []      } = useNotesByClient(id)
  const { data: tasks   = []      } = useTasksByLead(id)
  const { data: projects = []     } = useProjects()

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createNote  = useCreateNote()
  const updateNote  = useUpdateNote()
  const deleteNote  = useDeleteNote()
  const updateClient = useUpdateClient()

  // ── Activity timeline ─────────────────────────────────────────────────────
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...notes.map(n => ({ type: 'note' as const, data: n, date: n.updated_at })),
      ...tasks.map(t => ({ type: 'task' as const, data: t, date: t.updated_at })),
    ]
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [notes, tasks])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleNewNote() {
    const note = await createNote.mutateAsync({ content: '', location: 'inbox', client_id: id })
    setEditNote(note)
  }

  function handleArchive(noteId: string) {
    updateNote.mutate({ id: noteId, input: { location: 'archive' } })
  }
  function handleDeleteNote(noteId: string) {
    deleteNote.mutate(noteId)
  }
  function handleFlag(noteId: string, flagged: boolean) {
    updateNote.mutate({ id: noteId, input: { is_flagged: flagged } })
  }

  async function handleEditClient(values: ClientFormValues) {
    try {
      await updateClient.mutateAsync({
        id,
        input: {
          full_name:        values.full_name,
          email:            values.email  || null,
          phone:            values.phone  || null,
          nationality:      values.nationality || null,
          notes:            values.notes  || null,
          tipo:             values.tipo,
          fuente:           values.fuente || null,
          apodo:            values.apodo  || null,
        },
      })
      toast.success('Cliente actualizado')
      setEditOpen(false)
    } catch {
      toast.error('Error al guardar')
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !client) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials  = client.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const estadoCls = client.estado ? (ESTADO_CLS[client.estado] ?? 'bg-gray-100 text-gray-500') : ''
  const openTasks = tasks.filter(t => t.status !== 'closed').length

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'actividad', label: 'Actividad', count: activity.length },
    { key: 'notas',     label: 'Notas',     count: notes.length },
    { key: 'tareas',    label: 'Tareas',    count: openTasks > 0 ? openTasks : tasks.length },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky back header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 h-14">
        <button
          onClick={() => navigate('/clientes')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[15px]">Clientes</span>
        </button>
      </div>

      {/* ── Client header ───────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start gap-4">

          {/* Avatar */}
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
                {client.apodo && (
                  <p className="text-sm text-gray-400 mt-0.5 italic">"{client.apodo}"</p>
                )}
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                client.tipo === 'cliente'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {client.tipo === 'cliente' ? 'Cliente' : 'Lead'}
              </span>
              {client.estado && (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${estadoCls}`}>
                  {client.estado}
                </span>
              )}
              {client.fuente && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  {client.fuente}
                </span>
              )}
              {client.nationality && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  {client.nationality}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-4 flex flex-col gap-2.5">
          {client.phone && (
            <div className="flex items-center gap-3">
              <a href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {client.phone}
              </a>
              {client.phone && (
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${client.full_name}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              )}
            </div>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {client.email}
            </a>
          )}
        </div>

        {/* Notes/bio */}
        {client.notes && (
          <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
            {client.notes}
          </p>
        )}

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors active:scale-95"
          >
            <NotebookPen className="w-4 h-4" />
            Nueva nota
          </button>
          <button
            onClick={() => setTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            Nueva tarea
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 px-4">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
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

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="px-4 py-4 pb-24">

        {/* ACTIVIDAD */}
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
            <div className="flex flex-col gap-0">
              {activity.map(item =>
                item.type === 'note'
                  ? <ActivityNoteRow
                      key={`note-${item.data.id}`}
                      note={item.data}
                      onOpen={() => setEditNote(item.data)}
                    />
                  : <ActivityTaskRow
                      key={`task-${item.data.id}`}
                      task={item.data}
                    />
              )}
            </div>
          )
        )}

        {/* NOTAS */}
        {tab === 'notas' && (
          <NotesList
            notes={notes}
            onOpen={setEditNote}
            onArchive={handleArchive}
            onDelete={handleDeleteNote}
            onFlag={handleFlag}
          />
        )}

        {/* TAREAS */}
        {tab === 'tareas' && (
          <SimpleTaskList tasks={tasks} />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Task modal — con clientId pre-cargado */}
      <TaskModal
        isOpen={taskOpen}
        onClose={() => setTaskOpen(false)}
        defaultValues={{ context: 'lead', lead_id: id }}
      />

      {/* Note editor */}
      {editNote && (
        <NoteEditor
          note={editNote}
          clients={[client] as ClientRow[]}
          projects={projects}
          onClose={() => setEditNote(null)}
        />
      )}

      {/* Edit client — mobile */}
      <MobileFormScreen
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar cliente"
      >
        <ClientForm
          key={client.id}
          defaultValues={client}
          onSubmit={handleEditClient}
          onCancel={() => setEditOpen(false)}
          isSubmitting={updateClient.isPending}
          mode="full"
          stickyButtons
        />
      </MobileFormScreen>

      {/* Edit client — desktop */}
      <div className="hidden md:block">
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar cliente" size="lg">
          <ClientForm
            key={client.id}
            defaultValues={client}
            onSubmit={handleEditClient}
            onCancel={() => setEditOpen(false)}
            isSubmitting={updateClient.isPending}
            mode="full"
          />
        </Modal>
      </div>
    </div>
  )
}
