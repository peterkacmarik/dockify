-- Create intake_fields table
create table intake_fields (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  is_active boolean default true,
  is_required boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table intake_fields enable row level security;

-- Policies (Assuming full access for auth users for now, can be restricted later)
create policy "Enable read access for authenticated users" on intake_fields
  for select to authenticated using (true);

create policy "Enable insert access for authenticated users" on intake_fields
  for insert to authenticated with check (true);

create policy "Enable update access for authenticated users" on intake_fields
  for update to authenticated using (true);

create policy "Enable delete access for authenticated users" on intake_fields
  for delete to authenticated using (true);

-- Seed defaults
insert into intake_fields (key, label, is_active, is_required) values
('sku', 'SKU', true, true),
('quantity', 'Množstvo', true, true),
('description', 'Popis', true, false),
('price', 'Cena', true, false);
