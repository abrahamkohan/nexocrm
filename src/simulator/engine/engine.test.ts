// src/simulator/engine/engine.test.ts
import { describe, it, expect } from 'vitest'
import { calcAirbnb } from './airbnb'
import { calcAlquiler } from './alquiler'
import { calcPlusvalia } from './plusvalia'

// Reference values:
// price: $120,000 | nightly: $80 | occupancy: 70% | platform: 3% | opex: 20%
// gross_monthly = 80 × 0.70 × 30 = 1,680
// gross_annual  = 1,680 × 12    = 20,160
// net_annual    = 20,160 - (20,160×0.03) - (20,160×0.20) = 20,160 - 604.8 - 4,032 = 15,523.2
// gross_yield   = 20,160 / 120,000 = 0.168
// net_yield     = 15,523.2 / 120,000 ≈ 0.12936
// payback_years = 120,000 / 15,523.2 ≈ 7.73
describe('calcAirbnb', () => {
  const base = {
    price_usd: 120_000,
    nightly_rate: 80,
    occupancy_pct: 0.70,
    platform_fee_pct: 0.03,
    operating_expenses_pct: 0.20,
    years: 5,
  }

  it('computes gross_monthly correctly', () => {
    expect(calcAirbnb(base).gross_monthly).toBeCloseTo(1_680, 2)
  })

  it('computes gross_annual correctly', () => {
    expect(calcAirbnb(base).gross_annual).toBeCloseTo(20_160, 2)
  })

  it('computes net_annual after platform fee and opex', () => {
    expect(calcAirbnb(base).net_annual).toBeCloseTo(15_523.2, 2)
  })

  it('computes net_monthly correctly', () => {
    expect(calcAirbnb(base).net_monthly).toBeCloseTo(1_293.6, 2)
  })

  it('computes gross_yield correctly', () => {
    expect(calcAirbnb(base).gross_yield).toBeCloseTo(0.168, 4)
  })

  it('computes net_yield correctly', () => {
    expect(calcAirbnb(base).net_yield).toBeCloseTo(0.12936, 4)
  })

  it('computes payback_years correctly', () => {
    expect(calcAirbnb(base).payback_years).toBeCloseTo(7.73, 1)
  })

  it('returns Infinity payback when net_annual is zero', () => {
    expect(
      calcAirbnb({ ...base, platform_fee_pct: 0.5, operating_expenses_pct: 0.5 }).payback_years
    ).toBe(Infinity)
  })

  it('returns zero yield when price_usd is zero', () => {
    expect(calcAirbnb({ ...base, price_usd: 0 }).gross_yield).toBe(0)
  })
})

// Reference values:
// price: $120,000 | rent: $600/mo | vacancy: 5% | admin: 8% | maintenance: 5%
// gross_annual       = 600 × 12         = 7,200
// effective_annual   = 7,200 × 0.95     = 6,840
// admin_fee_annual   = 6,840 × 0.08     = 547.2
// maintenance_annual = 7,200 × 0.05     = 360
// net_annual         = 6,840 - 547.2 - 360 = 5,932.8
// gross_yield        = 7,200 / 120,000  = 0.06
// net_yield          = 5,932.8 / 120,000 ≈ 0.04944
// payback_years      = 120,000 / 5,932.8 ≈ 20.23
describe('calcAlquiler', () => {
  const base = {
    price_usd: 120_000,
    monthly_rent: 600,
    vacancy_pct: 0.05,
    admin_fee_pct: 0.08,
    maintenance_pct: 0.05,
    years: 10,
  }

  it('computes gross_annual correctly', () => {
    expect(calcAlquiler(base).gross_annual).toBeCloseTo(7_200, 2)
  })

  it('computes net_annual after vacancy, admin and maintenance', () => {
    expect(calcAlquiler(base).net_annual).toBeCloseTo(5_932.8, 2)
  })

  it('computes gross_yield correctly', () => {
    expect(calcAlquiler(base).gross_yield).toBeCloseTo(0.06, 4)
  })

  it('computes net_yield correctly', () => {
    expect(calcAlquiler(base).net_yield).toBeCloseTo(0.04944, 4)
  })

  it('cap_rate equals net_yield for unleveraged purchase', () => {
    const r = calcAlquiler(base)
    expect(r.cap_rate).toBe(r.net_yield)
  })

  it('computes payback_years correctly', () => {
    expect(calcAlquiler(base).payback_years).toBeCloseTo(20.23, 1)
  })

  it('returns Infinity payback when net_annual is zero', () => {
    expect(
      calcAlquiler({ ...base, vacancy_pct: 1 }).payback_years
    ).toBe(Infinity)
  })
})

// Reference values:
// price: $100,000 | expected: $140,000 | anticipo: 30% | years: 3
// anticipo_amount = 100,000 × 0.30 = 30,000
// total_gain      = 140,000 - 100,000 = 40,000
// roi_total       = 40,000 / 100,000  = 0.40
// roi_annualized  = (1.40)^(1/3) - 1  ≈ 0.1187
// cash_on_cash    = 40,000 / 30,000   ≈ 1.3333
describe('calcPlusvalia', () => {
  const base = {
    price_usd: 100_000,
    expected_value_usd: 140_000,
    anticipo_pct: 0.30,
    years: 3,
  }

  it('computes anticipo_amount correctly', () => {
    expect(calcPlusvalia(base).anticipo_amount).toBeCloseTo(30_000, 2)
  })

  it('computes total_gain correctly', () => {
    expect(calcPlusvalia(base).total_gain).toBeCloseTo(40_000, 2)
  })

  it('computes roi_total correctly', () => {
    expect(calcPlusvalia(base).roi_total).toBeCloseTo(0.40, 4)
  })

  it('computes roi_annualized correctly', () => {
    expect(calcPlusvalia(base).roi_annualized).toBeCloseTo(0.1187, 3)
  })

  it('computes cash_on_cash correctly', () => {
    expect(calcPlusvalia(base).cash_on_cash).toBeCloseTo(1.3333, 3)
  })

  it('handles negative gain (loss scenario)', () => {
    const r = calcPlusvalia({ ...base, expected_value_usd: 80_000 })
    expect(r.total_gain).toBe(-20_000)
    expect(r.roi_total).toBeCloseTo(-0.20, 4)
  })

  it('returns zero cash_on_cash when anticipo is zero', () => {
    expect(calcPlusvalia({ ...base, anticipo_pct: 0 }).cash_on_cash).toBe(0)
  })
})
