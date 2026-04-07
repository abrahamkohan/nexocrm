alter table clients
  add column if not exists estado       text default 'nuevo',
  add column if not exists converted_at timestamptz;
