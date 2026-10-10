-- Fase 5 / plano 05-08: anti-trapaça.
-- O jogador não grava mais diretamente atributos, nível, XP, inventário nem progresso de missões:
-- criação de personagem por RPC; recompensas, missões e combate por funções do servidor.

-- 1. Criação de personagem pelo servidor ----------------------------------------------------

create or replace function public.create_character(
  p_name text,
  p_class_id text,
  p_race_id text,
  p_element_id text default 'neutral'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_class public.rpg_classes;
  v_race public.rpg_races;
  v_stats jsonb := '{}'::jsonb;
  v_key text;
  v_profile public.profiles;
  v_weapon text;
begin
  if v_user is null then
    raise exception 'Entre na sua conta para criar um personagem.' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where user_id = v_user) then
    raise exception 'Você já tem um personagem.' using errcode = '23505';
  end if;
  if length(v_name) < 2 or length(v_name) > 24 then
    raise exception 'O nome deve ter entre 2 e 24 caracteres.' using errcode = '22023';
  end if;

  select * into v_class from public.rpg_classes where id = p_class_id;
  if not found then
    raise exception 'Classe inválida.' using errcode = '22023';
  end if;
  select * into v_race from public.rpg_races where id = p_race_id;
  if not found then
    raise exception 'Raça inválida.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.elements where id = coalesce(p_element_id, 'neutral')) then
    raise exception 'Elemento inválido.' using errcode = '22023';
  end if;

  foreach v_key in array array['hp', 'mana', 'strength', 'defense', 'intelligence', 'speed'] loop
    v_stats := v_stats || jsonb_build_object(
      v_key,
      greatest(
        1,
        coalesce((v_class.base_stats ->> v_key)::numeric, 0) + coalesce((v_race.modifiers ->> v_key)::numeric, 0)
      )
    );
  end loop;

  insert into public.profiles (user_id, character_name, class_id, race_id, base_stats, current_state, element_id)
  values (
    v_user,
    v_name,
    p_class_id,
    p_race_id,
    v_stats,
    jsonb_build_object(
      'hp', v_stats -> 'hp', 'max_hp', v_stats -> 'hp',
      'mana', v_stats -> 'mana', 'max_mana', v_stats -> 'mana',
      'hp_at', now(), 'mana_at', now()
    ),
    coalesce(p_element_id, 'neutral')
  )
  returning * into v_profile;

  -- Kit inicial: arma da classe, armadura remendada e consumíveis básicos.
  v_weapon := case p_class_id when 'warrior' then 'training-sword' when 'mage' then 'apprentice-staff' else null end;
  insert into public.inventory (profile_id, item_id, quantity)
  select v_profile.id, kit.item_id, kit.quantity
  from (
    values (v_weapon, 1), ('patched-armor', 1), ('health-salve', 2), ('mana-tonic', 1)
  ) as kit(item_id, quantity)
  join public.items item on item.id = kit.item_id
  where kit.item_id is not null;

  return v_profile;
end;
$$;

revoke all on function public.create_character(text, text, text, text) from public, anon;
grant execute on function public.create_character(text, text, text, text) to authenticated;

-- 2. Restringe a escrita direta do jogador ----------------------------------------------------

-- Perfil: só nome e preferências podem ser alterados diretamente.
revoke insert, update on public.profiles from authenticated;
grant update (character_name, settings) on public.profiles to authenticated;

-- Inventário, missões e efeitos: o jogador só lê; a escrita passa por funções do servidor.
drop policy if exists "users can manage own inventory" on public.inventory;
create policy "users can read own inventory" on public.inventory for select using (
  exists (select 1 from public.profiles where profiles.id = inventory.profile_id and profiles.user_id = auth.uid())
);

drop policy if exists "users can manage own quests" on public.character_quests;
create policy "users can read own quests" on public.character_quests for select using (
  exists (select 1 from public.profiles where profiles.id = character_quests.profile_id and profiles.user_id = auth.uid())
);

drop policy if exists "users can manage own status effects" on public.character_status_effects;
create policy "users can read own status effects" on public.character_status_effects for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = character_status_effects.profile_id and profiles.user_id = auth.uid()
  )
);

-- Equipamento: o item precisa ser do próprio perfil e caber no slot (evita somar bônus de forma indevida).
create or replace function public.validate_equipment_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory public.inventory;
  v_type text;
begin
  select * into v_inventory from public.inventory where id = new.inventory_id;
  if not found or v_inventory.profile_id <> new.profile_id then
    raise exception 'Esse item não pertence ao personagem.' using errcode = '42501';
  end if;
  select item_type into v_type from public.items where id = v_inventory.item_id;
  if not (
    (v_type = 'weapon' and new.slot in ('main_hand', 'off_hand'))
    or (v_type = 'armor' and new.slot in ('head', 'body', 'legs'))
    or (v_type = 'accessory' and new.slot in ('accessory_1', 'accessory_2'))
  ) then
    raise exception 'Esse item não pode ser equipado nesse slot.' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists equipment_validate_slot on public.equipment;
create trigger equipment_validate_slot
  before insert or update on public.equipment
  for each row execute function public.validate_equipment_slot();
