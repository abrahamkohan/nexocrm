// src/components/projects/AmenitiesCheckbox.tsx
import { Label } from '@/components/ui/label'

export const AMENITIES = [
  { key: 'piscina',    label: 'Piscina' },
  { key: 'gimnasio',   label: 'Gimnasio' },
  { key: 'cochera',    label: 'Cochera' },
  { key: 'sum',        label: 'SUM' },
  { key: 'seguridad',  label: 'Seguridad 24hs' },
  { key: 'ascensor',   label: 'Ascensor' },
  { key: 'terraza',    label: 'Terraza' },
  { key: 'parrilla',   label: 'Parrilla / BBQ' },
  { key: 'coworking',  label: 'Coworking' },
  { key: 'playground', label: 'Área de juegos' },
] as const

interface AmenitiesCheckboxProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function AmenitiesCheckbox({ value, onChange }: AmenitiesCheckboxProps) {
  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key))
    } else {
      onChange([...value, key])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {AMENITIES.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={value.includes(key)}
            onChange={() => toggle(key)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label className="cursor-pointer font-normal">{label}</Label>
        </label>
      ))}
    </div>
  )
}
