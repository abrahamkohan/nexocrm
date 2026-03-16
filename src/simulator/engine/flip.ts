// src/simulator/engine/flip.ts
import type { FlipInputs, FlipResult } from './types'

export function calcFlip(inputs: FlipInputs): FlipResult {
  const {
    precio_lista,
    entrega,
    cantidad_cuotas,
    valor_cuota,
    rentabilidad_anual_percent,
    comision_percent,
  } = inputs

  const capital_invertido = entrega + cantidad_cuotas * valor_cuota
  const anos = cantidad_cuotas / 12
  const ganancia = capital_invertido * (rentabilidad_anual_percent / 100) * anos
  const comision = precio_lista * (comision_percent / 100)
  const precio_flip = capital_invertido + ganancia + comision
  const neto_inversor = capital_invertido + ganancia
  const roi_total = capital_invertido > 0 ? (ganancia / capital_invertido) * 100 : 0
  const roi_anualizado = anos > 0 ? roi_total / anos : 0

  return {
    capital_invertido,
    anos,
    ganancia,
    comision,
    precio_flip,
    neto_inversor,
    roi_total,
    roi_anualizado,
  }
}
