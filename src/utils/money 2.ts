// src/utils/money.ts
//
// CONVENTION: This is the ONLY legitimate path for formatting monetary values.
// Never use raw number.toFixed() or string concatenation for money display.
//
// Storage convention:
//   USD: stored as integer cents (bigint in DB). $120,000 = 12,000,000 cents.
//        Column naming: *_usd (e.g. price_usd)
//   PYG: stored as integer Guaraníes (bigint in DB). No conversion needed.
//        Column naming: *_pyg (e.g. price_pyg)
//
// Display boundary rules:
//   - Convert cents→dollars ONLY at the display boundary (formatMoney)
//   - Convert dollars→cents ONLY at the input boundary (usdToCents, called once on form submit)
//   - All calculations use integer values; round ONLY at the final display boundary

import type { Currency } from '@/types/domain'

export type { Currency }

/**
 * Format a monetary amount for display.
 *
 * @param amount - USD: integer cents. PYG: integer Guaraníes.
 * @param currency - 'USD' | 'PYG'
 * @returns Formatted string e.g. '$120,000.00' or '₲ 1.000.000'
 */
export function formatMoney(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100) // cents → dollars at display boundary only
  }

  // PYG: stored as integer Guaraníes, no conversion needed.
  // ISO 4217 PYG = 0 minor units → zero decimal places.
  // Note: es-PY uses '.' as thousands separator which collides with the "no dot" test contract.
  // Using en-US locale to get ',' as thousands separator instead.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a decimal ratio as a percentage string.
 *
 * @param rate - decimal value (e.g. 0.08 for 8%)
 * @param decimals - decimal places in output (default 2)
 * @returns e.g. '8.00%'
 */
export function formatPercent(rate: number, decimals = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`
}

/**
 * Round to nearest integer — use at every calculation display boundary.
 * Never call Math.round mid-calculation; defer to this function at output.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount)
}

/**
 * Convert USD display value (dollars) to storage value (cents).
 * Call ONCE on form input before passing to any calculation or DB write.
 *
 * @param dollars - e.g. 120000.50
 * @returns integer cents, e.g. 12000050
 */
export function usdToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert USD storage value (cents) to display value (dollars).
 * Use when you need the raw number for arithmetic (not for display — use formatMoney for display).
 *
 * @param cents - integer cents, e.g. 12000000
 * @returns dollars, e.g. 120000
 */
export function centsToUsd(cents: number): number {
  return cents / 100
}
