export type Currency = 'USD' | 'PYG'

export interface MoneyValue {
  amount: number   // USD: integer cents. PYG: integer Guaraníes.
  currency: Currency
}

// Multiple financing plans per project (separate table, not JSONB on projects)
export interface FinancingPlan {
  id: string
  project_id: string
  name: string                // e.g. "Plan 30/70", "Plan Tradicional"
  anticipo_pct: number        // percentage 0-100
  cuotas: number              // number of installments during construction
  tasa_interes_pct: number | null  // annual interest rate 0-100 (null = 0%)
  pago_final_pct: number | null    // balloon payment percentage at delivery
  notas: string | null
  created_at: string
}
