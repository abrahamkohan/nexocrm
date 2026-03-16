// src/pages/RecursosPage.tsx
import { useEffect, useState } from 'react'
import {
  Globe, Newspaper, Building2, Wrench, ExternalLink,
  Settings2, Check, Loader2, GripVertical, Plus, Trash2,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConsultoraConfig, useSaveConsultoraConfig } from '@/hooks/useConsultora'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkItem {
  label: string
  sub: string
  url: string
  enabled: boolean
}

const EMPTY_LINK: LinkItem = { label: '', sub: '', url: '', enabled: true }

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PORTALES: LinkItem[] = [
  { label: 'Infocasas', sub: 'Portal inmobiliario PY', url: 'https://www.infocasas.com.py',  enabled: true },
  { label: 'Properati', sub: 'Portal regional',        url: 'https://www.properati.com.py',  enabled: true },
  { label: 'Zonaprop',  sub: 'Portal regional',        url: 'https://www.zonaprop.com.py',   enabled: true },
]

const DEFAULT_NOTICIAS: LinkItem[] = [
  { label: 'ABC Economía', sub: 'abc.com.py',     url: 'https://www.abc.com.py/economia',        enabled: true },
  { label: 'Última Hora',  sub: 'ultimahora.com', url: 'https://www.ultimahora.com/economia',    enabled: true },
  { label: '5 Días',       sub: '5dias.com.py',   url: 'https://www.5dias.com.py',               enabled: true },
  { label: 'Bloomberg',    sub: 'bloomberg.com',  url: 'https://www.bloomberg.com',              enabled: true },
  { label: 'Ámbito',       sub: 'ambito.com',     url: 'https://www.ambito.com',                 enabled: true },
  { label: 'Cronista',     sub: 'cronista.com',   url: 'https://www.cronista.com',               enabled: true },
]

const DEFAULT_DATOS_OFICIALES: LinkItem[] = [
  { label: 'BCP',                  sub: 'Banco Central del Paraguay', url: 'https://www.bcp.gov.py',                                                                          enabled: true },
  { label: 'Catastro Nacional',    sub: 'catastro.gov.py',            url: 'https://www.catastro.gov.py',                                                                     enabled: true },
  { label: 'Registro Público',     sub: 'Poder Judicial PY',          url: 'https://www.pj.gov.py/contenido/154-direccion-general-de-los-registros-publicos/1063',            enabled: true },
  { label: 'Municipalidad ASU',    sub: 'asuncion.gov.py',            url: 'https://www.asuncion.gov.py',                                                                     enabled: true },
  { label: 'INE',                  sub: 'Instituto Nacional de Est.',  url: 'https://www.ine.gov.py',                                                                          enabled: true },
]

const DEFAULT_HERRAMIENTAS: LinkItem[] = [
  { label: 'Airbnb Host',     sub: 'Panel anfitrión',  url: 'https://www.airbnb.com/hosting',  enabled: true },
  { label: 'Booking Extranet', sub: 'Gestión Booking', url: 'https://admin.booking.com',       enabled: true },
  { label: 'Dólar Hoy',       sub: 'Cotización ARS',   url: 'https://dolarhoy.com',            enabled: true },
  { label: 'Google Maps',     sub: 'Análisis de zonas', url: 'https://maps.google.com',        enabled: true },
]

function toLinks(raw: unknown, fallback: LinkItem[]): LinkItem[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return (raw as LinkItem[]).map((p) => ({ ...p, enabled: p.enabled !== false }))
  }
  return fallback
}

// ─── Display card ─────────────────────────────────────────────────────────────

function ResourceCard({ link, icon: Icon }: { link: LinkItem; icon: React.ElementType }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div className="rounded-lg border bg-card p-3.5 flex items-center gap-3 transition-shadow hover:shadow-md cursor-pointer">
        <div className="flex-shrink-0 rounded-lg p-2" style={{ background: 'oklch(0.78 0.15 92.7 / 0.09)' }}>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{link.label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{link.sub}</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
      </div>
    </a>
  )
}

