// src/simulator/engine/airbnb.ts
import type { AirbnbInputs, AirbnbResult } from './types'

export function calcAirbnb(inputs: AirbnbInputs): AirbnbResult {
  const {
    precio_compra_propiedad_usd,
    amoblamiento_preparacion_str_usd,
    noches_ocupadas_mes,
    tarifa_diaria_promedio_usd,
    tarifa_administracion_percent,
    expensas_usd_mes,
    electricidad_usd_mes,
    internet_usd_mes,
    cable_tv_usd_mes,
  } = inputs

  const inversion_total = precio_compra_propiedad_usd + amoblamiento_preparacion_str_usd

  const ingresos_brutos_mensuales = noches_ocupadas_mes * tarifa_diaria_promedio_usd
  const ingresos_brutos_anuales = ingresos_brutos_mensuales * 12

  const costo_administracion = ingresos_brutos_mensuales * (tarifa_administracion_percent / 100)
  const costos_operativos = expensas_usd_mes + electricidad_usd_mes + internet_usd_mes + cable_tv_usd_mes
  const costos_totales_mensuales = costo_administracion + costos_operativos

  const ganancia_neta_mensual = ingresos_brutos_mensuales - costos_totales_mensuales
  const ganancia_neta_anual = ganancia_neta_mensual * 12

  const rentabilidad_percent = inversion_total > 0
    ? (ganancia_neta_anual / inversion_total) * 100
    : 0

  const anos_recuperacion = ganancia_neta_anual > 0
    ? inversion_total / ganancia_neta_anual
    : Infinity

  return {
    inversion_total,
    ingresos_brutos_mensuales,
    ingresos_brutos_anuales,
    costo_administracion,
    costos_operativos,
    costos_totales_mensuales,
    ganancia_neta_mensual,
    ganancia_neta_anual,
    rentabilidad_percent,
    anos_recuperacion,
  }
}
