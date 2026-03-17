// src/pages/SimuladorPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimSelector } from '@/components/simulator/SimSelector'
import { ScenarioAirbnb } from '@/components/simulator/ScenarioAirbnb'
import { ScenarioAlquiler } from '@/components/simulator/ScenarioAlquiler'
import { ScenarioPlusvalia } from '@/components/simulator/ScenarioPlusvalia'
import { FlipCalculator } from '@/components/simulator/FlipCalculator'
import { useSimStore, useAirbnbInputs, useAlquilerInputs, usePlusvaliaInputs } from '@/simulator/store'
import { calcAirbnb, calcAlquiler, calcPlusvalia, calcFlip } from '@/simulator/engine'
import type { FlipInputs } from '@/simulator/engine'
import { useSaveSimulation } from '@/hooks/useSimulations'
import { useProjects } from '@/hooks/useProjects'
import { useTypologies } from '@/hooks/useTypologies'
import { formatUsd } from '@/utils/money'

const FLIP_DEFAULTS: FlipInputs = {
  precio_lista: 120000,
  entrega: 30000,
  cantidad_cuotas: 24,
  valor_cuota: 2000,
  rentabilidad_anual_percent: 12,
  comision_percent: 3,
}

const SCENARIOS = [
  {
    id: 'airbnb',
    label: 'Alquiler Temporal',
    tag: 'Airbnb / STR',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    headerBg: '#e0f2fe',
    headerText: '#0369a1',
    accent: '#0369a1',
  },
  {
    id: 'alquiler',
    label: 'Alquiler Tradicional',
    tag: 'Largo plazo',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    headerBg: '#f1f5f9',
    headerText: '#475569',
    accent: '#475569',
  },
  {
    id: 'plusvalia',
    label: 'Plusvalía en Obra',
    tag: 'Valorización',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    headerBg: '#fef3c7',
    headerText: '#b45309',
    accent: '#d97706',
  },
  {
    id: 'flip',
    label: 'Calculadora Flip',
    tag: 'Reventa',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: '#d1fae5',
    headerText: '#065f46',
    accent: '#059669',
  },
] as const

