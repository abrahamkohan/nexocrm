import { Loader2, RefreshCw, TrendingUp, Newspaper, Lightbulb, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useMarketDigest } from '@/hooks/useMarketDigest'

export function InteligenciaMercadoPage() {
  const { query, mutation, publishMutation } = useMarketDigest()
  const digest = query.data

  async function handleActualizar() {
    try {
      await mutation.mutateAsync()
      toast.success('Análisis actualizado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Inteligencia de Mercado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis diario del mercado inmobiliario generado con IA.
          </p>
        </div>
        <Button
          onClick={handleActualizar}
          disabled={mutation.isPending}
          className="flex-shrink-0"
        >
          {mutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analizando...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Actualizar</>
          )}
        </Button>
      </div>

      {/* Loading inicial */}
      {query.isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Estado vacío */}
      {!query.isLoading && !digest && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <TrendingUp className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-muted-foreground">
            No hay análisis para hoy todavía.
          </p>
          <Button onClick={handleActualizar} disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Generando análisis...'
              : 'Generar primer análisis'}
          </Button>
        </div>
      )}

      {/* Contenido */}
      {digest && (
        <div className="flex flex-col gap-4">

          {/* 4A. Badge de calidad baja */}
          {digest.quality === 'low' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                El análisis generado puede ser demasiado genérico.
                Considerá regenerarlo más tarde o revisarlo antes de publicar.
              </p>
            </div>
          )}

          {/* Resumen ejecutivo */}
          {digest.summary && (
            <div className="rounded-lg border bg-card p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resumen ejecutivo
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {digest.summary}
              </p>
            </div>
          )}

          {/* Titulares - 4D. Validar links */}
          {digest.titulares?.length > 0 && (
            <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Titulares del día
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {digest.titulares
                  .filter(t => t.url && t.url.startsWith('http'))
                  .map((t, i) => (
                    <a
                      key={i}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-xs font-mono text-muted-foreground flex-shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-800 group-hover:underline leading-snug">
                          {t.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.fuente}</p>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Señal para el inversor */}
          {digest.senal_inversor && (
            <div className="rounded-lg border bg-amber-50 border-amber-100 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                  Señal para el inversor
                </p>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">
                {digest.senal_inversor}
              </p>
            </div>
          )}

          {/* 4C. Botón Publicar (solo si draft) */}
          {digest.status === 'draft' && (
            <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Borrador — no publicado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Revisá el contenido antes de publicar.
                </p>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await publishMutation.mutateAsync(digest.id)
                    toast.success('Análisis publicado')
                  } catch {
                    toast.error('Error al publicar')
                  }
                }}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Publicar'
                )}
              </Button>
            </div>
          )}

          {/* 4B. Timestamp visible */}
          <p className="text-xs text-muted-foreground text-right">
            Generado el{' '}
            {new Date(digest.created_at).toLocaleDateString('es-PY', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}{' '}
            a las{' '}
            {new Date(digest.created_at).toLocaleTimeString('es-PY', {
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
