// src/pages/InformesPage.tsx
import { Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAllSimulations } from '@/hooks/useSimulations'
import type { Database } from '@/types/database'

type SimRow = Database['public']['Tables']['simulations']['Row']

export function InformesPage() {
  const { data: simulations = [], isLoading } = useAllSimulations()

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Informes</h1>

      {simulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-gray-400 text-sm">No hay simulaciones guardadas todavía.</p>
          <p className="text-gray-300 text-xs">Generá una desde el Simulador.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Proyecto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tipología</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {simulations.map((sim) => (
                <SimRowItem key={sim.id} sim={sim} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SimRowItem({ sim }: { sim: SimRow }) {
  const snap = sim.snapshot_project as Record<string, unknown>
  const snapTyp = sim.snapshot_typology as Record<string, unknown>
  const projectName = (snap?.name as string) ?? '—'
  const typologyName = (snapTyp?.name as string) ?? '—'
  const date = new Date(sim.created_at).toLocaleDateString('es-PY')
  const displayClient = (sim as SimRow & { client_name?: string | null }).client_name ?? sim.client_id.slice(0, 8) + '...'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-700">{displayClient}</td>
      <td className="px-4 py-3 text-gray-700">{projectName}</td>
      <td className="px-4 py-3 text-gray-500">{typologyName}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">{date}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/informes/${sim.id}`, '_blank')}>
            <Globe className="h-3 w-3 mr-1" />
            Ver informe
          </Button>
        </div>
      </td>
    </tr>
  )
}
