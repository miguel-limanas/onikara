create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Onikara role claims are issued by Supabase Auth. Phase 1 activates
-- player/admin and recognizes master without granting master extra policies.
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', 'player')
$$;

create or replace function public.has_app_role(expected_role text)
returns boolean
language sql
stable
as $$
  select public.current_app_role() = expected_role
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.has_app_role('admin')
$$;

create or replace function public.is_master()
returns boolean
language sql
stable
as $$
  select public.has_app_role('master')
$$;

create table public.rpg_classes (
  id text primary key,
  name text not null unique,
  role text not null,
  description text not null default '',
  base_stats jsonb not null,
  scaling jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rpg_races (
  id text primary key,
  name text not null unique,
  ancestry text not null,
  modifiers jsonb not null default '{}'::jsonb,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.elements (
  id text primary key,
  name text not null unique,
  strong_against text[] not null default '{}',
  weak_against text[] not null default '{}',
  status_effect text,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.status_effects (
  id text primary key,
  name text not null unique,
  effect_type text not null check (effect_type in ('buff', 'debuff', 'damage_over_time', 'control', 'resource')),
  default_duration_turns integer not null default 1 check (default_duration_turns >= 0),
  stackable boolean not null default false,
  rules jsonb not null default '{}'::jsonb,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spells (
  id text primary key,
  name text not null unique,
  element_id text not null references public.elements(id),
  status_effect_id text references public.status_effects(id),
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  mana_cost integer not null check (mana_cost >= 0),
  cooldown_turns integer not null default 0 check (cooldown_turns >= 0),
  power integer not null check (power >= 0),
  target_type text not null default 'enemy' check (target_type in ('self', 'ally', 'enemy', 'all_allies', 'all_enemies')),
  effects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_spells (
  class_id text not null references public.rpg_classes(id) on delete cascade,
  spell_id text not null references public.spells(id) on delete cascade,
  unlock_level integer not null default 1 check (unlock_level >= 1),
  primary key (class_id, spell_id)
);

create table public.items (
  id text primary key,
  name text not null unique,
  item_type text not null check (item_type in ('weapon', 'armor', 'accessory', 'consumable', 'material', 'quest')),
  rarity text not null default 'common' check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  stackable boolean not null default false,
  max_stack integer not null default 1 check (max_stack > 0),
  stats jsonb not null default '{}'::jsonb,
  effects jsonb not null default '{}'::jsonb,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  character_name text not null,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  class_id text not null references public.rpg_classes(id),
  race_id text not null references public.rpg_races(id),
  base_stats jsonb not null,
  current_state jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.character_spells (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  spell_id text not null references public.spells(id),
  unlocked_at timestamptz not null default now(),
  equipped boolean not null default false,
  slot integer check (slot between 1 and 8),
  primary key (profile_id, spell_id),
  unique (profile_id, slot)
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.items(id),
  quantity integer not null default 1 check (quantity > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, item_id)
);

create table public.equipment (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('main_hand', 'off_hand', 'head', 'body', 'legs', 'accessory_1', 'accessory_2')),
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  equipped_at timestamptz not null default now(),
  primary key (profile_id, slot),
  unique (inventory_id)
);

create table public.character_status_effects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status_effect_id text not null references public.status_effects(id),
  stacks integer not null default 1 check (stacks > 0),
  remaining_turns integer not null default 1 check (remaining_turns >= 0),
  source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, status_effect_id)
);

create table public.enemies (
  id text primary key,
  name text not null unique,
  enemy_type text not null default 'monster',
  level integer not null default 1 check (level >= 1),
  element_id text references public.elements(id),
  base_stats jsonb not null,
  behavior jsonb not null default '{}'::jsonb,
  loot_table jsonb not null default '[]'::jsonb,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enemy_spells (
  enemy_id text not null references public.enemies(id) on delete cascade,
  spell_id text not null references public.spells(id),
  weight integer not null default 1 check (weight > 0),
  primary key (enemy_id, spell_id)
);

create table public.quests (
  id text primary key,
  title text not null unique,
  description text not null default '',
  min_level integer not null default 1 check (min_level >= 1),
  rewards jsonb not null default '{}'::jsonb,
  repeatable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_steps (
  id text primary key,
  quest_id text not null references public.quests(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  objective_type text not null check (objective_type in ('dialogue', 'defeat_enemy', 'collect_item', 'reach_level', 'custom')),
  target_ref text,
  target_count integer not null default 1 check (target_count > 0),
  metadata jsonb not null default '{}'::jsonb,
  unique (quest_id, step_order)
);

create table public.character_quests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quest_id text not null references public.quests(id),
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  progress jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (profile_id, quest_id)
);

create table public.combat_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  encounter_type text not null default 'pve' check (encounter_type in ('pve', 'pvp', 'quest', 'training')),
  status text not null default 'active' check (status in ('active', 'victory', 'defeat', 'escaped', 'abandoned')),
  turn_number integer not null default 0 check (turn_number >= 0),
  seed text,
  snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.combat_participants (
  id uuid primary key default gen_random_uuid(),
  combat_session_id uuid not null references public.combat_sessions(id) on delete cascade,
  participant_type text not null check (participant_type in ('profile', 'enemy', 'npc')),
  profile_id uuid references public.profiles(id) on delete cascade,
  enemy_id text references public.enemies(id),
  display_name text not null,
  team text not null check (team in ('player', 'enemy', 'neutral')),
  turn_order integer not null default 0,
  current_stats jsonb not null,
  status_effects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint combat_participant_ref check (
    (participant_type = 'profile' and profile_id is not null and enemy_id is null)
    or (participant_type = 'enemy' and enemy_id is not null and profile_id is null)
    or (participant_type = 'npc')
  )
);

create table public.combat_events (
  id uuid primary key default gen_random_uuid(),
  combat_session_id uuid not null references public.combat_sessions(id) on delete cascade,
  turn_number integer not null check (turn_number >= 0),
  actor_participant_id uuid references public.combat_participants(id) on delete set null,
  target_participant_id uuid references public.combat_participants(id) on delete set null,
  event_type text not null check (event_type in ('turn_start', 'spell_cast', 'basic_attack', 'item_used', 'status_applied', 'damage', 'heal', 'defeat', 'turn_end', 'system')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.progression_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  xp_curve jsonb not null,
  level_stat_scaling jsonb not null default '{}'::jsonb,
  unlock_rules jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.mana_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  regeneration jsonb not null,
  fatigue jsonb not null default '{}'::jsonb,
  cost_rules jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.combat_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  initiative jsonb not null,
  damage_formula jsonb not null,
  critical_rules jsonb not null default '{}'::jsonb,
  mitigation_rules jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.rarity_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  rarity_weights jsonb not null,
  upgrade_rules jsonb not null default '{}'::jsonb,
  display_rules jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.loot_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version >= 1),
  status text not null check (status in ('draft', 'active', 'archived')),
  drop_rates jsonb not null,
  pity_rules jsonb not null default '{}'::jsonb,
  reward_modifiers jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  action text not null,
  entity_table text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  redacted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles(user_id);
create index character_spells_spell_id_idx on public.character_spells(spell_id);
create index inventory_profile_id_idx on public.inventory(profile_id);
create index equipment_inventory_id_idx on public.equipment(inventory_id);
create index character_status_effects_profile_id_idx on public.character_status_effects(profile_id);
create index enemies_element_id_idx on public.enemies(element_id);
create index quest_steps_quest_id_idx on public.quest_steps(quest_id);
create index character_quests_profile_id_idx on public.character_quests(profile_id);
create index combat_sessions_profile_id_idx on public.combat_sessions(profile_id);
create index combat_participants_session_idx on public.combat_participants(combat_session_id);
create index combat_events_session_turn_idx on public.combat_events(combat_session_id, turn_number);
create unique index progression_rules_one_active_idx on public.progression_rules ((status)) where status = 'active';
create unique index mana_rules_one_active_idx on public.mana_rules ((status)) where status = 'active';
create unique index combat_rules_one_active_idx on public.combat_rules ((status)) where status = 'active';
create unique index rarity_rules_one_active_idx on public.rarity_rules ((status)) where status = 'active';
create unique index loot_rules_one_active_idx on public.loot_rules ((status)) where status = 'active';
create index progression_rules_status_idx on public.progression_rules(status);
create index mana_rules_status_idx on public.mana_rules(status);
create index combat_rules_status_idx on public.combat_rules(status);
create index rarity_rules_status_idx on public.rarity_rules(status);
create index loot_rules_status_idx on public.loot_rules(status);
create index admin_audit_logs_entity_idx on public.admin_audit_logs(entity_table, entity_id);
create index admin_audit_logs_actor_idx on public.admin_audit_logs(actor_user_id, created_at desc);

create or replace function public.audit_admin_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  before_payload jsonb;
  after_payload jsonb;
  target_id text;
begin
  if not public.is_admin() then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  before_payload := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  after_payload := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  target_id := coalesce(
    after_payload ->> 'id',
    before_payload ->> 'id',
    after_payload ->> 'class_id',
    before_payload ->> 'class_id',
    after_payload ->> 'enemy_id',
    before_payload ->> 'enemy_id',
    after_payload ->> 'quest_id',
    before_payload ->> 'quest_id'
  );

  insert into public.admin_audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    redacted,
    metadata
  )
  values (
    auth.uid(),
    public.current_app_role(),
    lower(TG_OP),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    target_id,
    before_payload,
    after_payload,
    false,
    jsonb_build_object('source', 'audit_admin_row_change')
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.log_admin_permission_action(
  target_user_id uuid,
  action text,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only platform admins can log permission actions';
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    redacted,
    metadata
  )
  values (
    auth.uid(),
    public.current_app_role(),
    action,
    'auth.users',
    target_user_id::text,
    null,
    null,
    true, -- redacted = true
    coalesce(metadata, '{}'::jsonb) || jsonb_build_object('source', 'log_admin_permission_action')
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

create or replace function public.log_admin_support_action(
  target_profile_id uuid,
  action text,
  summary jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only platform admins can log support actions';
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data,
    redacted,
    metadata
  )
  values (
    auth.uid(),
    public.current_app_role(),
    action,
    'public.profiles',
    target_profile_id::text,
    null,
    null,
    true, -- redacted = true
    jsonb_build_object(
      'source', 'log_admin_support_action',
      'summary', coalesce(summary, '{}'::jsonb)
    )
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

create trigger rpg_classes_set_updated_at before update on public.rpg_classes for each row execute function public.set_updated_at();
create trigger rpg_races_set_updated_at before update on public.rpg_races for each row execute function public.set_updated_at();
create trigger elements_set_updated_at before update on public.elements for each row execute function public.set_updated_at();
create trigger status_effects_set_updated_at before update on public.status_effects for each row execute function public.set_updated_at();
create trigger spells_set_updated_at before update on public.spells for each row execute function public.set_updated_at();
create trigger items_set_updated_at before update on public.items for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at before update on public.inventory for each row execute function public.set_updated_at();
create trigger character_status_effects_set_updated_at before update on public.character_status_effects for each row execute function public.set_updated_at();
create trigger enemies_set_updated_at before update on public.enemies for each row execute function public.set_updated_at();
create trigger quests_set_updated_at before update on public.quests for each row execute function public.set_updated_at();
create trigger combat_sessions_set_updated_at before update on public.combat_sessions for each row execute function public.set_updated_at();
create trigger progression_rules_set_updated_at before update on public.progression_rules for each row execute function public.set_updated_at();
create trigger mana_rules_set_updated_at before update on public.mana_rules for each row execute function public.set_updated_at();
create trigger combat_rules_set_updated_at before update on public.combat_rules for each row execute function public.set_updated_at();
create trigger rarity_rules_set_updated_at before update on public.rarity_rules for each row execute function public.set_updated_at();
create trigger loot_rules_set_updated_at before update on public.loot_rules for each row execute function public.set_updated_at();

create trigger rpg_classes_admin_audit after insert or update or delete on public.rpg_classes for each row execute function public.audit_admin_row_change();
create trigger rpg_races_admin_audit after insert or update or delete on public.rpg_races for each row execute function public.audit_admin_row_change();
create trigger elements_admin_audit after insert or update or delete on public.elements for each row execute function public.audit_admin_row_change();
create trigger status_effects_admin_audit after insert or update or delete on public.status_effects for each row execute function public.audit_admin_row_change();
create trigger spells_admin_audit after insert or update or delete on public.spells for each row execute function public.audit_admin_row_change();
create trigger class_spells_admin_audit after insert or update or delete on public.class_spells for each row execute function public.audit_admin_row_change();
create trigger items_admin_audit after insert or update or delete on public.items for each row execute function public.audit_admin_row_change();
create trigger enemies_admin_audit after insert or update or delete on public.enemies for each row execute function public.audit_admin_row_change();
create trigger enemy_spells_admin_audit after insert or update or delete on public.enemy_spells for each row execute function public.audit_admin_row_change();
create trigger quests_admin_audit after insert or update or delete on public.quests for each row execute function public.audit_admin_row_change();
create trigger quest_steps_admin_audit after insert or update or delete on public.quest_steps for each row execute function public.audit_admin_row_change();
create trigger progression_rules_admin_audit after insert or update or delete on public.progression_rules for each row execute function public.audit_admin_row_change();
create trigger mana_rules_admin_audit after insert or update or delete on public.mana_rules for each row execute function public.audit_admin_row_change();
create trigger combat_rules_admin_audit after insert or update or delete on public.combat_rules for each row execute function public.audit_admin_row_change();
create trigger rarity_rules_admin_audit after insert or update or delete on public.rarity_rules for each row execute function public.audit_admin_row_change();
create trigger loot_rules_admin_audit after insert or update or delete on public.loot_rules for each row execute function public.audit_admin_row_change();

create view public.active_progression_rules
with (security_invoker = true)
as select * from public.progression_rules where status = 'active';

create view public.active_mana_rules
with (security_invoker = true)
as select * from public.mana_rules where status = 'active';

create view public.active_combat_rules
with (security_invoker = true)
as select * from public.combat_rules where status = 'active';

create view public.active_rarity_rules
with (security_invoker = true)
as select * from public.rarity_rules where status = 'active';

create view public.active_loot_rules
with (security_invoker = true)
as select * from public.loot_rules where status = 'active';

alter table public.rpg_classes enable row level security;
alter table public.rpg_races enable row level security;
alter table public.elements enable row level security;
alter table public.status_effects enable row level security;
alter table public.spells enable row level security;
alter table public.class_spells enable row level security;
alter table public.items enable row level security;
alter table public.enemies enable row level security;
alter table public.enemy_spells enable row level security;
alter table public.quests enable row level security;
alter table public.quest_steps enable row level security;
alter table public.profiles enable row level security;
alter table public.character_spells enable row level security;
alter table public.inventory enable row level security;
alter table public.equipment enable row level security;
alter table public.character_status_effects enable row level security;
alter table public.character_quests enable row level security;
alter table public.combat_sessions enable row level security;
alter table public.combat_participants enable row level security;
alter table public.combat_events enable row level security;
alter table public.progression_rules enable row level security;
alter table public.mana_rules enable row level security;
alter table public.combat_rules enable row level security;
alter table public.rarity_rules enable row level security;
alter table public.loot_rules enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "catalogs are readable by everyone" on public.rpg_classes for select using (true);
create policy "catalogs are readable by everyone" on public.rpg_races for select using (true);
create policy "catalogs are readable by everyone" on public.elements for select using (true);
create policy "catalogs are readable by everyone" on public.status_effects for select using (true);
create policy "catalogs are readable by everyone" on public.spells for select using (true);
create policy "catalogs are readable by everyone" on public.class_spells for select using (true);
create policy "catalogs are readable by everyone" on public.items for select using (true);
create policy "catalogs are readable by everyone" on public.enemies for select using (true);
create policy "catalogs are readable by everyone" on public.enemy_spells for select using (true);
create policy "catalogs are readable by everyone" on public.quests for select using (true);
create policy "catalogs are readable by everyone" on public.quest_steps for select using (true);

create policy "admins can insert rpg classes" on public.rpg_classes for insert with check (public.is_admin());
create policy "admins can update rpg classes" on public.rpg_classes for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete rpg classes" on public.rpg_classes for delete using (public.is_admin());

create policy "admins can insert rpg races" on public.rpg_races for insert with check (public.is_admin());
create policy "admins can update rpg races" on public.rpg_races for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete rpg races" on public.rpg_races for delete using (public.is_admin());

create policy "admins can insert elements" on public.elements for insert with check (public.is_admin());
create policy "admins can update elements" on public.elements for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete elements" on public.elements for delete using (public.is_admin());

create policy "admins can insert status effects" on public.status_effects for insert with check (public.is_admin());
create policy "admins can update status effects" on public.status_effects for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete status effects" on public.status_effects for delete using (public.is_admin());

create policy "admins can insert spells" on public.spells for insert with check (public.is_admin());
create policy "admins can update spells" on public.spells for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete spells" on public.spells for delete using (public.is_admin());

create policy "admins can insert class spells" on public.class_spells for insert with check (public.is_admin());
create policy "admins can update class spells" on public.class_spells for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete class spells" on public.class_spells for delete using (public.is_admin());

create policy "admins can insert items" on public.items for insert with check (public.is_admin());
create policy "admins can update items" on public.items for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete items" on public.items for delete using (public.is_admin());

create policy "admins can insert enemies" on public.enemies for insert with check (public.is_admin());
create policy "admins can update enemies" on public.enemies for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete enemies" on public.enemies for delete using (public.is_admin());

create policy "admins can insert enemy spells" on public.enemy_spells for insert with check (public.is_admin());
create policy "admins can update enemy spells" on public.enemy_spells for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete enemy spells" on public.enemy_spells for delete using (public.is_admin());

create policy "admins can insert quests" on public.quests for insert with check (public.is_admin());
create policy "admins can update quests" on public.quests for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete quests" on public.quests for delete using (public.is_admin());

create policy "admins can insert quest steps" on public.quest_steps for insert with check (public.is_admin());
create policy "admins can update quest steps" on public.quest_steps for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete quest steps" on public.quest_steps for delete using (public.is_admin());

create policy "active progression rules are readable by everyone" on public.progression_rules for select using (status = 'active');
create policy "admins can manage progression rules" on public.progression_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "active mana rules are readable by everyone" on public.mana_rules for select using (status = 'active');
create policy "admins can manage mana rules" on public.mana_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "active combat rules are readable by everyone" on public.combat_rules for select using (status = 'active');
create policy "admins can manage combat rules" on public.combat_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "active rarity rules are readable by everyone" on public.rarity_rules for select using (status = 'active');
create policy "admins can manage rarity rules" on public.rarity_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "active loot rules are readable by everyone" on public.loot_rules for select using (status = 'active');
create policy "admins can manage loot rules" on public.loot_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "admins can read admin audit logs" on public.admin_audit_logs for select using (public.is_admin());

create policy "users can read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "users can update own profile" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins can read all profiles" on public.profiles for select using (public.is_admin());
create policy "admins can insert all profiles" on public.profiles for insert with check (public.is_admin());
create policy "admins can update all profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete all profiles" on public.profiles for delete using (public.is_admin());

create policy "users can read own character spells" on public.character_spells for select using (
  exists (select 1 from public.profiles where profiles.id = character_spells.profile_id and profiles.user_id = auth.uid())
);
create policy "users can manage own character spells" on public.character_spells for all using (
  exists (select 1 from public.profiles where profiles.id = character_spells.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = character_spells.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all character spells" on public.character_spells for select using (public.is_admin());
create policy "admins can manage all character spells" on public.character_spells for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own inventory" on public.inventory for all using (
  exists (select 1 from public.profiles where profiles.id = inventory.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = inventory.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all inventory" on public.inventory for select using (public.is_admin());
create policy "admins can manage all inventory" on public.inventory for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own equipment" on public.equipment for all using (
  exists (select 1 from public.profiles where profiles.id = equipment.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = equipment.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all equipment" on public.equipment for select using (public.is_admin());
create policy "admins can manage all equipment" on public.equipment for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own status effects" on public.character_status_effects for all using (
  exists (select 1 from public.profiles where profiles.id = character_status_effects.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = character_status_effects.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all character status effects" on public.character_status_effects for select using (public.is_admin());
create policy "admins can manage all character status effects" on public.character_status_effects for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own quests" on public.character_quests for all using (
  exists (select 1 from public.profiles where profiles.id = character_quests.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = character_quests.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all character quests" on public.character_quests for select using (public.is_admin());
create policy "admins can manage all character quests" on public.character_quests for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own combat sessions" on public.combat_sessions for all using (
  exists (select 1 from public.profiles where profiles.id = combat_sessions.profile_id and profiles.user_id = auth.uid())
) with check (
  exists (select 1 from public.profiles where profiles.id = combat_sessions.profile_id and profiles.user_id = auth.uid())
);
create policy "admins can read all combat sessions" on public.combat_sessions for select using (public.is_admin());
create policy "admins can manage all combat sessions" on public.combat_sessions for all using (public.is_admin()) with check (public.is_admin());

create policy "users can read own combat participants" on public.combat_participants for select using (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_participants.combat_session_id
      and profiles.user_id = auth.uid()
  )
);

create policy "users can manage own combat participants" on public.combat_participants for all using (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_participants.combat_session_id
      and profiles.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_participants.combat_session_id
      and profiles.user_id = auth.uid()
  )
);
create policy "admins can read all combat participants" on public.combat_participants for select using (public.is_admin());
create policy "admins can manage all combat participants" on public.combat_participants for all using (public.is_admin()) with check (public.is_admin());

create policy "users can read own combat events" on public.combat_events for select using (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_events.combat_session_id
      and profiles.user_id = auth.uid()
  )
);
create policy "admins can read all combat events" on public.combat_events for select using (public.is_admin());
create policy "admins can manage all combat events" on public.combat_events for all using (public.is_admin()) with check (public.is_admin());

create policy "users can manage own combat events" on public.combat_events for all using (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_events.combat_session_id
      and profiles.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.combat_sessions
    join public.profiles on profiles.id = combat_sessions.profile_id
    where combat_sessions.id = combat_events.combat_session_id
      and profiles.user_id = auth.uid()
  )
);
