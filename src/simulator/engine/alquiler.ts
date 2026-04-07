// src/simulator/engine/alquiler.ts
import type { AlquilerInputs, AlquilerResult } from './types'

export function calcAlquiler(inputs: AlquilerInputs): AlquilerResult {
  const {
    precio_compra_propiedad_usd,
    amoblamiento_preparacion_str_usd,
    incluir_amoblamiento,
    alquiler_mensual_usd,
    tarifa_administracion_percent,
    expensas_usd_mes,
    otros_usd_mes,
  } = inputs

  const inversion_total = precio_compra_propiedad_usd +
    (incluir_amoblamiento ? amoblamiento_preparacion_str_usd : 0)

  const ingresos_brutos_mensuales = alquiler_mensual_usd
  const ingresos_brutos_anuales = ingresos_brutos_mensuales * 12

  const costo_admin = ingresos_brutos_mensuales * (tarifa_administracion_percent / 100)
  const costos_totales_mensuales = costo_admin + expensas_usd_mes + otros_usd_mes

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
    costos_totales_mensuales,
    ganancia_neta_mensual,
    ganancia_neta_anual,
    rentabilidad_percent,
    anos_recuperacion,
  }
}
