-- =====================================================================
-- Metas SMART · Esquema inicial
-- ---------------------------------------------------------------------
-- Convenciones
--  * Todas las tablas usan UUID y pertenecen a un usuario (user_id).
--  * user_id se repite en las tablas hijas para que las políticas RLS sean
--    simples y rápidas. Claves foráneas compuestas (id, user_id) garantizan
--    que un hábito no pueda apuntar a la meta de otro usuario.
--  * Las fechas de calendario son `date` (fecha local del usuario, sin hora).
--    La app envía siempre la fecha local; así no hay desfases por zona horaria.
--  * Los periodos [start_date, end_date] son inclusivos en ambos extremos.
--
-- Archivado y eliminación
--  * Archivar = status 'archived' + archived_at. No se borra nada: el
--    historial y las estadísticas pasadas se conservan.
--  * Eliminar = borrado definitivo en cascada (meta → hábitos → versiones,
--    pausas y cumplimientos). La app siempre pide confirmación antes.
--
-- Historial de programación
--  * habit_schedule_versions guarda cada cambio de frecuencia con la fecha
--    desde la que aplica. Para un día D se usa la versión con el mayor
--    effective_from <= D. Las ocurrencias NO se guardan: se calculan bajo
--    demanda para el rango solicitado. Solo se guardan los cumplimientos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: datos públicos del usuario (1 a 1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- goals: metas SMART
-- ---------------------------------------------------------------------
create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name           text not null check (char_length(trim(name)) between 1 and 120),
  description    text check (char_length(description) <= 1000),
  category       text not null default 'otra'
                 check (category in ('educacion', 'carrera', 'salud', 'ejercicio',
                                     'finanzas', 'personal', 'creatividad', 'otra')),
  color          text check (char_length(color) <= 32),
  status         text not null default 'active'
                 check (status in ('active', 'paused', 'completed', 'archived')),

  -- Componentes SMART
  specific       text not null default '' check (char_length(specific) <= 1000),
  measurable     text not null default '' check (char_length(measurable) <= 1000),
  achievable     text not null default '' check (char_length(achievable) <= 1000),
  relevant       text not null default '' check (char_length(relevant) <= 1000),

  start_date     date not null,
  deadline       date not null,

  -- Indicador numérico opcional (avance hacia la meta)
  metric_name    text check (char_length(metric_name) <= 80),
  metric_unit    text check (char_length(metric_unit) <= 40),
  metric_target  numeric check (metric_target > 0),
  metric_current numeric not null default 0 check (metric_current >= 0),

  completed_at   timestamptz,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint goals_deadline_after_start check (deadline >= start_date),
  constraint goals_metric_complete check (metric_target is null or metric_name is not null),
  constraint goals_id_user_unique unique (id, user_id)
);

create index goals_user_status_idx on public.goals (user_id, status);
create index goals_user_deadline_idx on public.goals (user_id, deadline);

create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- Periodos en los que una meta estuvo en pausa (no penalizan la constancia).
create table public.goal_pauses (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null,
  user_id    uuid not null default auth.uid(),
  start_date date not null,
  end_date   date,          -- null = pausa vigente; inclusivo
  created_at timestamptz not null default now(),

  constraint goal_pauses_goal_fk foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade,
  constraint goal_pauses_range check (end_date is null or end_date >= start_date)
);

create index goal_pauses_goal_idx on public.goal_pauses (goal_id, start_date);
create unique index goal_pauses_one_open_idx on public.goal_pauses (goal_id) where end_date is null;

-- ---------------------------------------------------------------------
-- habits: hábitos recurrentes, siempre asociados a una meta
-- ---------------------------------------------------------------------
create table public.habits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid(),
  goal_id          uuid not null,

  name             text not null check (char_length(trim(name)) between 1 and 120),
  description      text check (char_length(description) <= 1000),
  start_date       date not null,
  end_date         date,
  time_of_day      time,
  duration_minutes integer check (duration_minutes between 1 and 1440),
  icon             text check (char_length(icon) <= 40),
  color            text check (char_length(color) <= 32),
  status           text not null default 'active'
                   check (status in ('active', 'paused', 'archived')),

  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint habits_goal_fk foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade,
  constraint habits_range check (end_date is null or end_date >= start_date),
  constraint habits_id_user_unique unique (id, user_id)
);

create index habits_user_status_idx on public.habits (user_id, status);
create index habits_goal_idx on public.habits (goal_id);

create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- Versiones de programación con fecha de vigencia.
create table public.habit_schedule_versions (
  id             uuid primary key default gen_random_uuid(),
  habit_id       uuid not null,
  user_id        uuid not null default auth.uid(),
  effective_from date not null,
  frequency_type text not null check (frequency_type in ('daily', 'weekly', 'interval')),
  -- Días ISO: 1 = lunes … 7 = domingo (solo para 'weekly')
  weekdays       smallint[],
  -- Cada N días, contando desde effective_from (solo para 'interval')
  interval_days  integer,
  created_at     timestamptz not null default now(),

  constraint schedule_habit_fk foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade,
  constraint schedule_unique_from unique (habit_id, effective_from),
  constraint schedule_shape check (
    (frequency_type = 'daily'
       and weekdays is null and interval_days is null)
    or (frequency_type = 'weekly'
       and interval_days is null
       and weekdays is not null
       and cardinality(weekdays) between 1 and 7
       and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[])
    or (frequency_type = 'interval'
       and weekdays is null
       and interval_days between 2 and 365)
  )
);

