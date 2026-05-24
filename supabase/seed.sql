begin;

-- Onikara local role contract -------------------------------------------------
-- Supabase Auth JWTs are expected to expose the custom claim `app_role`.
-- Phase 1 active roles: `player` and `admin`.
-- Recognized future role: `master` (campaign/narrative), with no special
-- authorization policies in Phase 1.
-- Local admin promotion is intentionally outside the browser/client: use
-- seed, migration, or maintenance scripts to assign `app_role = 'admin'`.
-- The frontend must never use service_role secrets or client-only role checks
-- to grant platform authority.

insert into public.rpg_classes (id, name, role, base_stats, scaling)
values
  (
    'warrior',
    'Guerreiro',
    'frontline',
    '{"hp": 120, "mana": 35, "strength": 16, "defense": 14, "intelligence": 6, "speed": 8}'::jsonb,
    '{"hp": 14, "mana": 3, "strength": 3, "defense": 2, "intelligence": 1, "speed": 1}'::jsonb
  ),
  (
    'mage',
    'Mago',
    'caster',
    '{"hp": 80, "mana": 100, "strength": 6, "defense": 7, "intelligence": 18, "speed": 10}'::jsonb,
    '{"hp": 8, "mana": 12, "strength": 1, "defense": 1, "intelligence": 4, "speed": 1}'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  base_stats = excluded.base_stats,
  scaling = excluded.scaling;

insert into public.rpg_races (id, name, ancestry, modifiers, description)
values
  (
    'human',
    'Humano',
    'human',
    '{"hp": 0, "mana": 0, "strength": 0, "defense": 0, "intelligence": 0, "speed": 0}'::jsonb,
    'Versatil e equilibrado, sem fraquezas marcantes.'
  ),
  (
    'weak_oni',
    'Oni Fraco',
    'oni',
    '{"hp": 10, "mana": -5, "strength": 2, "defense": 1, "intelligence": -1, "speed": 0}'::jsonb,
    'Descendente Oni com vigor fisico acima da media.'
  ),
  (
    'medium_oni',
    'Oni Medio',
    'oni',
    '{"hp": 20, "mana": -10, "strength": 4, "defense": 2, "intelligence": -2, "speed": -1}'::jsonb,
    'Linhagem Oni mais intensa, forte em troca de menor afinidade arcana.'
  ),
  (
    'strong_oni',
    'Oni Forte',
    'oni',
    '{"hp": 35, "mana": -15, "strength": 6, "defense": 3, "intelligence": -3, "speed": -2}'::jsonb,
    'Heranca Oni dominante, feita para combate direto.'
  )
on conflict (id) do update set
  name = excluded.name,
  ancestry = excluded.ancestry,
  modifiers = excluded.modifiers,
  description = excluded.description;

insert into public.elements (id, name, strong_against, weak_against, status_effect)
values
  ('fire', 'Fogo', array['nature'], array['water'], 'burn'),
  ('water', 'Agua', array['fire'], array['storm'], 'soak'),
  ('storm', 'Tempestade', array['water'], array['earth'], 'shock'),
  ('earth', 'Terra', array['storm'], array['nature'], 'guard_break'),
  ('nature', 'Natureza', array['earth'], array['fire'], 'poison'),
  ('neutral', 'Neutro', array[]::text[], array[]::text[], null)
on conflict (id) do update set
  name = excluded.name,
  strong_against = excluded.strong_against,
  weak_against = excluded.weak_against,
  status_effect = excluded.status_effect;

insert into public.status_effects (id, name, effect_type, default_duration_turns, stackable, rules, description)
values
  ('burn', 'Queimadura', 'damage_over_time', 3, true, '{"damage_per_turn": 6, "scales_with": "power"}'::jsonb, 'Causa dano no inicio do turno.'),
  ('soak', 'Encharcado', 'debuff', 2, false, '{"storm_damage_multiplier": 1.25}'::jsonb, 'Aumenta vulnerabilidade a Tempestade.'),
  ('shock', 'Choque', 'control', 1, false, '{"skip_action_chance": 0.25}'::jsonb, 'Pode interromper a proxima acao.'),
  ('guard_break', 'Guarda Quebrada', 'debuff', 2, false, '{"defense_multiplier": 0.75}'::jsonb, 'Reduz defesa temporariamente.'),
  ('poison', 'Veneno', 'damage_over_time', 4, true, '{"damage_per_turn": 4}'::jsonb, 'Dano gradual e persistente.'),
  ('slow', 'Lentidao', 'debuff', 2, false, '{"speed_delta": -2}'::jsonb, 'Reduz velocidade e prioridade de turno.')
on conflict (id) do update set
  name = excluded.name,
  effect_type = excluded.effect_type,
  default_duration_turns = excluded.default_duration_turns,
  stackable = excluded.stackable,
  rules = excluded.rules,
  description = excluded.description;

insert into public.spells (id, name, element_id, rarity, mana_cost, cooldown_turns, power, effects)
values
  ('ember-strike', 'Golpe de Brasa', 'fire', 'common', 12, 1, 24, '{"status_chance": 0.2}'::jsonb),
  ('fireball', 'Bola de Fogo', 'fire', 'uncommon', 24, 2, 42, '{"area": "small", "status_chance": 0.35}'::jsonb),
  ('water-veil', 'Veu de Agua', 'water', 'common', 14, 2, 0, '{"shield": 18, "cleanse": ["burn"]}'::jsonb),
  ('tidal-cut', 'Corte da Mare', 'water', 'uncommon', 20, 2, 34, '{"mana_drain": 4}'::jsonb),
  ('spark', 'Centelha', 'storm', 'common', 10, 1, 22, '{"status_chance": 0.18}'::jsonb),
  ('stone-guard', 'Guarda de Pedra', 'earth', 'common', 16, 3, 0, '{"defense_bonus": 6, "duration_turns": 2}'::jsonb),
  ('vine-snare', 'Laco de Vinhas', 'nature', 'common', 18, 2, 18, '{"slow": 2, "duration_turns": 1}'::jsonb),
  ('focused-slash', 'Corte Focado', 'neutral', 'common', 6, 0, 20, '{"scales_with": "strength"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  element_id = excluded.element_id,
  rarity = excluded.rarity,
  mana_cost = excluded.mana_cost,
  cooldown_turns = excluded.cooldown_turns,
  power = excluded.power,
  effects = excluded.effects;

insert into public.class_spells (class_id, spell_id, unlock_level)
values
  ('warrior', 'focused-slash', 1),
  ('warrior', 'stone-guard', 2),
  ('warrior', 'ember-strike', 3),
  ('mage', 'spark', 1),
  ('mage', 'water-veil', 1),
  ('mage', 'fireball', 2),
  ('mage', 'tidal-cut', 3),
  ('mage', 'vine-snare', 3)
on conflict (class_id, spell_id) do update set
  unlock_level = excluded.unlock_level;

insert into public.items (id, name, item_type, rarity, stackable, max_stack, stats, effects, description)
values
  ('training-sword', 'Espada de Treino', 'weapon', 'common', false, 1, '{"strength": 2}'::jsonb, '{}'::jsonb, 'Arma simples para iniciar combates.'),
  ('apprentice-staff', 'Cajado de Aprendiz', 'weapon', 'common', false, 1, '{"intelligence": 2, "mana": 10}'::jsonb, '{}'::jsonb, 'Canalizador arcano basico.'),
  ('patched-armor', 'Armadura Remendada', 'armor', 'common', false, 1, '{"defense": 2, "hp": 10}'::jsonb, '{}'::jsonb, 'Protecao leve de inicio.'),
  ('mana-tonic', 'Tonico de Mana', 'consumable', 'common', true, 10, '{}'::jsonb, '{"restore_mana": 25}'::jsonb, 'Restaura uma pequena quantidade de mana.'),
  ('health-salve', 'Unguento Vital', 'consumable', 'common', true, 10, '{}'::jsonb, '{"restore_hp": 35}'::jsonb, 'Restaura pontos de vida.'),
  ('oni-ash', 'Cinza Oni', 'material', 'uncommon', true, 99, '{}'::jsonb, '{}'::jsonb, 'Material usado em aprimoramentos ligados a linhagens Oni.')
on conflict (id) do update set
  name = excluded.name,
  item_type = excluded.item_type,
  rarity = excluded.rarity,
  stackable = excluded.stackable,
  max_stack = excluded.max_stack,
  stats = excluded.stats,
  effects = excluded.effects,
  description = excluded.description;

insert into public.enemies (id, name, enemy_type, level, element_id, base_stats, behavior, loot_table, xp_reward, description)
values
  (
    'training-dummy',
    'Boneco de Treino',
    'construct',
    1,
    'neutral',
    '{"hp": 60, "mana": 0, "strength": 4, "defense": 4, "intelligence": 1, "speed": 1}'::jsonb,
    '{"strategy": "passive"}'::jsonb,
    '[]'::jsonb,
    10,
    'Alvo estavel para validar o loop de combate.'
  ),
  (
    'ash-imp',
    'Imp de Cinzas',
    'monster',
    2,
    'fire',
    '{"hp": 75, "mana": 30, "strength": 8, "defense": 5, "intelligence": 7, "speed": 11}'::jsonb,
    '{"strategy": "aggressive", "preferred_element": "fire"}'::jsonb,
    '[{"item_id": "oni-ash", "chance": 0.35, "quantity": 1}]'::jsonb,
    35,
    'Criatura rapida que testa fraquezas elementais.'
  )
on conflict (id) do update set
  name = excluded.name,
  enemy_type = excluded.enemy_type,
  level = excluded.level,
  element_id = excluded.element_id,
  base_stats = excluded.base_stats,
  behavior = excluded.behavior,
  loot_table = excluded.loot_table,
  xp_reward = excluded.xp_reward,
  description = excluded.description;

insert into public.enemy_spells (enemy_id, spell_id, weight)
values
  ('ash-imp', 'ember-strike', 3),
  ('ash-imp', 'focused-slash', 1)
on conflict (enemy_id, spell_id) do update set
  weight = excluded.weight;

insert into public.quests (id, title, description, min_level, rewards, repeatable)
values
  (
    'first-sparks',
    'Primeiras Faiscas',
    'Complete um combate de treino e valide seu primeiro fluxo de progressao.',
    1,
    '{"xp": 50, "items": [{"item_id": "health-salve", "quantity": 2}, {"item_id": "mana-tonic", "quantity": 1}]}'::jsonb,
    false
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  min_level = excluded.min_level,
  rewards = excluded.rewards,
  repeatable = excluded.repeatable;

insert into public.quest_steps (id, quest_id, step_order, objective_type, target_ref, target_count, metadata)
values
  ('first-sparks-01', 'first-sparks', 1, 'defeat_enemy', 'training-dummy', 1, '{}'::jsonb),
  ('first-sparks-02', 'first-sparks', 2, 'custom', 'open-rewards', 1, '{"label": "Receber recompensa inicial"}'::jsonb)
on conflict (id) do update set
  quest_id = excluded.quest_id,
  step_order = excluded.step_order,
  objective_type = excluded.objective_type,
  target_ref = excluded.target_ref,
  target_count = excluded.target_count,
  metadata = excluded.metadata;

insert into public.progression_rules (name, version, status, xp_curve, level_stat_scaling, unlock_rules, notes)
values (
  'mvp-default-progression',
  1,
  'active',
  '{"formula": "base_xp * level_multiplier", "base_xp": 100, "level_multiplier": 1.35, "max_level": 20}'::jsonb,
  '{"warrior": {"hp": 14, "mana": 3, "strength": 3, "defense": 2, "intelligence": 1, "speed": 1}, "mage": {"hp": 8, "mana": 12, "strength": 1, "defense": 1, "intelligence": 4, "speed": 1}}'::jsonb,
  '{"spell_unlock_source": "class_spells.unlock_level", "minimum_level": 1}'::jsonb,
  'Initial active progression rule for local MVP balancing.'
)
on conflict (name, version) do update set
  status = excluded.status,
  xp_curve = excluded.xp_curve,
  level_stat_scaling = excluded.level_stat_scaling,
  unlock_rules = excluded.unlock_rules,
  notes = excluded.notes;

insert into public.mana_rules (name, version, status, regeneration, fatigue, cost_rules, notes)
values (
  'mvp-default-mana',
  1,
  'active',
  '{"combat_per_turn": 5, "rest_per_minute": 25, "out_of_combat_multiplier": 5}'::jsonb,
  '{"legendary_cost_threshold": 70, "physical_penalty_turns": 1, "speed_delta": -2}'::jsonb,
  '{"fixed_costs": true, "percent_costs_allowed": true, "minimum_remaining_mana": 0}'::jsonb,
  'Initial active mana rule emphasizing tactical scarcity.'
)
on conflict (name, version) do update set
  status = excluded.status,
  regeneration = excluded.regeneration,
  fatigue = excluded.fatigue,
  cost_rules = excluded.cost_rules,
  notes = excluded.notes;

insert into public.combat_rules (name, version, status, initiative, damage_formula, critical_rules, mitigation_rules, notes)
values (
  'mvp-default-combat',
  1,
  'active',
  '{"order_by": "speed", "tie_breaker": "player_first", "turn_seeded": true}'::jsonb,
  '{"physical": "strength + power - defense", "magical": "intelligence + power - resistance", "minimum_damage": 1}'::jsonb,
  '{"base_chance": 0.05, "speed_bonus_step": 0.01, "damage_multiplier": 1.5}'::jsonb,
  '{"defense_multiplier": 1.0, "elemental_advantage_multiplier": 1.5, "elemental_disadvantage_multiplier": 0.75}'::jsonb,
  'Initial active combat rule for turn order and damage calculation.'
)
on conflict (name, version) do update set
  status = excluded.status,
  initiative = excluded.initiative,
  damage_formula = excluded.damage_formula,
  critical_rules = excluded.critical_rules,
  mitigation_rules = excluded.mitigation_rules,
  notes = excluded.notes;

insert into public.rarity_rules (name, version, status, rarity_weights, upgrade_rules, display_rules, notes)
values (
  'mvp-default-rarity',
  1,
  'active',
  '{"common": 0.7, "uncommon": 0.2, "rare": 0.08, "epic": 0.018, "legendary": 0.002}'::jsonb,
  '{"upgrade_enabled": false, "future_admin_controlled": true}'::jsonb,
  '{"common": {"tone": "plain"}, "rare": {"tone": "blue"}, "epic": {"tone": "violet"}, "legendary": {"tone": "gold"}}'::jsonb,
  'Initial active rarity weights for loot and admin balancing.'
)
on conflict (name, version) do update set
  status = excluded.status,
  rarity_weights = excluded.rarity_weights,
  upgrade_rules = excluded.upgrade_rules,
  display_rules = excluded.display_rules,
  notes = excluded.notes;

insert into public.loot_rules (name, version, status, drop_rates, pity_rules, reward_modifiers, notes)
values (
  'mvp-default-loot',
  1,
  'active',
  '{"training": {"common": 1.0}, "standard": {"common": 0.75, "uncommon": 0.2, "rare": 0.05}, "boss": {"common": 0.45, "uncommon": 0.35, "rare": 0.15, "epic": 0.05}}'::jsonb,
  '{"enabled": false, "future_rule": "campaign_or_event"}'::jsonb,
  '{"first_quest_bonus": {"health-salve": 2, "mana-tonic": 1}, "xp_multiplier": 1.0}'::jsonb,
  'Initial active loot rule aligned with first-sparks reward loop.'
)
on conflict (name, version) do update set
  status = excluded.status,
  drop_rates = excluded.drop_rates,
  pity_rules = excluded.pity_rules,
  reward_modifiers = excluded.reward_modifiers,
  notes = excluded.notes;

commit;
