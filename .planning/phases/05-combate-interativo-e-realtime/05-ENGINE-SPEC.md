# Phase 5: Especificação do motor de combate

Contrato técnico do motor em `src/engine/combat/`. Os planos `05-01` a `05-05` implementam esta especificação; qualquer mudança de regra entra aqui primeiro.

## Princípios

- Funções puras: `(state, input) -> { state, events }`. Sem DOM, Supabase, `Math.random`, `Date.now`, `console`.
- Estado serializável em JSON (cabe em `snapshot`/`current_stats`/`status_effects`).
- Sorteios só por `createRng(seed, cursor)`; o cursor sobe a cada sorteio e é persistido.
- Só exports nomeados, arquivos em camelCase, 2 espaços, aspas simples (padrão do repositório).

## Módulos

| Arquivo | Responsabilidade |
| --- | --- |
| `rng.js` | `createRng(seed, cursor)` (mulberry32 sobre hash da semente), `next()`, `chance(p)`, `pickWeighted(items)`, `cursor`. |
| `rules.js` | Normaliza regras do banco em `CombatRules`; defaults do motor; `parseFormula`/`evaluateFormula`. |
| `state.js` | `createCombat(input)`, `isFinished(state)`, `getActiveParticipant(state)`. |
| `damage.js` | Dano base, multiplicador elemental, crítico, mitigação, escudo. |
| `actions.js` | `listActions(state, actorId)`, `applyAction(state, action)`. |
| `effects.js` | Registro de handlers de `spells.effects` e `status_effects.rules`. |
| `turns.js` | Ordem de iniciativa, avanço de turno e rodada, regeneração, expiração. |
| `ai.js` | `chooseEnemyAction(state, actorId, rng)`. |
| `index.js` | Reexporta a API pública. |

## Estado

```text
CombatState {
  version: 1,
  seed: string,
  rngCursor: number,
  round: number,                 // combat_sessions.turn_number (1 na primeira rodada)
  order: string[],               // ids de participantes por iniciativa
  activeIndex: number,           // posição em `order`
  status: 'active'|'victory'|'defeat'|'escaped',
  rules: CombatRules,            // congeladas no início (D-03)
  catalog: { elements, statusEffects, spells, items },  // só o que a luta usa
  participants: Participant[],
  cooldowns: { [participantId]: { [spellId]: number } },
  log: []                        // não persistido aqui; eventos vão a combat_events
}

Participant {
  id, team: 'player'|'enemy'|'neutral', name,
  refType: 'profile'|'enemy', refId,
  elementId: string|null,          // personagem: profiles.element_id (D-11); null = neutral
  stats: { hp, maxHp, mana, maxMana, strength, defense, intelligence, speed },
  statuses: [{ id, stacks, remainingTurns, sourceId }],
  shield: number,
  spells: [{ spellId, weight? }],     // jogador: equipadas/desbloqueadas; inimigo: enemy_spells
  items: [{ itemId, quantity }],      // só jogador
  behavior: { strategy: 'passive'|'aggressive', preferredElement? },
  flags: { fatiguedTurns: number }
}
```

Mapeamento de persistência: `Participant.stats/statuses/shield` -> `combat_participants.current_stats` e `status_effects`; `cooldowns`, `order`, `activeIndex`, `rngCursor`, `rules`, `catalog` -> `combat_sessions.snapshot`; `round` -> `turn_number`.

## API pública

```text
createCombat({ seed, rules, catalog, participants }) -> CombatState
listActions(state, actorId) -> Action[]           // com `disabledReason` quando indisponível
applyAction(state, action) -> { state, events }   // valida; ação inválida lança CombatError (code)
runUntilPlayerTurn(state) -> { state, events }     // executa turnos de inimigos/efeitos até o jogador agir ou o fim
isFinished(state) -> boolean

Action = { type: 'basic_attack'|'spell'|'item'|'flee'|'pass', actorId, targetId?, spellId?, itemId? }
Event  = { type, round, actorId?, targetId?, payload }   // type ∈ combat_events.event_type
```

Códigos de `CombatError`: `not_active_turn`, `unknown_action`, `invalid_target`, `not_enough_mana`, `on_cooldown`, `spell_unavailable`, `item_unavailable`, `combat_finished`.

## Regras e fórmulas

Valores entre parênteses são os do seed atual.

**Iniciativa.** Ordena por `speed` efetiva (atributo + `speed_delta` de status/fadiga), decrescente. Empate: `tie_breaker = player_first`; persistindo, ordem de `participants`. Recalculada no início de cada rodada.

**Dano base.**

- Física quando `spell.effects.scales_with === 'strength'` ou ataque básico; mágica nos demais casos (não existe coluna dedicada).
- Física: `strength + power - defense`; mágica: `intelligence + power - resistance` (`resistance = 0`, decisão aberta H). Ataque básico usa `power = 0`.
- `defense` efetiva = `defense * mitigation.defense_multiplier (1.0) * modificadores de status (guard_break 0.75) + defense_bonus ativo`.
- Piso: `minimum_damage (1)`.

**Elemental.** Atacante = elemento da magia (ataque básico: elemento do atacante). Defensor = `participant.elementId`.
`elements[atacante].strong_against` contém defensor -> x`elemental_advantage_multiplier (1.5)`; `weak_against` contém defensor -> x`elemental_disadvantage_multiplier (0.75)`; senão x1. `neutral` não tem relações.

