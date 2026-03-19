// src/components/typologies/TypologyForm.tsx
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Upload, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usdToCents } from '@/utils/money'
import { getPublicUrl } from '@/lib/storage'
import type { Database } from '@/types/database'

type TypologyRow = Database['public']['Tables']['typologies']['Row']

// ─── Unit type options ────────────────────────────────────────────────────────

type UnitType =
  | 'monoambiente' | '1_dormitorio' | '2_dormitorios' | '3_dormitorios'
  | 'cochera' | 'cochera_xl' | 'baulera' | 'otro'

const UNIT_TYPES: { value: UnitType; label: string; category: 'unidad' | 'cochera' | 'baulera' }[] = [
  { value: 'monoambiente',  label: 'Monoambiente',   category: 'unidad'   },
  { value: '1_dormitorio',  label: '1 Dormitorio',   category: 'unidad'   },
  { value: '2_dormitorios', label: '2 Dormitorios',  category: 'unidad'   },
  { value: '3_dormitorios', label: '3+ Dormitorios', category: 'unidad'   },
  { value: 'cochera',       label: 'Cochera',        category: 'cochera'  },
  { value: 'cochera_xl',    label: 'Cochera XL',     category: 'cochera'  },
  { value: 'baulera',       label: 'Baulera',        category: 'baulera'  },
  { value: 'otro',          label: 'Otro',           category: 'unidad'   },
]

const UNIT_TYPES_FIRST_ROW  = UNIT_TYPES.slice(0, 4)
const UNIT_TYPES_SECOND_ROW = UNIT_TYPES.slice(4)

const BATHROOM_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
]

const FEATURES_PREDEFINED = [
  'Balcón', 'Terraza', 'Vista al río', 'Vista al parque', 'Vista panorámica',
  'Cocina equipada', 'Placard', 'Vestidor', 'Lavadero', 'Doble baño',
  'Aire acondicionado', 'Chimenea', 'Piso de porcelanato', 'Doble altura',
]

// ─── Schema ───────────────────────────────────────────────────────────────────

const typologySchema = z.object({
  unit_type: z.string().min(1, 'Seleccioná un tipo'),
  name:      z.string().min(1, 'Requerido'),
  bathrooms: z.number().nullable().optional(),
  area_m2:   z.number().positive('Debe ser mayor a 0'),
})

