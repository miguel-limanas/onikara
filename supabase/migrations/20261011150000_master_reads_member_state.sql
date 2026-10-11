-- O mestre acompanha o estado dos jogadores da campanha: itens equipados,
-- inventário e efeitos ativos (HP e mana já vêm do perfil, que ele lê).

create policy "masters can read campaign member inventory" on public.inventory
  for select using (public.is_master_of_profile(profile_id));

create policy "masters can read campaign member equipment" on public.equipment
  for select using (public.is_master_of_profile(profile_id));

create policy "masters can read campaign member status effects" on public.character_status_effects
  for select using (public.is_master_of_profile(profile_id));
