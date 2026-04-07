-- flip_calculations: guardado de cálculos de reventa (flip)
CREATE TABLE IF NOT EXISTS public.flip_calculations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label                       text NOT NULL DEFAULT '',
  precio_lista                numeric NOT NULL DEFAULT 0,
  entrega                     numeric NOT NULL DEFAULT 0,
  cantidad_cuotas             integer NOT NULL DEFAULT 0,
  valor_cuota                 numeric NOT NULL DEFAULT 0,
  rentabilidad_anual_percent  numeric NOT NULL DEFAULT 12,
  comision_percent            numeric NOT NULL DEFAULT 3,
  notas                       text,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flip_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_flip_calculations"
  ON public.flip_calculations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
