// src/components/clients/ClientHistorySheet.tsx
import { Trash2, FileText, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSimulationsByClient, useDeleteSimulation, useGenerateReport } from '@/hooks/useSimulations'
import { getReportUrl } from '@/lib/pdfService'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

interface ClientHistorySheetProps {
  client: ClientRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientHistorySheet({ client, open, onOpenChange }: ClientHistorySheetProps) {
  const { data: simulations = [], isLoading } = useSimulationsByClient(client?.id ?? '')
  const deleteSim = useDeleteSimulation(client?.id ?? '')
  const generateReport = useGenerateReport(client?.id ?? '')

  if (!client) return null

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta simulación?')) return
    deleteSim.mutate(id)
  }

  function handleGenerate(sim: (typeof simulations)[number]) {
    generateReport.mutate({ sim, clientName: client!.full_name })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{client.full_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-1 text-sm">
          {client.email && <p className="text-muted-foreground">{client.email}</p>}
          {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
          {client.nationality && <p className="text-muted-foreground">{client.nationality}</p>}
          {client.notes && (
            <p className="text-muted-foreground border-t pt-3 mt-2">{client.notes}</p>
          )}
        </div>

        <div className="mt-6 border-t pt-6">
          <p className="text-sm font-medium mb-4">
            Simulaciones {simulations.length > 0 && `(${simulations.length})`}
          </p>

          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          )}

          {!isLoading && simulations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <p className="text-sm text-muted-foreground">No hay simulaciones todavía.</p>
              <p className="text-xs text-muted-foreground">
                Generá una desde el Simulador y guardala.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {simulations.map((sim) => {
              const snap = sim.snapshot_project as Record<string, unknown>
              const projectName = (snap?.name as string) ?? 'Proyecto'
              const snapTyp = sim.snapshot_typology as Record<string, unknown>
              const typName = (snapTyp?.name as string) ?? 'Tipología'
              const date = new Date(sim.created_at).toLocaleDateString('es-PY')
              const isGenerating = generateReport.isPending && generateReport.variables?.sim.id === sim.id

              return (
                <div key={sim.id} className="border rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{projectName} — {typName}</p>
                      <p className="text-xs text-muted-foreground">{date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(sim.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isGenerating}
                      onClick={() => handleGenerate(sim)}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3 mr-1.5" />
                      )}
                      {isGenerating ? 'Generando...' : 'Generar informe'}
                    </Button>

                    {sim.report_path && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        asChild
                      >
                        <a
                          href={getReportUrl(sim.report_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Descargar PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
