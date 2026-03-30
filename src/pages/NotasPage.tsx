// src/pages/NotasPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, NotebookPen, Star, Archive, FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { NoteItem }   from '@/components/notes/NoteItem'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { useClients }  from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import type { Database } from '@/types/database'

type NoteRow = Database['public']['Tables']['notes']['Row']
type Tab = 'inbox' | 'flagged' | 'archive' | 'all'

export function NotasPage() {
  const { data: notes    = [], isLoading } = useNotes()
  const { data: clients  = [] }            = useClients()
  const { data: projects = [] }            = useProjects()

  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [tab,      setTab]      = useState<Tab>('inbox')
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState<NoteRow | null>(null)

  // ─── Filtrado ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let base: NoteRow[]
    if (tab === 'inbox')   base = notes.filter(n => n.location === 'inbox')
    else if (tab === 'flagged') base = notes.filter(n => n.is_flagged)
    else if (tab === 'archive') base = notes.filter(n => n.location === 'archive')
    else base = notes

    const q = search.toLowerCase().trim()
    if (!q) return base
    return base.filter(n => n.content.toLowerCase().includes(q))
  }, [notes, tab, search])

  const inboxCount   = notes.filter(n => n.location === 'inbox').length
  const flaggedCount = notes.filter(n => n.is_flagged).length

  // ─── Helpers de nombre ─────────────────────────────────────────────────────

  const clientMap  = useMemo(() => Object.fromEntries(clients.map(c  => [c.id,  c.full_name])), [clients])
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])),       [projects])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleNew() {
    const note = await createNote.mutateAsync({ content: '', location: 'inbox' })
    setEditing(note)
  }

  // Al entrar a la página, abrir editor inmediatamente (filosofía Drafts)
  useEffect(() => {
    handleNew()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleArchive(id: string) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const nextLocation = note.location === 'inbox' ? 'archive' : 'inbox'
    updateNote.mutate({ id, input: { location: nextLocation } }, {
      onSuccess: () => toast.success(nextLocation === 'archive' ? 'Nota archivada' : 'Nota movida al Inbox'),
    })
  }

  function handleDelete(id: string) {
    deleteNote.mutate(id, {
      onSuccess: () => toast.success('Nota eliminada'),
    })
  }

  function handleFlag(id: string, flagged: boolean) {
    updateNote.mutate({ id, input: { is_flagged: flagged } })
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  const TAB_CLS = (active: boolean) =>
    `flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
      active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
    }`

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notas</h1>
          <p className="text-sm text-muted-foreground">Capturá ideas al instante</p>
        </div>
        <Button size="sm" onClick={handleNew} disabled={createNote.isPending}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button className={TAB_CLS(tab === 'inbox')} onClick={() => setTab('inbox')}>
          Inbox {inboxCount > 0 && <span className="ml-1 text-xs text-blue-600 font-bold">({inboxCount})</span>}
        </button>
        <button className={TAB_CLS(tab === 'flagged')} onClick={() => setTab('flagged')}>
          ⭐ Destacadas {flaggedCount > 0 && <span className="ml-1 text-xs text-amber-600 font-bold">({flaggedCount})</span>}
        </button>
        <button className={TAB_CLS(tab === 'archive')} onClick={() => setTab('archive')}>
          Archivadas
        </button>
        <button className={TAB_CLS(tab === 'all')} onClick={() => setTab('all')}>
          Todas
        </button>
      </div>

      {/* Buscador */}
      {notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en notas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando...</p>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        search
          ? <EmptyState
              icon={Search}
              title={`Sin resultados para "${search}"`}
              description="Probá con otras palabras."
            />
          : tab === 'inbox'
            ? <EmptyState
                icon={NotebookPen}
                title="Inbox vacío"
                description="Creá una nota rápida para capturar ideas o recordatorios."
                action={{ label: 'Nueva nota', onClick: handleNew }}
              />
            : tab === 'flagged'
              ? <EmptyState
                  icon={Star}
                  title="Sin notas destacadas"
                  description="Marcá notas con estrella para encontrarlas fácil acá."
                />
              : tab === 'archive'
                ? <EmptyState
                    icon={Archive}
                    title="Archivo vacío"
                    description="Las notas que archivés aparecerán aquí."
                  />
                : <EmptyState
                    icon={FileText}
                    title="Sin notas todavía"
                    description="Empezá a capturar ideas con el botón +."
                  />
      )}

      {/* Lista */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {filtered.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              clientName={note.client_id ? clientMap[note.client_id] : undefined}
              clientId={note.client_id ?? undefined}
              projectName={note.project_id ? projectMap[note.project_id] : undefined}
              onOpen={setEditing}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onFlag={handleFlag}
            />
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <NoteEditor
          note={editing}
          clients={clients}
          projects={projects}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
