// src/components/ui/DeleteConfirmDialog.tsx
// Confirmación destructiva:
//   mode='keyword' → el usuario escribe "ELIMINAR"
//   mode='name'    → el usuario escribe el nombre exacto del ítem

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open:        boolean
  mode:        'keyword' | 'name'
  entityName?: string   // usado en mode='name' y como label en mode='keyword'
  isPending?:  boolean
  onConfirm:   () => void
  onCancel:    () => void
}

export function DeleteConfirmDialog({ open, mode, entityName, isPending, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const expected  = mode === 'keyword' ? 'ELIMINAR' : (entityName ?? '')
  const isValid   = value === expected

  useEffect(() => {
    if (open) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col gap-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Ícono + título */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">¿Eliminar{entityName ? ` "${entityName}"` : ''}?</p>
            <p className="text-sm text-gray-500 mt-1">Esta acción es irreversible.</p>
          </div>
        </div>

        {/* Instrucción + input */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 text-center">
            {mode === 'keyword'
              ? <>Escribí <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar</>
              : <>Escribí <span className="font-mono font-bold text-red-600">{entityName}</span> para confirmar</>
            }
          </p>
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={expected}
            autoComplete="off"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!isValid || isPending}
            className="flex-1 h-11 rounded-xl text-sm font-semibold bg-red-600 text-white disabled:opacity-30 hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
