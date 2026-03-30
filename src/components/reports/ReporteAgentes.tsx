// src/components/reports/ReporteAgentes.tsx
import { useMemo } from 'react'
import { useTeam } from '@/hooks/useTeam'
import { useClients } from '@/hooks/useClients'
import { useTasks } from '@/hooks/useTasks'
import { getUrgency } from '@/lib/tasks'
import { Users } from 'lucide-react'

export function ReporteAgentes() {
  const { data: team    = [] } = useTeam()
  const { data: clients = [] } = useClients()
  const { data: tasks   = [] } = useTasks()

  const rows = useMemo(() => {
    return team.map(member => {
      const myClients  = clients.filter(c => c.assigned_to === member.id)
      const myTasks    = tasks.filter(t => t.assigned_to === member.id)
      const leads      = myClients.filter(c => (c.tipo ?? 'lead') === 'lead').length
      const clientes   = myClients.filter(c => c.tipo === 'cliente').length
      const pending    = myTasks.filter(t => t.status === 'pending').length
      const overdue    = myTasks.filter(t => getUrgency(t) === 'overdue').length

      return { ...member, leads, clientes, pending, overdue }
    })
  }, [team, clients, tasks])

  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Reporte por agente</h2>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agente</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clientes</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tareas pend.</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(r.full_name ?? r.id)[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{r.full_name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {r.role ?? 'Sin rol'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">{r.leads}</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-600">{r.clientes}</td>
                <td className="px-4 py-3 text-center font-semibold text-indigo-600">{r.pending}</td>
                <td className="px-4 py-3 text-center">
                  <span className={r.overdue > 0 ? 'font-bold text-red-600' : 'text-gray-400'}>
                    {r.overdue}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map(r => (
          <div key={r.id} className="bg-white rounded-xl border px-4 py-3 flex flex-col gap-2.5">
            {/* Nombre + rol */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(r.full_name ?? r.id)[0].toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-gray-900 truncate">{r.full_name ?? r.email ?? '—'}</span>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                r.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {r.role ?? 'Sin rol'}
              </span>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-1 border-t border-gray-50 pt-2">
              {[
                { label: 'Leads',    value: r.leads,   cls: 'text-amber-600' },
                { label: 'Clientes', value: r.clientes, cls: 'text-emerald-600' },
                { label: 'Tareas',   value: r.pending,  cls: 'text-indigo-600' },
                { label: 'Vencidas', value: r.overdue,  cls: r.overdue > 0 ? 'text-red-600' : 'text-gray-400' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <span className={`text-base font-bold ${cls}`}>{value}</span>
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
