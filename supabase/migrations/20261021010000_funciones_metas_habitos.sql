-- =====================================================================
-- Metas SMART · Funciones de administración de metas y hábitos
-- ---------------------------------------------------------------------
-- Operaciones que modifican varias tablas a la vez se hacen aquí para que
-- sean atómicas. Todas son SECURITY INVOKER: se ejecutan con los permisos
-- del usuario, así que las políticas RLS siguen aplicando.
--
-- Regla de estados y pausas
--   Un estado distinto de 'active' (paused, completed, archived) tiene
--   siempre un periodo de pausa abierto. Al volver a 'active' se cierra.
--   Así, ni la pausa ni el tiempo archivado o completado penalizan la
--   constancia si después se reanuda o restaura.
--
--   p_today es la fecha local del usuario (la envía la app).
--   Al cerrar una pausa, termina el día anterior a p_today; si empezó hoy,
--   se elimina (no hubo días en pausa).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Cambiar el estado de una meta: pausar, reanudar, completar, archivar, restaurar.
-- ---------------------------------------------------------------------
create or replace function public.set_goal_status(p_goal_id uuid, p_status text, p_today date)
returns public.goals
language plpgsql
set search_path = ''
as $$
declare
  g public.goals;
begin
  if p_status not in ('active', 'paused', 'completed', 'archived') then
    raise exception 'Estado de meta no válido';
  end if;

  select * into g from public.goals where id = p_goal_id for update;
  if not found then
    raise exception 'No encontramos esta meta';
  end if;

  if p_status = 'active' then
    -- Cierra la pausa abierta (si empezó hoy, se elimina).
    delete from public.goal_pauses
     where goal_id = p_goal_id and end_date is null and start_date >= p_today;
    update public.goal_pauses set end_date = p_today - 1
     where goal_id = p_goal_id and end_date is null;
  elsif not exists (select 1 from public.goal_pauses where goal_id = p_goal_id and end_date is null) then
    insert into public.goal_pauses (goal_id, user_id, start_date) values (p_goal_id, g.user_id, p_today);
  end if;

  update public.goals
     set status = p_status,
         completed_at = case
           when p_status = 'completed' then coalesce(g.completed_at, now())
           when p_status = 'archived' then g.completed_at
           else null
         end,
         archived_at = case when p_status = 'archived' then coalesce(g.archived_at, now()) else null end
   where id = p_goal_id
  returning * into g;

  return g;
end;
$$;

-- ---------------------------------------------------------------------
-- Cambiar el estado de un hábito: pausar, reanudar, archivar, restaurar.
-- ---------------------------------------------------------------------
create or replace function public.set_habit_status(p_habit_id uuid, p_status text, p_today date)
returns public.habits
language plpgsql
set search_path = ''
as $$
declare
  h public.habits;
begin
  if p_status not in ('active', 'paused', 'archived') then
    raise exception 'Estado de hábito no válido';
  end if;

  select * into h from public.habits where id = p_habit_id for update;
  if not found then
    raise exception 'No encontramos este hábito';
  end if;

  if p_status = 'active' then
    -- Cierra la pausa abierta (si empezó hoy, se elimina).
    delete from public.habit_pauses
     where habit_id = p_habit_id and end_date is null and start_date >= p_today;
    update public.habit_pauses set end_date = p_today - 1
     where habit_id = p_habit_id and end_date is null;
  elsif not exists (select 1 from public.habit_pauses where habit_id = p_habit_id and end_date is null) then
    insert into public.habit_pauses (habit_id, user_id, start_date) values (p_habit_id, h.user_id, p_today);
  end if;

  update public.habits
     set status = p_status,
         archived_at = case when p_status = 'archived' then coalesce(h.archived_at, now()) else null end
   where id = p_habit_id
  returning * into h;

  return h;
end;
$$;

-- ---------------------------------------------------------------------
-- Crear un hábito junto con su primera versión de programación.
-- ---------------------------------------------------------------------
create or replace function public.create_habit(
  p_goal_id uuid,
  p_name text,
  p_start_date date,
  p_frequency_type text,
  p_weekdays smallint[] default null,
  p_interval_days integer default null,
  p_end_date date default null,
  p_description text default null,
  p_time_of_day time default null,
  p_duration_minutes integer default null,
  p_icon text default null,
  p_color text default null
)
returns public.habits
language plpgsql
set search_path = ''
as $$
declare
  h public.habits;
begin
  insert into public.habits (goal_id, name, description, start_date, end_date,
                             time_of_day, duration_minutes, icon, color)
  values (p_goal_id, p_name, p_description, p_start_date, p_end_date,
          p_time_of_day, p_duration_minutes, p_icon, p_color)
  returning * into h;

  insert into public.habit_schedule_versions (habit_id, user_id, effective_from, frequency_type, weekdays, interval_days)
  values (h.id, h.user_id, p_start_date, p_frequency_type, p_weekdays, p_interval_days);

  return h;
end;
$$;

-- ---------------------------------------------------------------------
-- Cambiar la frecuencia de un hábito sin alterar el pasado.
-- La nueva versión rige desde p_effective_from (normalmente hoy) o desde la
-- fecha de inicio si el hábito aún no empieza. Las versiones que iban a
-- empezar en esa fecha o después se reemplazan.
-- ---------------------------------------------------------------------
create or replace function public.change_habit_schedule(
  p_habit_id uuid,
  p_effective_from date,
  p_frequency_type text,
  p_weekdays smallint[] default null,
  p_interval_days integer default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  h public.habits;
  v_from date;
begin
  select * into h from public.habits where id = p_habit_id for update;
  if not found then
    raise exception 'No encontramos este hábito';
  end if;

  v_from := greatest(p_effective_from, h.start_date);

  delete from public.habit_schedule_versions
   where habit_id = p_habit_id and effective_from >= v_from;

  insert into public.habit_schedule_versions (habit_id, user_id, effective_from, frequency_type, weekdays, interval_days)
  values (p_habit_id, h.user_id, v_from, p_frequency_type, p_weekdays, p_interval_days);
end;
$$;

-- Permisos: solo usuarios autenticados.
revoke all on function public.set_goal_status(uuid, text, date) from public, anon;
revoke all on function public.set_habit_status(uuid, text, date) from public, anon;
revoke all on function public.create_habit(uuid, text, date, text, smallint[], integer, date, text, time, integer, text, text) from public, anon;
revoke all on function public.change_habit_schedule(uuid, date, text, smallint[], integer) from public, anon;

grant execute on function public.set_goal_status(uuid, text, date) to authenticated;
grant execute on function public.set_habit_status(uuid, text, date) to authenticated;
grant execute on function public.create_habit(uuid, text, date, text, smallint[], integer, date, text, time, integer, text, text) to authenticated;
grant execute on function public.change_habit_schedule(uuid, date, text, smallint[], integer) to authenticated;
