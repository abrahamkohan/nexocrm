// src/lib/commissions.test.ts
import { describe, it, expect } from 'vitest'
import { calcTotals, getFacturacionStatus, getProjectoDisplay, fmtCurrency } from './commissions'
import type { CommissionFull } from './commissions'

describe('commissions helpers', () => {
  describe('calcTotals', () => {
    it('calculates totalCobrado from incomes', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [
          { id: 'i1', commission_id: '1', monto_ingresado: 5000, fecha_ingreso: '', numero_factura: null, created_at: '' },
          { id: 'i2', commission_id: '1', monto_ingresado: 3000, fecha_ingreso: '', numero_factura: null, created_at: '' },
        ],
        commission_clients: [],
        projects: null,
      }

      const result = calcTotals(commission)
      expect(result.totalCobrado).toBe(8000)
      expect(result.saldoPendiente).toBe(2000)
      expect(result.estado).toBe('🔴')
    })

    it('returns green when fully paid', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 5000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [
          { id: 'i1', commission_id: '1', monto_ingresado: 5000, fecha_ingreso: '', numero_factura: null, created_at: '' },
        ],
        commission_clients: [],
        projects: null,
      }

      const result = calcTotals(commission)
      expect(result.estado).toBe('🟢')
      expect(result.saldoPendiente).toBe(0)
    })
  })

  describe('getFacturacionStatus', () => {
    it('returns sin_facturar when no splits', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [],
        commission_clients: [],
        projects: null,
      }

      const result = getFacturacionStatus(commission)
      expect(result.status).toBe('sin_facturar')
      expect(result.facturados).toBe(0)
      expect(result.total).toBe(0)
    })

    it('returns completo when all facturados', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [
          { id: 's1', commission_id: '1', agente_id: 'a1', agente_nombre: 'Juan', porcentaje: 50, monto: 5000, facturada: true, numero_factura: 'A001', fecha_factura: '', created_at: '' },
          { id: 's2', commission_id: '1', agente_id: 'a2', agente_nombre: 'Pedro', porcentaje: 50, monto: 5000, facturada: true, numero_factura: 'A002', fecha_factura: '', created_at: '' },
        ],
        commission_incomes: [],
        commission_clients: [],
        projects: null,
      }

      const result = getFacturacionStatus(commission)
      expect(result.status).toBe('completo')
      expect(result.facturados).toBe(2)
      expect(result.total).toBe(2)
    })

    it('returns parcial when some facturados', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [
          { id: 's1', commission_id: '1', agente_id: 'a1', agente_nombre: 'Juan', porcentaje: 50, monto: 5000, facturada: true, numero_factura: 'A001', fecha_factura: '', created_at: '' },
          { id: 's2', commission_id: '1', agente_id: 'a2', agente_nombre: 'Pedro', porcentaje: 50, monto: 5000, facturada: false, numero_factura: null, fecha_factura: '', created_at: '' },
        ],
        commission_incomes: [],
        commission_clients: [],
        projects: null,
      }

      const result = getFacturacionStatus(commission)
      expect(result.status).toBe('parcial')
      expect(result.facturados).toBe(1)
      expect(result.total).toBe(2)
    })
  })

  describe('getProjectoDisplay', () => {
    it('returns null when no project', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [],
        commission_clients: [],
        projects: null,
      }

      expect(getProjectoDisplay(commission)).toBeNull()
    })

    it('returns name when no developer', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [],
        commission_clients: [],
        projects: { id: 'p1', name: 'Torres del Sol', developer_name: null, ciudad: null, barrio: null },
      }

      expect(getProjectoDisplay(commission)).toBe('Torres del Sol')
    })

    it('returns developer + name when has developer', () => {
      const commission: CommissionFull = {
        id: '1',
        proyecto_id: 'p1',
        agente_id: 'a1',
        importe_comision: 10000,
        estado: 'pendiente',
        fecha_cierre: null,
        notas: null,
        created_at: '',
        updated_at: '',
        commission_splits: [],
        commission_incomes: [],
        commission_clients: [],
        projects: { id: 'p1', name: 'Torres del Sol', developer_name: 'Inmobiliaria SA', ciudad: 'Asunción', barrio: ' Recoleta' },
      }

      expect(getProjectoDisplay(commission)).toBe('Inmobiliaria SA — Torres del Sol')
    })
  })

  describe('fmtCurrency', () => {
    it('formats USD amounts', () => {
      const formatted = fmtCurrency(1000)
      // es-PY uses space as thousand separator
      expect(formatted).toContain('1')
      expect(formatted).toContain('000')
      expect(formatted).toContain('USD')
    })
  })
})
