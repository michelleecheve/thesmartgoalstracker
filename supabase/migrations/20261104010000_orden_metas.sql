-- =====================================================================
-- Metas SMART · Orden manual de metas (y de hábitos, si aún no existe)
-- ---------------------------------------------------------------------
-- sort_order guarda el orden elegido arrastrando. Es nulo mientras no se
-- reordene: esos elementos se muestran al final, en su orden de creación.
-- Es seguro ejecutarlo aunque la columna de hábitos ya exista.
-- =====================================================================
alter table public.habits add column if not exists sort_order integer;
alter table public.goals  add column if not exists sort_order integer;