-- Periodos en los que un hábito estuvo en pausa.
create table public.habit_pauses (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null,
  user_id    uuid not null default auth.uid(),
  start_date date not null,
  end_date   date,          -- null = pausa vigente; inclusivo
  created_at timestamptz not null default now(),

  constraint habit_pauses_habit_fk foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade,
  constraint habit_pauses_range check (end_date is null or end_date >= start_date)
);

create index habit_pauses_habit_idx on public.habit_pauses (habit_id, start_date);
create unique index habit_pauses_one_open_idx on public.habit_pauses (habit_id) where end_date is null;

-- Cumplimientos: una fila = hábito completado ese día.
-- Sin fila: "pendiente" si el día es hoy o futuro, "no completado" si ya pasó.
create table public.habit_completions (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid not null,
  user_id      uuid not null default auth.uid(),
  date         date not null,
  completed_at timestamptz not null default now(),

  constraint completions_habit_fk foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade,
  constraint completions_unique_day unique (habit_id, date)
);

create index completions_user_date_idx on public.habit_completions (user_id, date);

-- Impide marcar días futuros. Se permite +1 día respecto a UTC porque la fecha
-- local del usuario puede ir adelantada (zonas hasta UTC+14).
create or replace function public.validate_habit_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date > (now() at time zone 'utc')::date + 1 then
    raise exception 'No puedes marcar un hábito en una fecha futura'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger habit_completions_validate
  before insert or update on public.habit_completions
  for each row execute function public.validate_habit_completion();

-- ---------------------------------------------------------------------
-- Tablero de visión
-- ---------------------------------------------------------------------
create table public.vision_board_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_key text not null
               check (question_key in ('persona', 'importancia', 'vida', 'motivacion')),
  answer       text not null default '' check (char_length(answer) <= 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint vision_entries_unique_question unique (user_id, question_key)
);

create trigger vision_board_entries_updated_at
  before update on public.vision_board_entries
  for each row execute function public.set_updated_at();

create table public.vision_board_images (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id      uuid,
  storage_path text not null unique,
  caption      text check (char_length(caption) <= 300),
  width        integer check (width > 0),
  height       integer check (height > 0),
  position     integer not null default 0,
  created_at   timestamptz not null default now(),

  -- Si se elimina la meta, la imagen se conserva sin asociación.
  constraint vision_images_goal_fk foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete set null (goal_id),
  -- La ruta debe vivir dentro de la carpeta del propio usuario.
  constraint vision_images_path_owner check (storage_path like user_id::text || '/%')
);

create index vision_images_user_position_idx on public.vision_board_images (user_id, position);

-- =====================================================================
-- Row Level Security: cada usuario solo accede a sus propios datos.
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.goals                   enable row level security;
alter table public.goal_pauses             enable row level security;
alter table public.habits                  enable row level security;
alter table public.habit_schedule_versions enable row level security;
alter table public.habit_pauses            enable row level security;
alter table public.habit_completions       enable row level security;
alter table public.vision_board_entries    enable row level security;
alter table public.vision_board_images     enable row level security;

-- Perfil: leer y editar solo el propio (se crea por trigger, se borra en cascada).
create policy "Perfil propio: leer" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Perfil propio: editar" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Resto de tablas: acceso completo solo a filas propias.
do $$
declare
  t text;
begin
  foreach t in array array[
    'goals', 'goal_pauses', 'habits', 'habit_schedule_versions',
    'habit_pauses', 'habit_completions', 'vision_board_entries', 'vision_board_images'
  ] loop
    execute format(
      'create policy "Datos propios" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- Permisos explícitos: solo usuarios autenticados; los anónimos no ven nada.
revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.goals, public.goal_pauses, public.habits, public.habit_schedule_versions,
  public.habit_pauses, public.habit_completions,
  public.vision_board_entries, public.vision_board_images
  to authenticated;

-- =====================================================================
-- Storage: bucket privado para las imágenes del tablero de visión.
-- Estructura de rutas: {user_id}/{archivo}
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vision-board',
  'vision-board',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Visión: ver imágenes propias" on storage.objects
  for select to authenticated
  using (bucket_id = 'vision-board' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Visión: subir imágenes propias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vision-board' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Visión: actualizar imágenes propias" on storage.objects
  for update to authenticated
  using (bucket_id = 'vision-board' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'vision-board' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Visión: eliminar imágenes propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vision-board' and (storage.foldername(name))[1] = (select auth.uid())::text);