function CategorySection({
  title, description, items, icon,
}: {
  title: string
  description: string
  items: LinkItem[]
  icon: React.ElementType
}) {
  const visible = items.filter((i) => i.enabled)
  if (visible.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((link) => (
          <ResourceCard key={link.url} link={link} icon={icon} />
        ))}
      </div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, title }: { value: boolean; onChange: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      title={title}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer focus:outline-none ${
        value ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
        value ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

// ─── Sortable link row ────────────────────────────────────────────────────────

function SortableLinkRow({
  id, item, index, onChange, onToggle, onRemove,
}: {
  id: string
  item: LinkItem
  index: number
  onChange: (i: number, field: keyof LinkItem, v: string) => void
  onToggle: (i: number) => void
  onRemove: (i: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`rounded-lg border p-3 flex flex-col gap-2 bg-card transition-opacity ${item.enabled ? '' : 'opacity-50'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5">
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-muted-foreground truncate flex-1">
          {item.label || 'Sin nombre'}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle value={item.enabled} onChange={() => onToggle(index)} title={item.enabled ? 'Visible' : 'Oculto'} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}
            className="text-muted-foreground hover:text-destructive px-1.5 h-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_2fr] gap-2">
        <Input placeholder="Nombre" value={item.label}
          onChange={(e) => onChange(index, 'label', e.target.value)} className="text-sm h-8" />
        <Input placeholder="Descripción" value={item.sub}
          onChange={(e) => onChange(index, 'sub', e.target.value)} className="text-sm h-8" />
        <Input placeholder="https://..." value={item.url}
          onChange={(e) => onChange(index, 'url', e.target.value)} className="text-sm h-8" />
      </div>
    </div>
  )
}

// ─── Link section editor ──────────────────────────────────────────────────────

function LinkSectionEditor({
  icon: Icon, title, description, addLabel, items, setItems, sectionKey,
}: {
  icon: React.ElementType
  title: string
  description: string
  addLabel: string
  items: LinkItem[]
  setItems: React.Dispatch<React.SetStateAction<LinkItem[]>>
  sectionKey: string
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const ids = items.map((_, i) => `${sectionKey}_${i}`)
      setItems((prev) => arrayMove(prev, ids.indexOf(active.id as string), ids.indexOf(over.id as string)))
    }
  }

  const ids = items.map((_, i) => `${sectionKey}_${i}`)

  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { ...EMPTY_LINK }])} className="text-xs h-7 px-2.5">
          <Plus className="h-3 w-3 mr-1" /> Agregar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{description}</p>

      {items.length === 0 ? (
        <div className="border border-dashed rounded-lg py-6 flex flex-col items-center gap-2">
          <Icon className="h-6 w-6 text-muted-foreground opacity-30" />
          <button type="button" onClick={() => setItems((p) => [...p, { ...EMPTY_LINK }])}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            + {addLabel}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[24px_1fr_1fr_2fr] gap-2 px-0.5">
            <span />
            <p className="text-xs text-muted-foreground">Nombre</p>
            <p className="text-xs text-muted-foreground">Descripción</p>
            <p className="text-xs text-muted-foreground">URL</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {items.map((item, i) => (
                <SortableLinkRow
                  key={ids[i]} id={ids[i]} item={item} index={i}
                  onChange={(idx, field, v) => setItems((prev) => prev.map((it, j) => j === idx ? { ...it, [field]: v } : it))}
                  onToggle={(idx) => setItems((prev) => prev.map((it, j) => j === idx ? { ...it, enabled: !it.enabled } : it))}
                  onRemove={(idx) => setItems((prev) => prev.filter((_, j) => j !== idx))}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { ...EMPTY_LINK }])} className="w-full text-xs mt-1">
            <Plus className="h-3 w-3 mr-1.5" /> {addLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function RecursosPage() {
  const { data: config, isLoading } = useConsultoraConfig()
  const save = useSaveConsultoraConfig()

  const [editMode, setEditMode] = useState(false)
  const [portales, setPortales]         = useState<LinkItem[]>([])
  const [noticias, setNoticias]         = useState<LinkItem[]>([])
  const [datosOficiales, setDatosOficiales] = useState<LinkItem[]>([])
  const [herramientas, setHerramientas] = useState<LinkItem[]>([])
  const [saved, setSaved]               = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)

  useEffect(() => {
    const md = (config?.market_data ?? {}) as Record<string, unknown>
    setPortales(toLinks(md.portales, DEFAULT_PORTALES))
    setNoticias(toLinks(md.noticias, DEFAULT_NOTICIAS))
    setDatosOficiales(toLinks(md.datos_oficiales, DEFAULT_DATOS_OFICIALES))
    setHerramientas(toLinks(md.herramientas, DEFAULT_HERRAMIENTAS))
  }, [config])

  function handleSave() {
    setSaveError(null)
    save.mutate(
      {
        nombre:    config?.nombre    ?? 'Consultora',
        logo_url:  config?.logo_url  ?? null,
        telefono:  config?.telefono  ?? null,
        email:     config?.email     ?? null,
        whatsapp:  config?.whatsapp  ?? null,
        instagram: config?.instagram ?? null,
        sitio_web: config?.sitio_web ?? null,
        market_data: {
          portales,
          noticias,
          datos_oficiales: datosOficiales,
          herramientas,
        },
      },
      {
        onSuccess: () => {
          setSaved(true)
          setSaveError(null)
          setTimeout(() => { setSaved(false); setEditMode(false) }, 1500)
        },
        onError: (e: Error) => {
          setSaveError(e.message || 'Error al guardar.')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recursos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {editMode
              ? 'Editá tus recursos. Los cambios se guardan al presionar Guardar.'
              : 'Directorio de accesos rápidos para análisis de mercado, verificación legal y contexto económico.'}
          </p>
        </div>
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setEditMode((v) => !v); setSaveError(null) }}
          className="flex-shrink-0"
        >
          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
          {editMode ? 'Cancelar' : 'Gestionar'}
        </Button>
      </div>

      {/* Error */}
      {saveError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* ── Vista de consulta ── */}
      {!editMode && (
        <div className="flex flex-col gap-8">
          <CategorySection
            title="Portales inmobiliarios"
            description="Fuentes para comparar precios, analizar el mercado y detectar oportunidades de inversión."
            items={portales}
            icon={Globe}
          />
          <CategorySection
            title="Noticias económicas"
            description="Fuentes de información para seguir el contexto económico del mercado."
            items={noticias}
            icon={Newspaper}
          />
          <CategorySection
            title="Datos oficiales"
            description="Fuentes institucionales para verificación legal, valuación fiscal y análisis demográfico."
            items={datosOficiales}
            icon={Building2}
          />
          <CategorySection
            title="Herramientas"
            description="Herramientas operativas del trabajo diario: gestión de alquileres, tipo de cambio y análisis de zonas."
            items={herramientas}
            icon={Wrench}
          />
        </div>
      )}

      {/* ── Modo edición ── */}
      {editMode && (
        <div className="flex flex-col gap-4">
          <LinkSectionEditor
            icon={Globe}
            title="Portales inmobiliarios"
            description="Portales de propiedades para comparar precios y analizar el mercado."
            addLabel="Agregar portal"
            items={portales}
            setItems={setPortales}
            sectionKey="portales"
          />
          <LinkSectionEditor
            icon={Newspaper}
            title="Noticias económicas"
            description="Fuentes de noticias para seguir el contexto económico del mercado."
            addLabel="Agregar fuente"
            items={noticias}
            setItems={setNoticias}
            sectionKey="noticias"
          />
          <LinkSectionEditor
            icon={Building2}
            title="Datos oficiales"
            description="Fuentes institucionales: BCP, Catastro, Registro Público, INE, etc."
            addLabel="Agregar fuente oficial"
            items={datosOficiales}
            setItems={setDatosOficiales}
            sectionKey="datos_oficiales"
          />
          <LinkSectionEditor
            icon={Wrench}
            title="Herramientas"
            description="Herramientas operativas del trabajo diario."
            addLabel="Agregar herramienta"
            items={herramientas}
            setItems={setHerramientas}
            sectionKey="herramientas"
          />

          {/* Save bar */}
          <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-3 flex items-center justify-between gap-4 -mx-6 px-6 z-10 mt-2">
            <span className="text-xs text-muted-foreground">
              {saved ? '✓ Cambios guardados' : 'Recordá guardar antes de salir.'}
            </span>
            <Button onClick={handleSave} disabled={save.isPending} className="min-w-[140px]">
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <><Check className="h-4 w-4 mr-1.5" />Guardado</>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
