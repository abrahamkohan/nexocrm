// src/components/simulator/SimUI.tsx
// Shared UI primitives for simulator scenarios

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

// ── Numeric input field ──────────────────────────────────────────────────────

interface NumericFieldProps {
  label: string
  value: number
  onChange: (val: number) => void
  step?: number
  min?: number
  max?: number
}

export function NumericField({ label, value, onChange, step = 1, min = 0, max }: NumericFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-gray-500 text-xs">{label}</Label>
      <Input
        type="number"
        value={value || ''}
        step={step}
        min={min}
        max={max}
        placeholder="0"
        onChange={(e) => {
          const raw = parseFloat(e.target.value)
          if (!isNaN(raw)) onChange(raw)
          else if (e.target.value === '') onChange(0)
        }}
      />
    </div>
  )
}

// ── Toggle / checkbox field ──────────────────────────────────────────────────

interface ToggleFieldProps {
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}

export function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer w-fit">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-primary accent-primary"
      />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  )
}

// ── Result card (highlighted metric) ────────────────────────────────────────

interface ResultCardProps {
  label: string
  value: string
  highlight?: boolean
  color?: 'blue' | 'green'
}

export function ResultCard({ label, value, highlight = false, color = 'blue' }: ResultCardProps) {
  const borderColor = color === 'green' ? 'border-l-emerald-500' : 'border-l-blue-500'
  const valueColor = color === 'green' ? 'text-emerald-700' : 'text-blue-700'

  return (
    <div className={`border-l-4 ${borderColor} bg-white rounded-r-lg border border-l-4 p-4`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? valueColor : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Result table row ─────────────────────────────────────────────────────────

interface ResultRowProps {
  label: string
  value: string
  bold?: boolean
}

export function ResultRow({ label, value, bold = false }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}
