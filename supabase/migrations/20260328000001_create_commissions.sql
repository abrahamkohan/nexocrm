-- Tabla principal de comisiones
CREATE TABLE commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_vendido  TEXT NOT NULL,
  fecha_cierre      DATE,
  importe_comision  NUMERIC(12,2) NOT NULL,
  facturada         BOOLEAN NOT NULL DEFAULT false,
  numero_factura    TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Tabla de relación comisión-cliente (muchos a muchos)
CREATE TABLE commission_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tipo          TEXT CHECK (tipo IN ('vendedor', 'comprador')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(commission_id, client_id)
);

-- Tabla de ingresos/pagos por comisión
CREATE TABLE commission_incomes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  fecha_ingreso    DATE NOT NULL,
  monto_ingresado  NUMERIC(12,2) NOT NULL,
  medio_pago       TEXT CHECK (medio_pago IN ('transferencia', 'efectivo')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_commission_clients_commission ON commission_clients(commission_id);
CREATE INDEX idx_commission_incomes_commission ON commission_incomes(commission_id);

-- Row Level Security
ALTER TABLE commissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users full access" ON commissions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth users full access" ON commission_clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth users full access" ON commission_incomes
  FOR ALL USING (auth.role() = 'authenticated');
