// src/components/commissions/CommissionDetailSheet.tsx
import { useState } from 'react'
import { Plus, Trash2, X, UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { MobileFormScreen } from '@/components/ui/MobileFormScreen'
import { IncomeForm } from './IncomeForm'
import { useClients } from '@/hooks/useClients'
import {
  useCreateIncome,
  useDeleteIncome,
  useAddCommissionClient,
  useRemoveCommissionClient,
} from '@/hooks/useCommissions'
import { calcTotals, fmtCurrency } from '@/lib/commissions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CommissionFull } from '@/lib/commissions'
import type { Database } from '@/types/database'

type IncomeRow = Database['public']['Tables']['commission_incomes']['Row']

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  commission: CommissionFull
  open: boolean
  onClose: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

function SheetContent({ commission }: { commission: CommissionFull }) {
  const [addingIncome, setAddingIncome]       = useState(false)
  const [addingClient, setAddingClient]       = useState(false)
  const [clientSearch, setClientSearch]       = useState('')
  const [selectedTipo, setSelectedTipo]       = useState<'vendedor' | 'comprador'>('comprador')

  const createIncome        = useCreateIncome()
  const deleteIncome        = useDeleteIncome()
  const addClient           = useAddCommissionClient()
  const removeClient        = useRemoveCommissionClient()
  const { data: allClients = [] } = useClients()

  const { totalCobrado, saldoPendiente, estado } = calcTotals(commission)

  // Clientes ya vinculados
  const linkedIds = new Set(commission.commission_clients.map(cc => cc.client_id))

  // Filtro de búsqueda de clientes
  const filteredClients = clientSearch.trim()
    ? allClients
        .filter(c => !linkedIds.has(c.id))
        .filter(c =>
          c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone?.includes(clientSearch) ||
          c.apodo?.toLowerCase().includes(clientSearch.toLowerCase())
        )
        .slice(0, 6)
    : []

  async function handleAddIncome(values: {
    titulo: string; fecha_ingreso: string; monto_ingresado: string; medio_pago: 'transferencia' | 'efectivo' | ''
  }) {
    try {
      await createIncome.mutateAsync({
        commission_id:   commission.id,
        titulo:          values.titulo,
        fecha_ingreso:   values.fecha_ingreso,
        monto_ingresado: parseFloat(values.monto_ingresado),
        medio_pago:      values.medio_pago || null,
      })
      toast.success('Ingreso registrado')
      setAddingIncome(false)
    } catch {
      toast.error('Error al guardar')
    }
  }

  async function handleDeleteIncome(income: IncomeRow) {
    if (!confirm(`¿Eliminar ingreso "${income.titulo}"?`)) return
    try {
      await deleteIncome.mutateAsync(income.id)
      toast.success('Ingreso eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleAddClient(clientId: string) {
    try {
      await addClient.mutateAsync({ commissionId: commission.id, clientId, tipo: selectedTipo })
      toast.success('Cliente vinculado')
      setAddingClient(false)
      setClientSearch('')
    } catch {
      toast.error('Error al vincular')
    }
  }

  async function handleRemoveClient(clientId: string, name: string) {
    if (!confirm(`¿Desvincular a "${name}"?`)) return
    try {
      await removeClient.mutateAsync({ commissionId: commission.id, clientId })
      toast.success('Cliente desvinculado')
    } catch {
      toast.error('Error al desvincular')
    }
  }

  return (
    <div className="flex flex-col gap-6 px-1">

      {/* ── Resumen ── */}
      <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Proyecto</p>
            <p className="text-base font-bold text-gray-900 leading-tight">{commission.proyecto_vendido}</p>
          </div>
          <span className="text-2xl">{estado}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Importe</p>
            <p className="text-base font-bold text-gray-900">{fmtCurrency(commission.importe_comision)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Cobrado</p>
            <p className="text-base font-bold text-emerald-600">{fmtCurrency(totalCobrado)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Saldo</p>
            <p className={`text-base font-bold ${saldoPendiente > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {fmtCurrency(saldoPendiente)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Fecha cierre</p>
            <p className="text-sm font-medium text-gray-700">
              {commission.fecha_cierre
                ? new Date(commission.fecha_cierre + 'T00:00:00').toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {commission.facturada && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              ✓ Facturada
            </span>
            {commission.numero_factura && (
              <span className="text-xs text-gray-500">{commission.numero_factura}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Clientes vinculados ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Clientes vinculados</h3>
          <button
            onClick={() => setAddingClient(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        {/* Selector de tipo + búsqueda */}
        {addingClient && (
          <div className="mb-3 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex gap-2">
              {(['comprador', 'vendedor'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTipo(t)}
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-xs font-medium transition-all capitalize',
                    selectedTipo === t
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 bg-white rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                autoFocus
              />
              {filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleAddClient(c.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {c.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.full_name}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        c.tipo === 'cliente' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {c.tipo === 'cliente' ? 'Cliente' : 'Lead'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setAddingClient(false); setClientSearch('') }}
              className="text-xs text-gray-400 hover:text-gray-600 self-end"
            >
              Cancelar
            </button>
          </div>
        )}

        {commission.commission_clients.length === 0 && !addingClient && (
          <p className="text-sm text-gray-400 italic">Sin clientes vinculados.</p>
        )}

        <div className="flex flex-col gap-2">
          {commission.commission_clients.map(cc => (
            <div key={cc.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                {cc.clients.full_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{cc.clients.full_name}</p>
                {cc.clients.phone && <p className="text-xs text-gray-400">{cc.clients.phone}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                cc.tipo === 'vendedor' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {cc.tipo ?? 'sin tipo'}
              </span>
              <button
                onClick={() => handleRemoveClient(cc.client_id, cc.clients.full_name)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ingresos ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Ingresos</h3>
          <button
            onClick={() => setAddingIncome(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        {addingIncome && (
          <div className="mb-3">
            <IncomeForm
              onSubmit={handleAddIncome}
              onCancel={() => setAddingIncome(false)}
              isSubmitting={createIncome.isPending}
            />
          </div>
        )}

        {commission.commission_incomes.length === 0 && !addingIncome && (
          <p className="text-sm text-gray-400 italic">Sin ingresos registrados.</p>
        )}

        <div className="flex flex-col gap-2">
          {[...commission.commission_incomes]
            .sort((a, b) => a.fecha_ingreso.localeCompare(b.fecha_ingreso))
            .map(income => (
            <div key={income.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{income.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {new Date(income.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })}
                  </span>
                  {income.medio_pago && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                      {income.medio_pago}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 flex-shrink-0">
                {fmtCurrency(income.monto_ingresado)}
              </span>
              <button
                onClick={() => handleDeleteIncome(income)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Totales al pie */}
        {commission.commission_incomes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total cobrado</span>
              <span className="font-bold text-emerald-600">{fmtCurrency(totalCobrado)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Saldo pendiente</span>
              <span className={`font-bold ${saldoPendiente > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {fmtCurrency(saldoPendiente)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CommissionDetailSheet({ commission, open, onClose }: Props) {
  const title = `Detalle — ${commission.proyecto_vendido}`
  const content = <SheetContent commission={commission} />

  return (
    <>
      <MobileFormScreen open={open} onClose={onClose} title={title}>
        {content}
      </MobileFormScreen>
      <div className="hidden md:block">
        <Modal open={open} onClose={onClose} title={title} size="lg">
          {content}
        </Modal>
      </div>
    </>
  )
}
