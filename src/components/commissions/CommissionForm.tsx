// src/components/commissions/CommissionForm.tsx
import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useAgentes } from '@/hooks/useAgentes'
import { INPUT_CLS, LABEL_CLS } from '@/styles/design-system'
import type { Database } from '@/types/database'

type CommissionRow = Database['public']['Tables']['commissions']['Row']

export interface CommissionFormValues {
  proyecto_vendido:    string
  project_id:          string
  valor_venta:         string
  porcentaje_comision: string
  importe_comision:    string
  fecha_cierre:        string
  tipo:                'venta' | 'alquiler'
  co_broker:           boolean
  co_broker_nombre:    string
  propietario:         string
}

interface Props {
  defaultValues?: Partial<CommissionRow>
  onSubmit:    (values: CommissionFormValues) => void
  onCancel:    () => void
  isSubmitting?: boolean
  formId?: string
  inlineButtons?: boolean
}

export function CommissionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  formId,
  inlineButtons = false,
}: Props) {
  const { data: projects = [] } = useProjects()
  const { data: agentes = [] }  = useAgentes()

  const [form, setForm] = useState<CommissionFormValues>({
    proyecto_vendido:    defaultValues?.proyecto_vendido    ?? '',
    project_id:          defaultValues?.project_id          ?? '',
    valor_venta:         defaultValues?.valor_venta?.toString()         ?? '',
    porcentaje_comision: defaultValues?.porcentaje_comision?.toString() ?? '',
    importe_comision:    defaultValues?.importe_comision?.toString()    ?? '',
    fecha_cierre:        defaultValues?.fecha_cierre ?? '',
    tipo:                defaultValues?.tipo          ?? 'venta',
    co_broker:           defaultValues?.co_broker     ?? false,
    co_broker_nombre:    defaultValues?.co_broker_nombre ?? '',
    propietario:         defaultValues?.propietario   ?? '',
  })

  function set<K extends keyof CommissionFormValues>(key: K, val: CommissionFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  // Cálculo bidireccional — solo necesitás 2 de los 3 campos
  function handleValorChange(raw: string) {
    setForm(prev => {
      const v = parseFloat(raw)
      const p = parseFloat(prev.porcentaje_comision)
      const i = parseFloat(prev.importe_comision)
      let next = { ...prev, valor_venta: raw }
      if (!isNaN(v) && v > 0) {
        if (!isNaN(p) && p > 0) next.importe_comision = ((v * p) / 100).toFixed(2)
        else if (!isNaN(i) && i > 0) next.porcentaje_comision = ((i / v) * 100).toFixed(4)
      }
      return next
    })
  }

  function handlePorcentajeChange(raw: string) {
    setForm(prev => {
      const p = parseFloat(raw)
      const v = parseFloat(prev.valor_venta)
      let next = { ...prev, porcentaje_comision: raw }
      if (!isNaN(p) && p > 0 && !isNaN(v) && v > 0) {
        next.importe_comision = ((v * p) / 100).toFixed(2)
      }
      return next
    })
  }

  function handleImporteChange(raw: string) {
    setForm(prev => {
      const i = parseFloat(raw)
      const v = parseFloat(prev.valor_venta)
      let next = { ...prev, importe_comision: raw }
      if (!isNaN(i) && i > 0 && !isNaN(v) && v > 0) {
        next.porcentaje_comision = ((i / v) * 100).toFixed(4)
      }
      return next
    })
  }

  // Cuál campo se está calculando automáticamente
  const v = parseFloat(form.valor_venta)
  const p = parseFloat(form.porcentaje_comision)
  const i = parseFloat(form.importe_comision)
  const autoImporte    = !isNaN(v) && v > 0 && !isNaN(p) && p > 0
  const autoPorcentaje = !isNaN(v) && v > 0 && !isNaN(i) && i > 0 && !(autoImporte)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.proyecto_vendido.trim() || !form.importe_comision) return
    onSubmit(form)
  }

  const canSubmit = form.proyecto_vendido.trim().length > 0 && parseFloat(form.importe_comision) > 0

  // Preview splits — si hay co-broker, la comisión neta se divide al 50%
  const importeNum     = parseFloat(form.importe_comision) || 0
  const importeNeto    = form.co_broker ? importeNum * 0.5 : importeNum
  const agentesActivos = agentes.filter(a => a.activo)
  const totalPct       = agentesActivos.reduce((s, a) => s + a.porcentaje_comision, 0)

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* ── Tipo de operación ── */}
      <div>
        <label className={LABEL_CLS}>TIPO DE OPERACIÓN</label>
        <div className="flex gap-2 mt-1">
          {(['venta', 'alquiler'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('tipo', t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                form.tipo === t
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t === 'venta' ? 'Venta' : 'Alquiler'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Identificación ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>PROYECTO DEL CRM (OPCIONAL)</label>
          <select
            value={form.project_id}
            onChange={e => {
              const pid = e.target.value
              set('project_id', pid)
              if (pid && !form.proyecto_vendido.trim()) {
                const p = projects.find(x => x.id === pid)
                if (p) {
                  const label = p.developer_name ? `${p.developer_name} — ${p.name}` : p.name
                  set('proyecto_vendido', label)
                }
              }
            }}
            className={INPUT_CLS}
          >
            <option value="">— Sin vincular —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.developer_name ? `${p.developer_name} — ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>PROPIEDAD / DESCRIPCIÓN *</label>
          <input
            type="text"
            placeholder="Ej: Torre Soleil — Apto 4B"
            value={form.proyecto_vendido}
            onChange={e => set('proyecto_vendido', e.target.value)}
            className={INPUT_CLS}
            autoFocus
          />
        </div>
      </div>

      {/* ── Propietario ── */}
      <div>
        <label className={LABEL_CLS}>PROPIETARIO (QUIEN PAGA LA COMISIÓN)</label>
        <input
          type="text"
          placeholder="Nombre del propietario o empresa"
          value={form.propietario}
          onChange={e => set('propietario', e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      {/* ── Montos ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL_CLS}>
            {form.tipo === 'alquiler' ? 'ALQUILER MENSUAL (USD)' : 'VALOR DE VENTA (USD)'}
          </label>
          <input
            type="number"
            placeholder={form.tipo === 'alquiler' ? '1500' : '100000'}
            min="0"
            step="0.01"
            value={form.valor_venta}
            onChange={e => handleValorChange(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>
            {form.tipo === 'alquiler' ? 'MESES DE COMISIÓN' : '% COMISIÓN'}
          </label>
          <input
            type="number"
            placeholder={form.tipo === 'alquiler' ? '1' : '4'}
            min="0"
            step="0.01"
            max={form.tipo === 'alquiler' ? undefined : '100'}
            value={form.porcentaje_comision}
            onChange={e => handlePorcentajeChange(e.target.value)}
            className={INPUT_CLS}
          />
          {form.tipo === 'alquiler' && !autoPorcentaje && (
            <p className="text-[11px] text-gray-400 mt-1">Ej: 1 mes = 100%</p>
          )}
          {autoPorcentaje && (
            <p className="text-[11px] text-blue-400 mt-1">Se calcula automáticamente</p>
          )}
        </div>
        <div>
          <label className={LABEL_CLS}>IMPORTE TOTAL (USD) *</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.importe_comision}
            onChange={e => handleImporteChange(e.target.value)}
            className={INPUT_CLS}
          />
          {autoImporte && (
            <p className="text-[11px] text-blue-400 mt-1">Se calcula automáticamente</p>
          )}
        </div>
      </div>

      {/* ── Fecha ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>FECHA DE CIERRE</label>
          <input
            type="date"
            value={form.fecha_cierre}
            onChange={e => set('fecha_cierre', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* ── Co-broker ── */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Co-broker</p>
            <p className="text-xs text-gray-400 mt-0.5">Un colega trajo al comprador — la comisión se divide al 50%</p>
          </div>
          <button
            type="button"
            onClick={() => set('co_broker', !form.co_broker)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              form.co_broker ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.co_broker ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
        {form.co_broker && (
          <div className="mt-3">
            <label className={LABEL_CLS}>NOMBRE DEL COLEGA / INMOBILIARIA</label>
            <input
              type="text"
              placeholder="Ej: García Propiedades"
              value={form.co_broker_nombre}
              onChange={e => set('co_broker_nombre', e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        )}
      </div>

      {/* ── Preview de splits ── */}
      {importeNum > 0 && agentesActivos.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
            Reparto automático{' '}
            {Math.abs(totalPct - 100) > 0.01 && (
              <span className="text-amber-600 ml-1">(⚠ suma {totalPct}% — configurá agentes)</span>
            )}
          </p>
          {form.co_broker && (
            <p className="text-[11px] text-blue-500 mb-2">
              50% neto para la consultora = {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(importeNeto)}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {agentesActivos.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-1.5">
                <span className="text-blue-800">
                  {a.nombre}{' '}
                  <span className="text-blue-400 text-xs">({a.porcentaje_comision}%)</span>
                </span>
                <span className="font-semibold text-blue-900">
                  {new Intl.NumberFormat('es-PY', {
                    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
                  }).format(importeNeto * a.porcentaje_comision / 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Botones inline (solo modal) ── */}
      {inlineButtons && (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex-[2] h-12 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            {isSubmitting ? 'Guardando...' : defaultValues?.id ? 'Guardar cambios' : 'Registrar venta'}
          </button>
        </div>
      )}
    </form>
  )
}