export type TypologyFormValues = z.infer<typeof typologySchema> & {
  features: string[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TypologyFormProps {
  defaultValues?: Partial<TypologyRow>
  onSubmit: (
    values: TypologyFormValues,
    floorPlanFile: File | null,
    newImageFiles: File[],
    keptImages: string[]
  ) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TypologyForm({ defaultValues, onSubmit, onCancel, isSubmitting }: TypologyFormProps) {
  // Floor plan
  const [floorPlanFile,    setFloorPlanFile]    = useState<File | null>(null)
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null)
  const pasteZoneRef = useRef<HTMLDivElement>(null)

  // Gallery images
  const existingFloorPlan = defaultValues?.floor_plan ?? defaultValues?.floor_plan_path ?? null
  const [keptImages,      setKeptImages]      = useState<string[]>(defaultValues?.images ?? [])
  const [newImageFiles,   setNewImageFiles]   = useState<File[]>([])
  const newImagePreviews  = useRef<Map<File, string>>(new Map())

  // Features
  const [features,      setFeatures]      = useState<string[]>(defaultValues?.features ?? [])
  const [customFeature, setCustomFeature] = useState('')

  // ── Floor plan ────────────────────────────────────────────────────────────
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
    if (file) { e.preventDefault(); setFloorPlan(new File([file], 'plano-pegado.jpg', { type: file.type })) }
  }

  // ── Gallery images ────────────────────────────────────────────────────────
  function getPreview(file: File) {
    if (!newImagePreviews.current.has(file)) {
      newImagePreviews.current.set(file, URL.createObjectURL(file))
    }
    return newImagePreviews.current.get(file)!
  }
  function addImageFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    setNewImageFiles(prev => [...prev, ...valid])
  }
  function removeNewImage(file: File) {
    const url = newImagePreviews.current.get(file)
    if (url) URL.revokeObjectURL(url)
    newImagePreviews.current.delete(file)
    setNewImageFiles(prev => prev.filter(f => f !== file))
  }
  function removeKeptImage(path: string) {
    setKeptImages(prev => prev.filter(p => p !== path))
  }

  // ── Features ─────────────────────────────────────────────────────────────
  function togglePredefined(name: string) {
    setFeatures(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name])
  }
  function removeFeature(name: string) {
    setFeatures(prev => prev.filter(f => f !== name))
  }
  function addCustom() {
    const trimmed = customFeature.trim()
    if (!trimmed || features.includes(trimmed)) return
    setFeatures(prev => [...prev, trimmed])
    setCustomFeature('')
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<z.infer<typeof typologySchema>>({
    resolver: zodResolver(typologySchema),
    defaultValues: {
      unit_type: defaultValues?.unit_type ?? '',
      name:      defaultValues?.name      ?? '',
      bathrooms: defaultValues?.bathrooms ?? null,
      area_m2:   defaultValues?.area_m2   ?? undefined,
    },
  })

  const selectedType = form.watch('unit_type') as UnitType | ''
  const selectedBath = form.watch('bathrooms')
  const typeInfo = UNIT_TYPES.find((t) => t.value === selectedType)
  const isUnit = typeInfo?.category === 'unidad'

  function handleTypeSelect(type: UnitType) {
    form.setValue('unit_type', type)
    const info = UNIT_TYPES.find((t) => t.value === type)!
    if (type !== 'otro') form.setValue('name', info.label)
    if (info.category !== 'unidad') form.setValue('bathrooms', null)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({ ...values, features }, floorPlanFile, newImageFiles, keptImages)
  })

  const totalImages = keptImages.length + newImageFiles.length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Tipo ── */}
      <div className="grid gap-2">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Tipo</Label>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES_FIRST_ROW.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleTypeSelect(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedType === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >{opt.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES_SECOND_ROW.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleTypeSelect(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedType === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >{opt.label}</button>
          ))}
        </div>
        {form.formState.errors.unit_type && <p className="text-xs text-destructive">{form.formState.errors.unit_type.message}</p>}
      </div>

      {/* ── Baños ── */}
      {isUnit && (
        <div className="border-t pt-3 grid gap-2">
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Baños</Label>
          <div className="flex gap-2">
            {BATHROOM_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => form.setValue('bathrooms', selectedBath === opt.value ? null : opt.value)}
                className={`w-12 rounded-md border py-1.5 text-sm font-medium transition-colors ${
                  selectedBath === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Nombre + m² ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="ty-name" className="text-xs text-gray-500">Nombre *</Label>
          <Input id="ty-name" {...form.register('name')} placeholder="Ej: 2 Dormitorios Torre A" />
          {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ty-area" className="text-xs text-gray-500">m² *</Label>
          <Input id="ty-area" type="number" min={1} step={0.01}
            {...form.register('area_m2', { setValueAs: (v) => Number(v) })}
          />
          {form.formState.errors.area_m2 && <p className="text-xs text-destructive">{form.formState.errors.area_m2.message}</p>}
        </div>
      </div>

      {/* ── Features ── */}
      <div className="border-t pt-3 grid gap-2">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Características</Label>
        <div className="flex flex-wrap gap-1.5">
          {FEATURES_PREDEFINED.map(name => {
            const active = features.includes(name)
            return (
              <button key={name} type="button" onClick={() => togglePredefined(name)}
                className={`h-7 px-2.5 rounded-full border text-[11px] font-medium transition-all ${
                  active ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >{name}</button>
            )
          })}
        </div>
        <div className="flex gap-1.5">
          <input value={customFeature} onChange={e => setCustomFeature(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } if (e.key === 'Escape') setCustomFeature('') }}
            placeholder="Característica personalizada..."
            className="flex-1 h-7 px-2.5 border border-gray-200 rounded-full text-[11px] focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <button type="button" onClick={addCustom} disabled={!customFeature.trim()}
            className="h-7 px-2.5 rounded-full border border-gray-300 text-[11px] text-gray-500 hover:border-gray-500 transition-colors disabled:opacity-40"
          ><Plus className="w-3 h-3" /></button>
        </div>
        {features.filter(f => !FEATURES_PREDEFINED.includes(f)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.filter(f => !FEATURES_PREDEFINED.includes(f)).map(f => (
              <span key={f} className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-gray-900 border-gray-900 text-[11px] font-medium text-white">
                {f}
                <button type="button" onClick={() => removeFeature(f)} className="text-white/60 hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}
        {features.length > 0 && (
          <p className="text-[10px] text-gray-400">{features.length} característica{features.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* ── Galería de imágenes ── */}
      <div className="border-t pt-3 grid gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Imágenes</Label>
          {totalImages > 0 && <span className="text-[10px] text-gray-400">{totalImages} imagen{totalImages !== 1 ? 'es' : ''}</span>}
        </div>

        {/* Existentes */}
        {keptImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {keptImages.map(path => (
              <div key={path} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200">
                <ImageWithFallback src={getPublicUrl(path)} />
                <button type="button" onClick={() => removeKeptImage(path)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                ><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Nuevas */}
        {newImageFiles.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {newImageFiles.map((file, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-blue-200 ring-1 ring-blue-300/40">
                <img src={getPreview(file)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(file)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                ><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        <label className="flex items-center justify-center gap-2 h-9 px-3 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          Agregar imágenes
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => e.target.files && addImageFiles(e.target.files)}
          />
        </label>
      </div>

      {/* ── Plano ── */}
      <div className="border-t pt-3 grid gap-1.5">
        <Label className="text-xs text-gray-500 uppercase tracking-wider">Plano</Label>
        <div ref={pasteZoneRef} tabIndex={0} onPaste={handlePaste}
          className="relative border-2 border-dashed rounded-lg p-3 text-center cursor-text outline-none focus:border-primary transition-colors"
          style={{ minHeight: 72 }}
        >
          {floorPlanPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={floorPlanPreview} alt="Vista previa" className="max-h-40 rounded object-contain" />
              <button type="button" onClick={() => { setFloorPlanFile(null); setFloorPlanPreview(null) }}
                className="text-xs text-destructive underline"
              >Quitar</button>
            </div>
          ) : existingFloorPlan && !floorPlanFile ? (
            <p className="text-xs text-muted-foreground py-2">
              Plano actual cargado.{' '}
              Hacé clic aquí y pegá (<kbd className="font-mono">Ctrl+V</kbd>) para reemplazarlo
            </p>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              Hacé clic aquí y pegá una captura (<kbd className="font-mono">Ctrl+V</kbd>)
            </p>
          )}
        </div>
        <Input type="file" accept="image/*"
          onChange={e => { const file = e.target.files?.[0]; if (file) setFloorPlan(file) }}
        />
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
  images: string[],
  existingFloorPlan?: string | null
) {
  const typeInfo = UNIT_TYPES.find((t) => t.value === values.unit_type)
  return {
    project_id:      projectId,
    category:        typeInfo?.category ?? 'unidad',
    unit_type:       values.unit_type,
    name:            values.name,
    area_m2:         values.area_m2,
    price_usd:       usdToCents(0),
    bathrooms:       values.bathrooms ?? null,
    units_available: 0,
    features:        values.features ?? [],
    images,
    floor_plan:      floorPlanPath !== undefined ? floorPlanPath : (existingFloorPlan ?? null),
    floor_plan_path: floorPlanPath !== undefined ? floorPlanPath : (existingFloorPlan ?? null),
  }
}

// ─── Tiny helper component ────────────────────────────────────────────────────

function ImageWithFallback({ src }: { src: string }) {
  const [err, setErr] = useState(false)
  if (err) return <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ImageOff className="w-4 h-4 text-gray-300" /></div>
  return <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
}
