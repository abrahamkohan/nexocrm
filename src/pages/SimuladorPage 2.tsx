// src/pages/SimuladorPage.tsx
import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimSelector } from '@/components/simulator/SimSelector'
import { ScenarioAirbnb } from '@/components/simulator/ScenarioAirbnb'
import { ScenarioAlquiler } from '@/components/simulator/ScenarioAlquiler'
import { ScenarioPlusvalia } from '@/components/simulator/ScenarioPlusvalia'
import { useSimStore, useAirbnbInputs, useAlquilerInputs, usePlusvaliaInputs } from '@/simulator/store'
import { calcAirbnb, calcAlquiler, calcPlusvalia } from '@/simulator/engine'
import { useSaveSimulation } from '@/hooks/useSimulations'
import { useProjects } from '@/hooks/useProjects'
import { useTypologies } from '@/hooks/useTypologies'
import { formatMoney } from '@/utils/money'

type Tab = 'airbnb' | 'alquiler' | 'plusvalia'

const TABS: { id: Tab; label: string }[] = [
  { id: 'airbnb',    label: 'Airbnb' },
  { id: 'alquiler',  label: 'Alquiler Tradicional' },
  { id: 'plusvalia', label: 'Plusvalía en Obra' },
]

export function SimuladorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('airbnb')
  const { projectId, typologyId, clientId, baseValues, overrides, resetOverrides } = useSimStore()
  const saveSimulation = useSaveSimulation()

  const { data: projects = [] } = useProjects()
  const { data: typologies = [] } = useTypologies(projectId ?? '')

  const airbnbInputs = useAirbnbInputs()
  const alquilerInputs = useAlquilerInputs()
  const plusvaliaInputs = usePlusvaliaInputs()

  const isReady = !!(projectId && typologyId && clientId && baseValues?.price_usd)

  async function handleSave() {
    if (!projectId || !typologyId || !clientId) return

    const project = projects.find((p) => p.id === projectId)
    const typology = typologies.find((t) => t.id === typologyId)
    if (!project || !typology) return

    await saveSimulation.mutateAsync({
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

    alert('Simulación guardada correctamente.')
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
          <Button
            size="sm"
            disabled={!isReady || saveSimulation.isPending}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saveSimulation.isPending ? 'Guardando...' : 'Guardar simulación'}
          </Button>
        </div>
      </div>

      {/* Selector */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <p className="text-sm font-medium">Selección</p>
        <SimSelector />
        {isReady && (
          <p className="text-xs text-muted-foreground">
            Precio base: <strong>{formatMoney((baseValues?.price_usd ?? 0) * 100, 'USD')}</strong>
          </p>
        )}
        {!isReady && (
          <p className="text-xs text-muted-foreground">
            Seleccioná proyecto, tipología y cliente para comenzar.
          </p>
        )}
      </div>

      {/* Scenario tabs */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex border-b">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
          {!isReady ? (
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
