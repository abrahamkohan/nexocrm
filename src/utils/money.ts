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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a decimal ratio as a percentage string.
 */
export function formatPercent(rate: number, decimals = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`
}

/**
 * Round to nearest integer.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount)
}

/**
 * Convert USD display value (dollars) to storage value (cents).
 */
export function usdToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert USD storage value (cents) to display value (dollars).
 */
export function centsToUsd(cents: number): number {
  return cents / 100
}

/**
 * Format a USD dollar amount (not cents) for display.
 * Use for simulator engine outputs which are in dollars.
 */
export function formatUsd(dollars: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}
