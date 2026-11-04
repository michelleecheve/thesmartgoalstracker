-- =====================================================================
-- Metas SMART · Días con la racha congelada
-- ---------------------------------------------------------------------
-- Una fila = un día excepcional en que la persona no pudo hacer sus
-- hábitos y decidió congelar la racha: ese día no la suma ni la rompe.
-- =====================================================================
create table public.streak_freezes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),

  constraint streak_freezes_unique_day unique (user_id, date)
);

alter table public.streak_freezes enable row level security;

create policy "Datos propios" on public.streak_freezes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on public.streak_freezes to authenticated;