export function SimuladorPage() {
  const [modoRapido, setModoRapido] = useState(false)
  const [rapido, setRapido] = useState({ proyecto: '', tipologia: '', cliente: '', precio: '' })
  const [flipInputs, setFlipInputs] = useState<FlipInputs>(FLIP_DEFAULTS)
  const navigate = useNavigate()

  const { projectId, typologyId, clientId, baseValues, overrides, resetOverrides, reset, setBaseValues } = useSimStore()
  const saveSimulation = useSaveSimulation()

  const { data: projects = [] } = useProjects()
  const { data: typologies = [] } = useTypologies(projectId ?? '')

  const airbnbInputs = useAirbnbInputs()
  const alquilerInputs = useAlquilerInputs()
  const plusvaliaInputs = usePlusvaliaInputs()

  const rapidoPrecio = parseFloat(rapido.precio)
  const isReadyRapido = !!(modoRapido && rapido.proyecto && rapido.tipologia && rapido.cliente && rapidoPrecio > 0)
  const isReady = modoRapido ? isReadyRapido : !!(projectId && typologyId && clientId && baseValues?.price_usd)

  const airbnbResult   = calcAirbnb(airbnbInputs)
  const alquilerResult = calcAlquiler(alquilerInputs)
  const pvResult       = calcPlusvalia(plusvaliaInputs)
  const flipResult     = calcFlip(flipInputs)

  function handleRapidoChange(field: keyof typeof rapido, val: string) {
    const next = { ...rapido, [field]: val }
    setRapido(next)
    if (field === 'precio') {
      const p = parseFloat(val)
      if (!isNaN(p) && p > 0) setBaseValues({ price_usd: p, cochera_price: 0, baulera_price: 0 })
    }
  }

  function handleFlipChange<K extends keyof FlipInputs>(key: K, value: FlipInputs[K]) {
    setFlipInputs((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    let snapshotProject: Record<string, unknown>
    let snapshotTypology: Record<string, unknown>
    let clientIdToSave: string | undefined = undefined
    let projectIdToSave: string | undefined = undefined
    let typologyIdToSave: string | undefined = undefined

    if (modoRapido) {
      snapshotProject  = { name: rapido.proyecto, location: '', developer_name: '' }
      snapshotTypology = { name: rapido.tipologia, area_m2: 0, unit_type: 'otro' }
    } else {
      if (!projectId || !typologyId || !clientId) return
      const project  = projects.find((p) => p.id === projectId)
      const typology = typologies.find((t) => t.id === typologyId)
      if (!project || !typology) return
      snapshotProject  = project  as unknown as Record<string, unknown>
      snapshotTypology = typology as unknown as Record<string, unknown>
      clientIdToSave   = clientId
      projectIdToSave  = projectId
      typologyIdToSave = typologyId
    }

    const saved = await saveSimulation.mutateAsync({
      client_id: clientIdToSave,
      project_id: projectIdToSave,
      typology_id: typologyIdToSave,
      scenario_airbnb:    { inputs: airbnbInputs,    result: airbnbResult },
      scenario_alquiler:  { inputs: alquilerInputs,  result: alquilerResult },
      scenario_plusvalia: { inputs: plusvaliaInputs, result: pvResult },
      snapshot_project:  { ...snapshotProject,  _cliente: modoRapido ? rapido.cliente : undefined },
      snapshot_typology: snapshotTypology,
      report_path: null,
    })

    window.open(`/informes/${saved.id}`, '_blank')
    reset()
    setRapido({ proyecto: '', tipologia: '', cliente: '', precio: '' })
    navigate('/')
  }

  // Summary data per scenario
  const summaries = [
    {
      ...SCENARIOS[0],
      mainLabel: 'Ganancia neta / mes',
      main: formatUsd(airbnbResult.ganancia_neta_mensual),
      secondaries: [
        { label: 'Rentabilidad anual', value: `${airbnbResult.rentabilidad_percent.toFixed(1)}%` },
        { label: 'Recupero', value: isFinite(airbnbResult.anos_recuperacion) ? `${airbnbResult.anos_recuperacion.toFixed(1)} años` : '—' },
      ],
    },
    {
      ...SCENARIOS[1],
      mainLabel: 'Ganancia neta / mes',
      main: formatUsd(alquilerResult.ganancia_neta_mensual),
      secondaries: [
        { label: 'Rentabilidad anual', value: `${alquilerResult.rentabilidad_percent.toFixed(1)}%` },
        { label: 'Recupero', value: isFinite(alquilerResult.anos_recuperacion) ? `${alquilerResult.anos_recuperacion.toFixed(1)} años` : '—' },
      ],
    },
    {
      ...SCENARIOS[2],
      mainLabel: 'ROI anualizado',
      main: `${pvResult.roi_anualizado_percent.toFixed(1)}%`,
      secondaries: [
        { label: 'Plusvalía total', value: formatUsd(pvResult.plusvalia) },
        { label: 'ROI total', value: `${pvResult.roi_total_percent.toFixed(1)}%` },
      ],
    },
    {
      ...SCENARIOS[3],
      mainLabel: 'Neto para inversor',
      main: formatUsd(flipResult.neto_inversor),
      secondaries: [
        { label: 'ROI anualizado', value: `${flipResult.roi_anualizado.toFixed(1)}%` },
        { label: 'Capital invertido', value: formatUsd(flipResult.capital_invertido) },
      ],
    },
  ]

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Comparador de Inversión</h1>
          <p className="text-sm text-muted-foreground">Analizá y comparé estrategias simultáneamente</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {Object.keys(overrides).length > 0 && (
            <Button variant="outline" size="sm" onClick={resetOverrides}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Resetear
            </Button>
          )}
          <Button size="sm" disabled={!isReady || saveSimulation.isPending} onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saveSimulation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Selector */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Selección</p>
          <button
            onClick={() => {
              setModoRapido(!modoRapido)
              setRapido({ proyecto: '', tipologia: '', cliente: '', precio: '' })
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              modoRapido
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <Zap className="h-3 w-3" />
            {modoRapido ? 'Modo Casual activo' : 'Modo Casual'}
          </button>
        </div>

        {modoRapido ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Proyecto</Label>
              <Input
                placeholder="Ej: Torre Norte"
                value={rapido.proyecto}
                onChange={(e) => handleRapidoChange('proyecto', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Tipología</Label>
              <Input
                placeholder="Ej: 2 Dormitorios"
                value={rapido.tipologia}
                onChange={(e) => handleRapidoChange('tipologia', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Cliente</Label>
              <Input
                placeholder="Nombre del cliente"
                value={rapido.cliente}
                onChange={(e) => handleRapidoChange('cliente', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-gray-500">Precio USD</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ej: 85000"
                value={rapido.precio}
                onChange={(e) => handleRapidoChange('precio', e.target.value)}
              />
            </div>
            {isReadyRapido && rapidoPrecio > 0 && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Unidad: <strong className="text-gray-700">{formatUsd(rapidoPrecio)}</strong>
              </p>
            )}
            {!isReadyRapido && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Completá todos los campos para continuar.
              </p>
            )}
          </div>
        ) : (
          <>
            <SimSelector />
            {isReady && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Unidad: <strong className="text-gray-700">{formatUsd(baseValues?.price_usd ?? 0)}</strong></span>
                {(baseValues?.cochera_price ?? 0) > 0 && (
                  <span>Cochera: <strong className="text-gray-700">+ {formatUsd(baseValues?.cochera_price ?? 0)}</strong></span>
                )}
                {(baseValues?.baulera_price ?? 0) > 0 && (
                  <span>Baulera: <strong className="text-gray-700">+ {formatUsd(baseValues?.baulera_price ?? 0)}</strong></span>
                )}
                {((baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0)) > 0 && (
                  <span className="font-medium text-gray-700">
                    Total: <strong>{formatUsd((baseValues?.price_usd ?? 0) + (baseValues?.cochera_price ?? 0) + (baseValues?.baulera_price ?? 0))}</strong>
                  </span>
                )}
              </div>
            )}
            {!isReady && (
              <p className="text-xs text-muted-foreground">
                Seleccioná proyecto, tipología y cliente para comenzar.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Comparison summary cards ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Comparativa de estrategias
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border-2 ${s.border} ${s.bg} p-4 flex flex-col gap-3`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.accent }}>
                  {s.tag}
                </p>
                <p className="font-semibold text-sm text-gray-800 mt-0.5">{s.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{s.mainLabel}</p>
                <p className="text-2xl font-bold text-gray-900">{s.main}</p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-current/10 pt-2.5">
                {s.secondaries.map((sec) => (
                  <div key={sec.label} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{sec.label}</span>
                    <span className="font-semibold text-gray-700">{sec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed scenario editors ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Airbnb detail */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: SCENARIOS[0].headerBg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SCENARIOS[0].headerText }}>
              {SCENARIOS[0].tag}
            </p>
            <p className="font-medium text-sm text-gray-800">{SCENARIOS[0].label}</p>
          </div>
          <div className="p-5">
            {isReady
              ? <ScenarioAirbnb />
              : <p className="text-sm text-muted-foreground text-center py-8">Completá la selección arriba para ver los escenarios.</p>
            }
          </div>
        </div>

        {/* Alquiler detail */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: SCENARIOS[1].headerBg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SCENARIOS[1].headerText }}>
              {SCENARIOS[1].tag}
            </p>
            <p className="font-medium text-sm text-gray-800">{SCENARIOS[1].label}</p>
          </div>
          <div className="p-5">
            {isReady
              ? <ScenarioAlquiler />
              : <p className="text-sm text-muted-foreground text-center py-8">Completá la selección arriba para ver los escenarios.</p>
            }
          </div>
        </div>

        {/* Plusvalía detail */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: SCENARIOS[2].headerBg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SCENARIOS[2].headerText }}>
              {SCENARIOS[2].tag}
            </p>
            <p className="font-medium text-sm text-gray-800">{SCENARIOS[2].label}</p>
          </div>
          <div className="p-5">
            {isReady
              ? <ScenarioPlusvalia />
              : <p className="text-sm text-muted-foreground text-center py-8">Completá la selección arriba para ver los escenarios.</p>
            }
          </div>
        </div>

        {/* Flip detail */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: SCENARIOS[3].headerBg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SCENARIOS[3].headerText }}>
              {SCENARIOS[3].tag}
            </p>
            <p className="font-medium text-sm text-gray-800">{SCENARIOS[3].label}</p>
          </div>
          <div className="p-5">
            <FlipCalculator inputs={flipInputs} onChange={handleFlipChange} />
          </div>
        </div>

      </div>
    </div>
  )
}
