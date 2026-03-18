alter table clients
  add column if not exists tipo            text    default 'lead' check (tipo in ('lead', 'cliente')),
  add column if not exists fuente          text,
  add column if not exists dni             text,
  add column if not exists fecha_nacimiento date,
  add column if not exists campos_extra    jsonb;
