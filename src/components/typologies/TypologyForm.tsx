// src/components/typologies/TypologyForm.tsx
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usdToCents } from '@/utils/money'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']

// ─── Unit type options ────────────────────────────────────────────────────────

type UnitType =
  | 'monoambiente' | '1_dormitorio' | '2_dormitorios' | '3_dormitorios'
  | 'cochera' | 'cochera_xl' | 'baulera' | 'otro'

const UNIT_TYPES: { value: UnitType; label: string; category: 'unidad' | 'cochera' | 'baulera' }[] = [
  { value: 'monoambiente',   label: 'Monoambiente',    category: 'unidad'   },
  { value: '1_dormitorio',   label: '1 Dormitorio',    category: 'unidad'   },
  { value: '2_dormitorios',  label: '2 Dormitorios',   category: 'unidad'   },
  { value: '3_dormitorios',  label: '3+ Dormitorios',  category: 'unidad'   },
  { value: 'cochera',        label: 'Cochera',         category: 'cochera'  },
  { value: 'cochera_xl',     label: 'Cochera XL',      category: 'cochera'  },
  { value: 'baulera',        label: 'Baulera',         category: 'baulera'  },
  { value: 'otro',           label: 'Otro',            category: 'unidad'   },
]

const UNIT_TYPES_FIRST_ROW = UNIT_TYPES.slice(0, 4)   // unit types
const UNIT_TYPES_SECOND_ROW = UNIT_TYPES.slice(4)      // cochera / baulera / otro

const BATHROOM_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const typologySchema = z.object({
  unit_type: z.string().min(1, 'Seleccioná un tipo'),
  name: z.string().min(1, 'Requerido'),
  bathrooms: z.number().nullable().optional(),
  area_m2: z.number().positive('Debe ser mayor a 0'),
})

export type TypologyFormValues = z.infer<typeof typologySchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface TypologyFormProps {
  defaultValues?: Partial<TypologyRow>
  onSubmit: (values: TypologyFormValues, floorPlanFile: File | null) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TypologyForm({ defaultValues, onSubmit, onCancel, isSubmitting }: TypologyFormProps) {
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null)
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null)
  const pasteZoneRef = useRef<HTMLDivElement>(null)

  function setFloorPlan(file: File) {
    setFloorPlanFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setFloorPlanPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (file) {
      e.preventDefault()
      setFloorPlan(new File([file], 'plano-pegado.jpg', { type: file.type }))
    }
  }

  const form = useForm<TypologyFormValues>({
    resolver: zodResolver(typologySchema),
    defaultValues: {
      unit_type: defaultValues?.unit_type ?? '',
      name: defaultValues?.name ?? '',
      bathrooms: defaultValues?.bathrooms ?? null,
      area_m2: defaultValues?.area_m2 ?? undefined,
    },
  })

  const selectedType = form.watch('unit_type') as UnitType | ''
  const selectedBath = form.watch('bathrooms')
  const typeInfo = UNIT_TYPES.find((t) => t.value === selectedType)
  const isUnit = typeInfo?.category === 'unidad'

  // Auto-populate name when type is selected (unless it's 'otro' or already custom)
  function handleTypeSelect(type: UnitType) {
    form.setValue('unit_type', type)
    const info = UNIT_TYPES.find((t) => t.value === type)!
    if (type !== 'otro') {
      form.setValue('name', info.label)
    }
    // Clear bathrooms if not a unit
    if (info.category !== 'unidad') {
      form.setValue('bathrooms', null)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, floorPlanFile)
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Tipo de tipología ── */}
      <div className="grid gap-2">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Tipo</Label>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES_FIRST_ROW.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeSelect(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedType === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES_SECOND_ROW.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeSelect(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedType === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.formState.errors.unit_type && (
          <p className="text-xs text-destructive">{form.formState.errors.unit_type.message}</p>
        )}
      </div>

      {/* ── Baños (solo unidades) ── */}
      {isUnit && (
        <>
          <div className="border-t pt-3 grid gap-2">
            <Label className="text-xs text-gray-500 uppercase tracking-wider">Baños</Label>
            <div className="flex gap-2">
              {BATHROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => form.setValue('bathrooms', selectedBath === opt.value ? null : opt.value)}
                  className={`w-12 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                    selectedBath === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Nombre ── */}
      <div className="grid gap-1.5">
        <Label htmlFor="ty-name" className="text-xs text-gray-500">Nombre *</Label>
        <Input
          id="ty-name"
          {...form.register('name')}
          placeholder="Ej: 2 Dormitorios Torre A"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* ── Área ── */}
      <div className="grid gap-1.5">
        <Label htmlFor="ty-area" className="text-xs text-gray-500">Área m² *</Label>
        <Input
          id="ty-area"
          type="number"
          min={1}
          step={0.01}
          {...form.register('area_m2', { setValueAs: (v) => Number(v) })}
        />
        {form.formState.errors.area_m2 && (
          <p className="text-xs text-destructive">{form.formState.errors.area_m2.message}</p>
        )}
      </div>

      {/* ── Plano ── */}
      <div className="grid gap-1.5">
        <Label className="text-xs text-gray-500">Plano de tipología</Label>

        {/* Paste zone */}
        <div
          ref={pasteZoneRef}
          tabIndex={0}
          onPaste={handlePaste}
          className="relative border-2 border-dashed rounded-lg p-3 text-center cursor-text outline-none focus:border-primary transition-colors"
          style={{ minHeight: 72 }}
        >
          {floorPlanPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={floorPlanPreview} alt="Vista previa" className="max-h-40 rounded object-contain" />
              <button
                type="button"
                onClick={() => { setFloorPlanFile(null); setFloorPlanPreview(null) }}
                className="text-xs text-destructive underline"
              >
                Quitar imagen
              </button>
            </div>
          ) : defaultValues?.floor_plan_path && !floorPlanFile ? (
            <p className="text-xs text-muted-foreground py-2">
              Plano actual: <span className="font-medium">{defaultValues.floor_plan_path.split('/').pop()}</span>
              <br />Hacé clic aquí y pegá (<kbd className="font-mono">Ctrl+V</kbd>) para reemplazarlo
            </p>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              Hacé clic aquí y pegá una captura (<kbd className="font-mono">Ctrl+V</kbd>)
            </p>
          )}
        </div>

        {/* File picker as fallback */}
        <Input
          id="ty-floor"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setFloorPlan(file)
          }}
        />
        <p className="text-xs text-muted-foreground">Pegá una captura de pantalla arriba, o elegí un archivo JPG</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} size="sm" className="flex-1">
          {isSubmitting ? 'Guardando...' : 'Guardar tipología'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function typologyFormToInsert(
  projectId: string,
  values: TypologyFormValues,
  floorPlanPath: string | null | undefined,
  existingFloorPlan?: string | null
) {
  const typeInfo = UNIT_TYPES.find((t) => t.value === values.unit_type)
  return {
    project_id: projectId,
    category: typeInfo?.category ?? 'unidad',
    unit_type: values.unit_type,
    name: values.name,
    area_m2: values.area_m2,
    price_usd: usdToCents(0),
    bathrooms: values.bathrooms ?? null,
    units_available: 0,
    floor_plan_path: floorPlanPath !== undefined ? floorPlanPath : (existingFloorPlan ?? null),
  }
}