**Crítico.** Chance = `base_chance (0.05) + speed_bonus_step (0.01) * max(0, speedAtacante - speedDefensor)`, limitada a 0.5. Sucesso -> x`damage_multiplier (1.5)`. Sorteio só quando houver dano.

**Ordem de cálculo.** base -> status do defensor (ex.: `soak` x1.25 contra `storm`) -> elemental -> crítico -> arredondar para baixo -> piso -> escudo absorve primeiro -> HP.

**Mana.** Custo fixo `spells.mana_cost`. Sem mana suficiente: `not_enough_mana` (mantendo `minimum_remaining_mana (0)`). Regeneração `combat_per_turn (5)` no fim do turno do próprio participante, limitada a `maxMana`. Custo percentual: fora do MVP (chave desconhecida, ignorada com aviso).

**Fadiga.** Se `mana_cost >= fatigue.legendary_cost_threshold (70)`: conjurador recebe `speed_delta (-2)` por `physical_penalty_turns (1)`.

**Recarga.** Ao conjurar, `cooldowns[ator][magia] = cooldown_turns`; decrementa em 1 no início do turno do próprio ator; `> 0` bloqueia (`on_cooldown`). Recarga 0 = sem bloqueio.

**Alvos.** `self`, `ally`, `enemy`, `all_allies`, `all_enemies`. Alvo precisa estar vivo e do time compatível. Magia com `power = 0` e efeitos de suporte exige `target_type` coerente (corrigir `water-veil` e `stone-guard` para `self` no seed, 05-02).

**Fim.** Todos os inimigos com HP 0 -> `victory`; jogador com HP 0 -> `defeat`; `flee` bem-sucedido -> `escaped`. Fuga: chance `clamp(0.5 + 0.05 * (velJogador - velMédiaInimigos), 0.1, 0.9)`; falha consome o turno.

## Vocabulário de efeitos

**`spells.effects`** (chaves do seed)

| Chave | Comportamento no motor |
| --- | --- |
| `status_chance` | Chance de aplicar o status da magia (`status_effect_id`) ou, se ausente, `elements.status_effect`. Sem a chave: 0. |
| `scales_with` | `strength` => dano físico (ver acima). |
| `area` | `small`: além do alvo principal, acerta mais 1 inimigo vivo com 50% do dano. |
| `shield` | Escudo no alvo (absorve dano antes do HP; some ao fim da luta; não acumula acima do maior valor). |
| `cleanse` | Lista de ids de status removidos do alvo. |
| `mana_drain` | Alvo perde até N mana; conjurador ganha o mesmo valor, limitado ao máximo. |
| `defense_bonus` + `duration_turns` | Bônus de defesa no alvo por N turnos. |
| `slow` + `duration_turns` | Aplica o status `slow` por `duration_turns`. |

**`status_effects.rules`**

| Chave | Comportamento |
| --- | --- |
| `damage_per_turn` | Dano no início do turno do afetado, x`stacks`. `scales_with: power` fica para depois (decisão aberta de balanceamento; registrada como aviso). |
| `storm_damage_multiplier` | Multiplica dano recebido de elemento `storm`. |
| `skip_action_chance` | No início do turno, chance de perder a ação. |
| `defense_multiplier` | Multiplica a defesa efetiva. |
| `speed_delta` | Soma à velocidade efetiva (afeta a iniciativa da próxima rodada). |

Empilhamento: `stackable = true` soma `stacks` (máximo 3) e renova a duração; `false` só renova a duração. Duração padrão: `default_duration_turns`. Expira no fim do turno do afetado quando `remainingTurns` chega a 0.

**Consumíveis** (`items.effects`): `restore_hp`, `restore_mana`. Consome 1 unidade; respeita máximos; gera `item_used` + `heal`.

## IA inimiga (CMBT-03)

- `passive`: passa o turno (`system`, `payload.kind = 'pass'`).
- `aggressive`: alvo = jogador vivo com menor HP. Escolhe entre magias conhecidas que cabem na mana e não estão em recarga; pontua por `weight`, +50% se vantagem elemental sobre o alvo, +25% se elemento igual a `behavior.preferred_element`; sorteia ponderado pelo PRNG. Sem opção, usa ataque básico.
- Estratégias desconhecidas viram `aggressive` com aviso.

## Eventos

| Tipo do motor | `combat_events.event_type` | `payload` |
| --- | --- | --- |
| início de rodada/turno | `turn_start` | `{ round, activeId }` |
| ataque básico | `basic_attack` | `{ damage, crit }` |
| magia | `spell_cast` | `{ spellId, manaCost, cooldown }` |
| item | `item_used` | `{ itemId }` |
| dano | `damage` | `{ amount, absorbed, crit, elemental: 'advantage'\|'disadvantage'\|null, source }` |
| cura/mana | `heal` | `{ hp?, mana? }` |
| status | `status_applied` | `{ statusId, stacks, remainingTurns }` |
| morte | `defeat` | `{ participantId }` |
| fim do turno | `turn_end` | `{ manaRegen }` |
| demais | `system` | `{ kind: 'status_expired'\|'status_skipped'\|'cleanse'\|'flee'\|'pass'\|'victory'\|'warning', ... }` |

## Backlog explícito (fora da Fase 5)

Esquiva (sem regra de dados), custo percentual de mana, `scales_with: power` em DoT, IA avançada (CMBT-04), PvP e co-op.
