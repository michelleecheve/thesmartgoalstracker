-- =====================================================================
-- Metas SMART · Orden manual de hábitos
-- ---------------------------------------------------------------------
-- sort_order guarda el orden que la usuaria elige arrastrando los hábitos
-- en Inicio. Es nulo mientras no los reordene: esos hábitos se muestran
-- al final, por hora y nombre.
-- =====================================================================
alter table public.habits add column sort_order integer;
