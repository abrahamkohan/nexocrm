import { describe, it, expect } from 'vitest'
// money.ts created in plan 01-03. These tests are RED until then.
// DO NOT skip — the red state is intentional (Nyquist Wave 0 requirement).
import { formatMoney, formatPercent, usdToCents } from './money'

describe('money.ts — formatMoney', () => {
  it('formats USD cents as dollars with 2 decimal places', () => {
    expect(formatMoney(12000000, 'USD')).toBe('$120,000.00')
  })

  it('formats USD zero cents as $0.00', () => {
    expect(formatMoney(50, 'USD')).toBe('$0.50')
  })

  it('formats PYG integers without decimal places', () => {
    const formatted = formatMoney(1000000, 'PYG')
    expect(formatted).not.toContain('.')
  })
})

describe('money.ts — formatPercent', () => {
  it('converts decimal to percentage string with 2 decimal places', () => {
    expect(formatPercent(0.08)).toBe('8.00%')
  })

  it('handles float near-misses without artifact decimals', () => {
    expect(formatPercent(0.0799999999)).toBe('8.00%')
  })
})

describe('money.ts — usdToCents', () => {
  it('converts dollars to integer cents without float error', () => {
    expect(usdToCents(120000.50)).toBe(12000050)
  })

  it('converts whole dollar amounts', () => {
    expect(usdToCents(1)).toBe(100)
  })
})
