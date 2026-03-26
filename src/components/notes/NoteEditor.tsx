// src/components/notes/NoteEditor.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Star, Tag, Calendar, Link2, Archive, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { extractTitle } from '@/lib/notes'
import type { Database } from '@/types/database'

type NoteRow    = Database['public']['Tables']['notes']['Row']
type ClientRow  = Database['public']['Tables']['clients']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']

function toInputValue(dateStr: string): string {
  const d = new Date(dateStr)
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${dd}T${hh}:${mm}`
}

function formatReminder(iso: string): string {
  return new Date(iso).toLocaleString('es-PY', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

interface NoteEditorProps {
  note: NoteRow
  clients:  ClientRow[]
  projects: ProjectRow[]
  onClose:  () => void
}

export function NoteEditor({ note, clients, projects, onClose }: NoteEditorProps) {
  const [content,   setContent]   = useState(note.content)
  const [tags,      setTags]      = useState<string[]>(note.tags ?? [])
  const [tagInput,  setTagInput]  = useState('')
  const [reminder,  setReminder]  = useState(note.reminder_date ?? '')
  const [clientId,  setClientId]  = useState(note.client_id ?? '')
  const [projectId, setProjectId] = useState(note.project_id ?? '')
  const [showMeta,  setShowMeta]  = useState(false)
  const [showCal,   setShowCal]   = useState(false)

  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [content])

  const isDirty = useCallback(() =>
    content !== note.content ||
    JSON.stringify(tags) !== JSON.stringify(note.tags ?? []) ||
    reminder !== (note.reminder_date ?? '') ||
    clientId  !== (note.client_id  ?? '') ||
    projectId !== (note.project_id ?? ''),
  [content, tags, reminder, clientId, projectId, note])

  const save = useCallback(() => {
    updateNote.mutate({
      id: note.id,
      input: {
        content,
        tags,
        reminder_date: reminder || null,
        client_id:  clientId  || null,
        project_id: projectId || null,
      },
    })
  }, [content, tags, reminder, clientId, projectId, note.id, updateNote])

  function handleClose() {
    if (!content.trim()) {
      deleteNote.mutate(note.id, { onSuccess: onClose })
      return
    }
    if (isDirty()) {
      updateNote.mutate(
        { id: note.id, input: { content, tags, reminder_date: reminder || null, client_id: clientId || null, project_id: projectId || null } },
        { onSuccess: onClose }
      )
    } else {
      onClose()
    }
  }

  function handleFlag() {
    updateNote.mutate({ id: note.id, input: { is_flagged: !note.is_flagged } })
  }

  function handleArchive() {
    save()
    updateNote.mutate(
      { id: note.id, input: { location: note.location === 'inbox' ? 'archive' : 'inbox' } },
      { onSuccess: onClose }
    )
  }

  function handleDelete() {
    if (!confirm('¿Eliminar esta nota?')) return
    deleteNote.mutate(note.id, { onSuccess: onClose })
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(',', '')
      if (!tags.includes(t)) setTags([...tags, t])
      setTagInput('')
    }
  }

  const title = extractTitle(content)

  const hasMetaValues = tags.length > 0 || !!reminder || !!clientId || !!projectId

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleClose}
    >
      <div
        className="bg-white w-full md:max-w-xl flex flex-col"
        style={{
          borderRadius: '20px 20px 0 0',
          maxHeight: '92vh',
          // desktop: full rounded
          ...(window.innerWidth >= 768 ? { borderRadius: 20, maxHeight: '88vh' } : {}),
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[13px] text-gray-400 truncate flex-1 mr-3 select-none">
            {title === 'Sin título' ? '' : title}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleFlag}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title={note.is_flagged ? 'Quitar destacado' : 'Destacar'}
            >
              <Star className={`w-[18px] h-[18px] ${note.is_flagged ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* ── Textarea ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Empezá a escribir..."
            className="w-full resize-none border-0 outline-none text-[15px] leading-[1.7] text-gray-900 placeholder:text-gray-300 bg-transparent"
            style={{ minHeight: 200, fontFamily: 'inherit' }}
          />
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-4 py-2">

          {/* Barra de iconos */}
          <div className="flex items-center gap-1">

            {/* Tags */}
            <button
              onClick={() => setShowMeta(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${showMeta || hasMetaValues ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Tag className="w-3.5 h-3.5" />
              {tags.length > 0 && <span className="font-medium">{tags.length}</span>}
            </button>

            {/* Recordatorio */}
            <button
              onClick={() => { setShowCal(v => !v); setShowMeta(true) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${reminder ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {reminder && <span className="font-medium">{formatReminder(reminder)}</span>}
            </button>

            {/* Vínculo */}
            <button
              onClick={() => setShowMeta(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${(clientId || projectId) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {/* Archivar */}
            <button
              onClick={handleArchive}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={note.location === 'inbox' ? 'Archivar' : 'Mover a Inbox'}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            {/* Eliminar */}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Toggle metadatos */}
            <button
              onClick={() => setShowMeta(v => !v)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {showMeta ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Panel expandible de metadatos */}
          {showMeta && (
            <div className="flex flex-col gap-2.5 pt-2.5 pb-1 border-t border-gray-100 mt-2">

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-3 h-3 text-gray-300 flex-shrink-0" />
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Nueva etiqueta..."
                  className="text-xs text-gray-500 outline-none border-0 bg-transparent placeholder:text-gray-300 min-w-0 w-28"
                />
              </div>

              {/* Recordatorio */}
              {showCal && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  <input
                    type="datetime-local"
                    value={reminder ? toInputValue(reminder) : ''}
                    onChange={e => setReminder(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
                  />
                  {reminder && (
                    <button onClick={() => setReminder('')} className="text-[10px] text-gray-400 hover:text-red-400">Quitar</button>
                  )}
                </div>
              )}

              {/* Vínculos */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
                >
                  <option value="">Sin cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="text-xs text-gray-500 outline-none border-0 bg-transparent cursor-pointer"
                >
                  <option value="">Sin proyecto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
