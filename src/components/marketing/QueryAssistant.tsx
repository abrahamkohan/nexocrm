import { useState } from 'react'
import { Sparkles, X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface QueryAssistantProps {
  onSuggest: (idea: string) => Promise<string[]>
  onAccept: (queries: string[]) => void
  suggestedQueries: string[]
  onClear: () => void
  isLoading: boolean
  currentQueries: string[]
  onUpdateQueries: (queries: string[]) => void
}

export function QueryAssistant({
  onSuggest,
  onAccept,
  suggestedQueries,
  onClear,
  isLoading,
  currentQueries,
  onUpdateQueries,
}: QueryAssistantProps) {
  const [idea, setIdea] = useState('')
  const [editingQueries, setEditingQueries] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)

  async function handleSuggest() {
    if (!idea.trim() || idea.trim().length < 3) {
      toast.error('Ingresá al menos 3 caracteres')
      return
    }
    try {
      await onSuggest(idea)
      toast.success('Queries sugeridas generadas')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al generar sugerencias')
    }
  }

  function handleAccept() {
    onAccept(suggestedQueries)
    setIdea('')
    toast.success('Queries guardadas')
  }

  function handleEdit() {
    setEditingQueries([...currentQueries])
    setIsEditing(true)
  }

  function handleSaveEdit() {
    const filtered = editingQueries.filter(q => q.trim().length > 0)
    if (filtered.length === 0) {
      toast.error('Debe haber al menos una query')
      return
    }
    onUpdateQueries(filtered)
    setIsEditing(false)
    toast.success('Queries actualizadas')
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditingQueries([])
  }

  function updateEditingQuery(index: number, value: string) {
    const updated = [...editingQueries]
    updated[index] = value
    setEditingQueries(updated)
  }

  function removeEditingQuery(index: number) {
    if (editingQueries.length <= 1) {
      toast.error('Debe haber al menos una query')
      return
    }
    const updated = editingQueries.filter((_, i) => i !== index)
    setEditingQueries(updated)
  }

  function addEditingQuery() {
    if (editingQueries.length >= 5) {
      toast.error('Máximo 5 queries')
      return
    }
    setEditingQueries([...editingQueries, ''])
  }

  return (
    <div className="rounded-lg border bg-gray-50 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-800">
          Asistente de búsqueda
        </h3>
      </div>

      {/* Input de idea */}
      {!suggestedQueries.length && !isEditing && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">
              ¿Qué querés analizar?
            </label>
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ej: inversión en Luque, precios de alquiler, nuevos proyectos en Asunción"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            />
          </div>
          <Button
            onClick={handleSuggest}
            disabled={isLoading || !idea.trim()}
            size="sm"
            className="self-start"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Sugerir búsquedas</>
            )}
          </Button>
        </div>
      )}

      {/* Queries sugeridas */}
      {suggestedQueries.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Queries sugeridas:
          </p>
          <div className="flex flex-col gap-2">
            {suggestedQueries.map((query, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border text-sm"
              >
                <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                <span className="flex-1">{query}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAccept} size="sm" variant="default">
              <Check className="w-4 h-4 mr-2" />
              Usar estas
            </Button>
            <Button onClick={onClear} size="sm" variant="outline">
              <X className="w-4 h-4 mr-2" />
              Descartar
            </Button>
          </div>
        </div>
      )}

      {/* Queries actuales */}
      {!suggestedQueries.length && !isEditing && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Búsquedas activas:</p>
            <Button onClick={handleEdit} size="sm" variant="ghost" className="h-6 text-xs">
              Editar
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentQueries.map((query, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-white rounded border text-gray-600"
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modo edición */}
      {isEditing && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Editá las búsquedas:</p>
          <div className="flex flex-col gap-2">
            {editingQueries.map((query, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => updateEditingQuery(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary"
                  placeholder={`Query ${i + 1}`}
                />
                <Button
                  onClick={() => removeEditingQuery(i)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={addEditingQuery}
            size="sm"
            variant="outline"
            disabled={editingQueries.length >= 5}
          >
            + Agregar query
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} size="sm">
              Guardar cambios
            </Button>
            <Button onClick={handleCancelEdit} size="sm" variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
