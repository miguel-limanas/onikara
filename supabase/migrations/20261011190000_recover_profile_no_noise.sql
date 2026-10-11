-- recover_profile só grava quando o estado muda. Antes, cada chamada reescrevia o
-- perfil (mesmo sem regeneração), o que geraria eventos Realtime a cada minuto do job.

create or replace function public.recover_profile(p_profile uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_state jsonb;
  v_hp numeric;
  v_max_hp numeric;
  v_mana numeric;
  v_max_mana numeric;
  v_hp_at timestamptz;
  v_mana_at timestamptz;
  v_days integer;
  v_minutes numeric;
  v_rule jsonb;
  v_die integer;
  v_flat integer;
  v_cap integer;
  v_rate numeric;
  v_gained numeric := 0;
  v_index integer;
begin
  select current_state into v_old from public.profiles where id = p_profile for update;
  if v_old is null then
    return null;
  end if;
  v_state := v_old;

  v_max_hp := coalesce((v_state ->> 'max_hp')::numeric, (v_state ->> 'hp')::numeric, 1);
  v_max_mana := coalesce((v_state ->> 'max_mana')::numeric, (v_state ->> 'mana')::numeric, 0);
  v_hp := least(v_max_hp, coalesce((v_state ->> 'hp')::numeric, v_max_hp));
  v_mana := least(v_max_mana, coalesce((v_state ->> 'mana')::numeric, v_max_mana));

  -- Cheio e com marcas de tempo: nada a regenerar, nada a gravar.
  if v_hp >= v_max_hp and v_mana >= v_max_mana and (v_state ? 'hp_at') and (v_state ? 'mana_at') then
    return v_state;
  end if;

  v_hp_at := coalesce((v_state ->> 'hp_at')::timestamptz, now());
  v_mana_at := coalesce((v_state ->> 'mana_at')::timestamptz, now());

  select regeneration into v_rule from public.active_recovery_rules limit 1;
  v_die := greatest(1, coalesce((v_rule ->> 'hp_per_day_die')::integer, 6));
  v_flat := coalesce((v_rule ->> 'hp_per_day_flat')::integer, 1);
  v_cap := coalesce((v_rule ->> 'max_days_counted')::integer, 30);

  v_days := floor(extract(epoch from (now() - v_hp_at)) / 86400)::integer;
  if v_days > 0 then
    if v_hp < v_max_hp then
      for v_index in 1..least(v_days, v_cap) loop
        v_gained := v_gained + v_flat + 1 + floor(random() * v_die);
      end loop;
      v_hp := least(v_max_hp, v_hp + v_gained);
    end if;
    v_hp_at := v_hp_at + (v_days * interval '1 day');
  end if;

  select regeneration into v_rule from public.active_mana_rules limit 1;
  v_rate := coalesce((v_rule ->> 'rest_per_minute')::numeric, 25);
  v_minutes := floor(extract(epoch from (now() - v_mana_at)) / 60);
  if v_minutes > 0 then
    v_mana := least(v_max_mana, v_mana + v_minutes * v_rate);
    v_mana_at := now();
  end if;

  v_state := v_state || jsonb_build_object(
    'hp', v_hp, 'mana', v_mana, 'hp_at', v_hp_at, 'mana_at', v_mana_at
  );
  if v_state is distinct from v_old then
    update public.profiles set current_state = v_state where id = p_profile;
  end if;
  return v_state;
end;
$$;

revoke all on function public.recover_profile(uuid) from public, anon, authenticated;
