-- =====================================================================
-- Metas SMART · Frase personalizada de Inicio
-- ---------------------------------------------------------------------
-- Frase que se muestra en la tarjeta amarilla de Inicio. Si es nula, la
-- app usa la frase por defecto.
-- =====================================================================
alter table public.profiles
  add column if not exists motivation_phrase text
  check (motivation_phrase is null or char_length(motivation_phrase) between 1 and 200);
