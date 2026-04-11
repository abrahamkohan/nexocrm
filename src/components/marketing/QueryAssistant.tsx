import { useState } from 'react'
import { Sparkles, X, Check, Loader2, Pencil, Plus, ArrowRight } from 'lucide-react'
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
      toast.success('La IA generó búsquedas optimizadas')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al conectar con la IA')
    }
  }

  function handleAccept() {
    onAccept(suggestedQueries)
    setIdea('')
    toast.success('¡Búsquedas actualizadas! Ahora podés generar el análisis.')
  }

  function handleStartEdit() {
    setEditingQueries([...currentQueries])
    setIsEditing(true)
  }

  function handleSaveEdit() {
    const filtered = editingQueries.filter(q => q.trim().length > 0)
    if (filtered.length === 0) {
      toast.error('Debe haber al menos una búsqueda')
      return
    }
    onUpdateQueries(filtered)
    setIsEditing(false)
    toast.success('Búsquedas actualizadas')
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
      toast.error('Debe haber al menos una búsqueda')
      return
    }
    const updated = editingQueries.filter((_, i) => i !== index)
    setEditingQueries(updated)
  }

  function addEditingQuery() {
    if (editingQueries.length >= 5) {
      toast.error('Máximo 5 búsquedas')
      return
    }
    setEditingQueries([...editingQueries, ''])
  }

  const isShowingSuggestions = suggestedQueries.length > 0

  return (
    <div className="rounded-lg border bg-gray-50 p-5 flex flex-col gap-5">
      {/* ── ENCABEZADO ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Asistente de búsqueda con IA
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escribí tu idea → la IA genera búsquedas → generás el análisis
            </p>
          </div>
        </div>
        {!isShowingSuggestions && !isEditing && (
          <Button onClick={handleStartEdit} size="sm" variant="outline" className="gap-1 text-xs">
            <Pencil className="w-3.5 h-3.5" />
            Editar búsquedas
          </Button>
        )}
      </div>

      {/* ── PASO 1: Escribir idea ── */}
      {!isShowingSuggestions && !isEditing && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">1</span>
            <span className="text-sm font-medium text-gray-700">¿Qué querés analizar?</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ej: inversión en Luque, alquileres Asunción, nuevos emprendimientos..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            />
            <Button
              onClick={handleSuggest}
              disabled={isLoading || !idea.trim()}
              size="sm"
              className="gap-1.5"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generar con IA</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── PASO 2: Revisar sugerencias ── */}
      {isShowingSuggestions && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">2</span>
            <span className="text-sm font-medium text-gray-700">Revisá las sugerencias de la IA</span>
          </div>
          <div className="flex flex-col gap-2">
            {suggestedQueries.map((query, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-primary/20 text-sm"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                <span className="flex-1">{query}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAccept} size="sm" variant="default" className="gap-1.5">
              <Check className="w-4 h-4" />
              Usar estas búsquedas
            </Button>
            <Button onClick={onClear} size="sm" variant="outline" className="gap-1.5">
              <X className="w-4 h-4" />
              Descartar y probar otra idea
            </Button>
          </div>
        </div>
      )}

      {/* ── MODO EDICIÓN MANUAL ── */}
      {isEditing && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Editar búsquedas manualmente</span>
          </div>
          <div className="flex flex-col gap-2">
            {editingQueries.map((query, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => updateEditingQuery(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary"
                  placeholder={`Búsqueda ${i + 1}`}
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
            className="gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Agregar búsqueda
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

      {/* ── BÚSQUEDAS ACTIVAS (siempre visible cuando no hay sugerencias ni edición) ── */}
      {!isShowingSuggestions && !isEditing && (
        <div className="flex flex-col gap-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>
              Estas búsquedas se usan al generar el análisis:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentQueries.map((query, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 bg-white rounded-md border border-gray-200 text-gray-600"
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}