// src/components/commissions/IncomeForm.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

const INPUT_CLS = 'w-full h-11 px-3 border border-gray-200 bg-gray-50 rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-colors'
const LABEL_CLS = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block'

interface IncomeFormValues {
  titulo: string
  fecha_ingreso: string
  monto_ingresado: string
  medio_pago: 'transferencia' | 'efectivo' | ''
}

interface Props {
  onSubmit: (values: IncomeFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function IncomeForm({ onSubmit, onCancel, isSubmitting }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<IncomeFormValues>({
    titulo: '',
    fecha_ingreso: today,
    monto_ingresado: '',
    medio_pago: '',
  })

  function set<K extends keyof IncomeFormValues>(key: K, value: IncomeFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.monto_ingresado || !form.fecha_ingreso) return
    onSubmit(form)
  }

  const canSubmit = form.titulo.trim().length > 0 && form.monto_ingresado.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">

      <div>
        <label className={LABEL_CLS}>DESCRIPCIÓN</label>
        <input
          type="text"
          placeholder="Ej: 1er pago — señal"
          value={form.titulo}
          onChange={e => set('titulo', e.target.value)}
          className={INPUT_CLS}
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={LABEL_CLS}>FECHA</label>
          <input
            type="date"
            value={form.fecha_ingreso}
            onChange={e => set('fecha_ingreso', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div className="flex-1">
          <label className={LABEL_CLS}>MONTO (USD)</label>
          <input
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.monto_ingresado}
            onChange={e => set('monto_ingresado', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Medio de pago */}
      <div>
        <label className={LABEL_CLS}>MEDIO DE PAGO</label>
        <div className="flex gap-2">
          {(['transferencia', 'efectivo'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => set('medio_pago', form.medio_pago === m ? '' : m)}
              className={cn(
                'flex-1 h-10 rounded-xl border text-[13px] font-medium transition-all capitalize',
                form.medio_pago === m
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              )}
            >
              {m === 'transferencia' ? 'Transferencia' : 'Efectivo'}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 h-10 rounded-xl text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
        >
          {isSubmitting ? 'Guardando...' : 'Agregar ingreso'}
        </button>
      </div>
    </form>
  )
}
