// src/pages/SimuladorPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimSelector } from '@/components/simulator/SimSelector'
import { ScenarioAirbnb } from '@/components/simulator/ScenarioAirbnb'
import { ScenarioAlquiler } from '@/components/simulator/ScenarioAlquiler'
import { ScenarioPlusvalia } from '@/components/simulator/ScenarioPlusvalia'
import { FlipCalculator } from '@/components/simulator/FlipCalculator'
import { useSimStore, useAirbnbInputs, useAlquilerInputs, usePlusvaliaInputs } from '@/simulator/store'
import { calcAirbnb, calcAlquiler, calcPlusvalia } from '@/simulator/engine'
import { useSaveSimulation } from '@/hooks/useSimulations'
import { useProjects } from '@/hooks/useProjects'
import { useTypologies } from '@/hooks/useTypologies'
import { formatUsd } from '@/utils/money'

type Tab = 'airbnb' | 'alquiler' | 'plusvalia' | 'flip'

const TABS: { id: Tab; label: string }[] = [
  { id: 'airbnb',    label: 'Alquiler Temporal (Airbnb)' },
  { id: 'alquiler',  label: 'Alquiler Tradicional' },
  { id: 'plusvalia', label: 'Plusvalía en Obra' },
  { id: 'flip',      label: 'Calculadora Flip' },
]

export function SimuladorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('airbnb')
  const navigate = useNavigate()
  const { projectId, typologyId, clientId, baseValues, overrides, resetOverrides, reset } = useSimStore()
  const saveSimulation = useSaveSimulation()

  const { data: projects = [] } = useProjects()
  const { data: typologies = [] } = useTypologies(projectId ?? '')

  const airbnbInputs = useAirbnbInputs()
  const alquilerInputs = useAlquilerInputs()
  const plusvaliaInputs = usePlusvaliaInputs()

  const isReady = !!(projectId && typologyId && clientId && baseValues?.price_usd)
  const isFlip = activeTab === 'flip'

  async function handleSave() {
    if (!projectId || !typologyId || !clientId) return
    const project = projects.find((p) => p.id === projectId)
    const typology = typologies.find((t) => t.id === typologyId)
    if (!project || !typology) return

    const saved = await saveSimulation.mutateAsync({
      client_id: clientId,
      project_id: projectId,
      typology_id: typologyId,
      scenario_airbnb: { inputs: airbnbInputs, result: calcAirbnb(airbnbInputs) },
      scenario_alquiler: { inputs: alquilerInputs, result: calcAlquiler(alquilerInputs) },
      scenario_plusvalia: { inputs: plusvaliaInputs, result: calcPlusvalia(plusvaliaInputs) },
      snapshot_project: project as unknown as Record<string, unknown>,
      snapshot_typology: typology as unknown as Record<string, unknown>,
      report_path: null,
    })

    window.open(`/informes/${saved.id}`, '_blank')
    reset()
    navigate('/')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Simulador</h1>
        <div className="flex gap-2">
          {Object.keys(overrides).length > 0 && (
            <Button variant="outline" size="sm" onClick={resetOverrides}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Resetear
            </Button>
          )}
          {!isFlip && (
            <Button size="sm" disabled={!isReady || saveSimulation.isPending} onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saveSimulation.isPending ? 'Guardando...' : 'Guardar simulación'}
            </Button>
          )}
        </div>
      </div>

      {/* Selector — hidden on flip tab */}
      {!isFlip && (
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-700">Selección</p>
          <SimSelector />
          {isReady && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Unidad: <strong className="text-gray-700">{formatUsd(baseValues?.price_usd ?? 0)}</strong></span>
              {(baseValues?.cochera_price ?? 0) > 0 && (
                <span>Cochera: <strong className="text-gray-700">+ {formatUsd(baseValues.cochera_price)}</strong></span>
              )}
              {(baseValues?.baulera_price ?? 0) > 0 && (
                <span>Baulera: <strong className="text-gray-700">+ {formatUsd(baseValues.baulera_price)}</strong></span>
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
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-background border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isFlip ? (
            <FlipCalculator />
          ) : !isReady ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Completá la selección arriba para ver los escenarios.
            </p>
          ) : (
            <>
              {activeTab === 'airbnb'    && <ScenarioAirbnb />}
              {activeTab === 'alquiler'  && <ScenarioAlquiler />}
              {activeTab === 'plusvalia' && <ScenarioPlusvalia />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
