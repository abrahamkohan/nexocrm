// src/simulator/engine/plusvalia.ts
import type { PlusvaliaInputs, PlusvaliaResult } from './types'

export function calcPlusvalia(inputs: PlusvaliaInputs): PlusvaliaResult {
  const { precio_compra_propiedad_usd, precio_estimado_venta_usd, anios_tenencia } = inputs

  const inversion_total = precio_compra_propiedad_usd
  const plusvalia = precio_estimado_venta_usd - precio_compra_propiedad_usd

  const roi_total_percent = inversion_total > 0
    ? (plusvalia / inversion_total) * 100
    : 0

  const roi_anualizado_percent = anios_tenencia > 0 && inversion_total > 0
    ? (Math.pow(precio_estimado_venta_usd / inversion_total, 1 / anios_tenencia) - 1) * 100
    : 0

  return {
    inversion_total,
    plusvalia,
    roi_total_percent,
    roi_anualizado_percent,
  }
}
