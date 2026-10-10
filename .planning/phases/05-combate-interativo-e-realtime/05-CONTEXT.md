# Phase 5: Combate Interativo e Realtime - Context

**Gathered:** 2026-10-10
**Status:** Planejada, aguardando validação das decisões em aberto (seção "Decisões em aberto")

<domain>
## Phase Boundary

Entregar o primeiro combate tático por turnos jogável em `/play`: motor de regras puro e testável, HUD de combate, inimigos com IA simples, persistência em `combat_sessions`/`combat_participants`/`combat_events`, recompensas (XP, loot, missões) e, só se fizer sentido, Realtime.

A fase entrega valor em etapas pequenas, cada uma jogável ou verificável por conta própria (ver plano `05-01` a `05-06`).

Ficam fora da fase: PvP, IA avançada que analisa vantagens elementais (CMBT-04), crafting/upgrade de raridade, área completa de criação de conteúdo pelo mestre, métricas e telas de suporte (Phase 6) e arte/animação final de combate.

Dentro da fase, desde 2026-10-10: campanha mínima, mestre conduzindo a sessão e vários jogadores no mesmo combate (D-14, D-15, plano 05-05).
</domain>

<current_state>
## O que já existe (verificado no repositório em 2026-10-10)

**Schema (`supabase/migrations/20260524031051_initial_rpg_schema.sql`)**

- `combat_sessions` (`profile_id`, `encounter_type` pve/pvp/quest/training, `status` active/victory/defeat/escaped/abandoned, `turn_number`, `seed`, `snapshot jsonb`, `started_at`, `ended_at`).
- `combat_participants` (`participant_type` profile/enemy/npc, `profile_id`/`enemy_id`, `team`, `turn_order`, `current_stats jsonb`, `status_effects jsonb`).
- `combat_events` (`event_type` entre `turn_start`, `spell_cast`, `basic_attack`, `item_used`, `status_applied`, `damage`, `heal`, `defeat`, `turn_end`, `system`; `payload jsonb`; sem coluna de ordem, só `created_at`).
- Regras versionadas, lidas pelas views `active_*_rules`: `combat_rules` (iniciativa, `damage_formula` em texto, crítico, mitigação), `mana_rules` (regeneração, fadiga, custos), `progression_rules`, `loot_rules`, `rarity_rules`.
- Catálogos: `elements` (`strong_against`, `weak_against`, `status_effect`), `status_effects` (`rules` jsonb), `spells` (`mana_cost`, `cooldown_turns`, `power`, `target_type`, `effects` jsonb), `class_spells`, `enemies` (`base_stats`, `behavior`, `loot_table`, `xp_reward`), `enemy_spells` (`weight`), `quests`/`quest_steps`/`character_quests`.

**Seed**

- 6 elementos em ciclo: fogo > natureza > terra > tempestade > água > fogo; `neutral` sem relações. (Atenção: `REQUIREMENTS.md` ainda cita Fogo/Água/Gelo/Sombras; vale o seed.)
- 8 magias, 2 classes (Guerreiro, Mago), 2 inimigos (`training-dummy` passivo, `ash-imp` agressivo de fogo), 1 missão (`first-sparks`: derrotar `training-dummy`, depois "receber recompensa").
- Fórmulas em texto: `strength + power - defense` e `intelligence + power - resistance`; multiplicadores elementais 1.5 / 0.75; crítico 5% + 1% por passo de velocidade, x1.5; regeneração de mana 5 por turno em combate.

**Área do jogador (Phase 4, na `master`)**

- `/play` com Personagem, Inventário, Magias e Missões (somente leitura). `normalizeCharacter` lê HP/mana de `profiles.current_state`; XP em `profiles.xp` é o XP dentro do nível; curva `base_xp * level_multiplier^(n-1)`, nível máximo 20.
- Magias equipáveis em até 8 slots por `character_spells`; o onboarding não equipa nada.
- Nenhum código de combate existe (`grep` em `src/` não encontra combate). Não há plano anterior da Fase 5 além das 4 linhas do ROADMAP.

**Lacunas encontradas que afetam o plano**

1. RLS atual deixa o jogador escrever em `combat_sessions`, `combat_participants` e `combat_events` ("users can manage own ..." com `for all`), em `profiles` (inclusive `level`, `xp`, `base_stats`, `current_state`) e em `inventory`. Combate no cliente com essas políticas seria trivialmente trapaceável.
2. `combat_events` não tem ordem estável: eventos gravados na mesma transação compartilham `created_at`.
3. Nenhuma garantia de "uma sessão ativa por jogador".
4. Magias de suporte do seed (`water-veil`, `stone-guard`) têm `target_type = 'enemy'` (valor padrão) embora sejam buffs de `power = 0`.
5. Nenhuma magia do seed define `status_effect_id`; o status vem do elemento (`elements.status_effect`) com chance em `effects.status_chance`.
6. `resistance` aparece na fórmula mágica, mas não existe atributo `resistance` em nenhum lugar.
7. Não há ação de "aceitar missão"; `character_quests` só é lido.
8. Conteúdo: o jogador de nível 1 não tem magia de dano de água; a fraqueza do `ash-imp` só pode ser explorada pelo Mago no nível 3 (`tidal-cut`).
</current_state>

<decisions>
## Decisões tomadas por padrão

- **D-01 (onde roda a lógica):** o motor é um módulo ES puro em `src/engine/combat/` (sem DOM, sem Supabase, sem `Math.random`/`Date.now`). Ele roda **no servidor, numa Edge Function `combat`, como autoridade**, e **no navegador** apenas para o modo de treino local (05-03) e para prever/validar ações na UI. Mesma lógica nos dois lados, uma única fonte de verdade.
- **D-02 (determinismo):** todo sorteio usa PRNG semeado por `combat_sessions.seed` + cursor guardado em `snapshot`. Mesma semente + mesmas ações = mesmos eventos (permite teste, replay e auditoria; atende `turn_seeded: true`).
- **D-03 (regras congeladas):** ao iniciar o combate, as regras ativas e as linhas de catálogo usadas entram em `combat_sessions.snapshot`. Mudanças feitas no admin durante a luta não alteram a luta em andamento.
- **D-04 (fórmulas):** as fórmulas em texto de `combat_rules` são interpretadas por um parser de lista fechada (`+`, `-`, atributos conhecidos). Nada de `eval`. Fórmula inválida cai no padrão do motor e gera aviso, nunca quebra o combate.
- **D-05 (vocabulário de efeitos):** `spells.effects` e `status_effects.rules` são lidos por um registro de handlers conhecidos (ver `05-ENGINE-SPEC.md`). Chave desconhecida é ignorada com aviso no evento `system`.
- **D-06 (modelo de turnos):** rodadas; ordem por velocidade (maior primeiro), empate favorece o jogador; recalculada no início de cada rodada. Um jogador contra 1 a 3 inimigos no MVP.
- **D-07 (ações do jogador):** ataque básico (físico, sem custo), magia equipada e desbloqueada (ou, sem nenhuma equipada, as desbloqueadas até 8), usar consumível e fugir. Cada ação consome o turno.
- **D-08 (persistência):** `combat_participants.current_stats` guarda HP/mana/atributos efetivos; `status_effects` guarda efeitos ativos; recargas, escudo, cursor do PRNG e turno ativo ficam em `snapshot`. Eventos usam os tipos já permitidos; detalhes extras vão em `payload.kind` (sem alterar o `check`).
- **D-09 (segurança):** o jogador passa a ter **somente leitura** nas tabelas de combate; escrita só pela Edge Function (chave de serviço existe apenas no servidor, nunca no cliente). Recompensas e missões por função SQL transacional e idempotente, restrita a `service_role`.
- **D-10 (HP/mana entre combates) — CONFIRMADO em 2026-10-10:** HP persiste entre combates (`profiles.current_state`). Derrota não tira XP nem itens: a única penalidade é a mana gasta, e o jogador volta com 1 de HP. Recuperação fora de combate: regeneração lenta por dias; recuperação média por teste de medicina (d20 contra uma DT); recuperação instantânea por poções.
- **D-11 (elemento do personagem) — CONFIRMADO em 2026-10-10:** o personagem tem elemento próprio, escolhido na criação (`profiles.element_id`), usado como elemento defensivo e no ataque básico.
- **D-12 (equipamento) — CONFIRMADO em 2026-10-10:** bônus de `items.stats` dos itens equipados (slot compatível com o tipo) somam aos atributos no início do combate.
- **D-13 (Realtime) — CONFIRMADO em 2026-10-10, entra agora:** mestre e jogadores agem na mesma sessão, então o estado e o log precisam chegar a todos em tempo real (plano 05-06).
- **D-14 (conteúdo e atribuição) — CONFIRMADO em 2026-10-10:** o mestre atribui inimigos e magias aos jogadores da sua campanha. Hoje as escritas de catálogo são `is_admin()` e não há área do mestre nem campanha; ver 05-05.
- **D-15 (três perfis) — CONFIRMADO em 2026-10-10:** `admin` só adiciona conteúdo, resolve bugs e dá suporte a jogadores e mestres, sem função na dinâmica nem no combate; `master` realiza as ações da dinâmica; `player` age na própria vez.
- **D-16 (boneco de treino) — CONFIRMADO em 2026-10-10:** existe apenas para testes das contas `@onikara.local`; jogadores reais não o veem. Consequência: a missão seed `first-sparks` (derrotar o boneco) só é completável por contas de teste.
- **D-17 (ataque básico) — CONFIRMADO em 2026-10-10:** existe e o dano é um dado entre 1d4 e 1d10. A origem do dado (arma, classe) está em aberto (decisão aberta E).
- **D-18 (resistência mágica) — CONFIRMADO em 2026-10-10:** `resistance = 0` até existir atributo.

## Alternativas consideradas para a autoridade do combate

| Opção | Prós | Contras | Veredito |
| --- | --- | --- | --- |
| A. Tudo no cliente | Zero infraestrutura nova; mais rápido | Trapaça trivial (HP, XP, loot); rompe a regra "ação sensível exige RPC auditada" | Só para o treino local sem recompensa |
| B. Edge Function com o motor compartilhado | Uma lógica só; testável com `node --test`; servidor decide tudo; combina com PRNG semeado | Primeira Edge Function do projeto; precisa de Docker/CLI para servir e implantar; importar `src/engine` de dentro da função exige verificação (spike em 05-04) | **Recomendada** |
| C. Motor em plpgsql | Sem runtime extra; transação nativa | Reescreve a lógica em SQL, duplica o motor do treino, difícil de testar e de ler | Descartada |

Plano B caso o spike de importação falhe: copiar o motor para `supabase/functions/_shared/combat/` por script `npm run engine:sync` com teste de igualdade (hash) no `npm test`.

## Impacto em RLS (resumo)

| Tabela | Hoje | Depois da Fase 5 |
| --- | --- | --- |
| `combat_sessions`, `combat_participants`, `combat_events` | jogador `for all` no que é seu | jogador só `select`; escrita por Edge Function (`service_role`) |
| `profiles` | jogador insere/atualiza qualquer coluna | jogador atualiza só `character_name` e `settings`; criação por RPC `create_character` |
| `inventory` | jogador `for all` | jogador só `select`; ganho/consumo por função |
| `character_quests` | jogador `for all` | jogador só `select`; início e avanço por RPC |
| `campaigns`, `campaign_members` (novas, 05-05) | não existem | mestre gerencia a própria campanha; jogador lê a campanha da qual participa; admin lê |
| `combat_*` para o mestre | não existe | mestre da campanha lê e, pela função, conduz; jogadores participantes leem |
| `equipment`, `character_spells` | jogador `for all` | mantém (servidor valida desbloqueio/slot ao montar o combate) |
| Admin | `is_admin()` em tudo | mantém para leitura; escrita direta em `profiles` ficará bloqueada por privilégio de coluna e passará por RPC de suporte (Phase 6) |

## Estratégia mínima de testes

O projeto não tem testes. A Fase 5 introduz o mínimo viável, sem dependência nova:

- Runner: `node --test` (Node 24 já é o usado no projeto). Script `npm test`. Pasta `tests/engine/`.
- Motor puro = testes unitários sem mocks: iniciativa, dano base, vantagem/desvantagem elemental, crítico determinístico, mana insuficiente, recarga, regeneração, status (DoT, controle, expiração), IA, fim de combate.
- Fixtures: `tests/fixtures/rules.mvp.json` espelha o seed (regras, elementos, magias, inimigos). Teste de deriva compara a fixture com `supabase/seed.sql` para as chaves usadas.
- Invariantes sobre 200 combates simulados com sementes diferentes: HP e mana nunca negativos, recarga nunca negativa, combate sempre termina em N rodadas, mesma semente gera o mesmo log.
- Banco: script SQL de verificação em `supabase/tests/combat_rls.sql` (rodado com `supabase db reset` + `psql`, ou `supabase test db` se o pgTAP for adotado) provando que `authenticated` não consegue inserir/atualizar tabelas de combate nem `profiles.level`.
- Cliente: sem teste automatizado de UI; UAT manual guiado em cada plano (como na Fase 4).

## Riscos

- Primeira Edge Function do projeto (Deno, importação do motor, CORS, JWT). Mitigação: spike como primeira tarefa de 05-04 e plano B descrito acima.
- Rebalanceamento: regras em texto livre podem divergir do parser. Mitigação: validação de fórmula no admin (item de backlog) e fallback com aviso.
- Conteúdo escasso (2 inimigos, 8 magias) limita a diversão. Mitigação: conteúdo é do mestre (D-14); o seed cobre o mínimo até o mestre cadastrar.
- Mudar RLS pode quebrar telas da Fase 4 (onboarding, equipar). Mitigação: 05-08 isolado, com UAT de regressão de `/play` e `/admin`.

## Decisões em aberto (dono do produto)

Confirmadas em 2026-10-10: D-01 (servidor como autoridade), D-10 a D-18 acima.

Ainda abertas, cada uma com padrão proposto:

- **A. Quem controla os inimigos na luta?** Padrão proposto: IA simples por padrão (05-02); o mestre pode assumir a ação de qualquer inimigo no seu turno. Alternativa: só o mestre, sem IA.
- **B. Campanha:** padrão proposto: o mestre cria uma campanha e convida jogadores; cada jogador pertence a uma campanha por vez no MVP (tabelas `campaigns` e `campaign_members`). Alternativa: jogadores em várias campanhas.
- **C. Quem inicia o combate e quem recebe a recompensa?** Padrão proposto: só o mestre inicia; XP e loot saem automáticos por regra no fim da luta e o mestre pode conceder extras depois.
- **D. Ordem de turno:** padrão proposto: automática por velocidade (como no balanceamento) e o mestre pode pausar, pular ou encerrar. Alternativa: o mestre define a ordem.
- **E. Dado do ataque básico (1d4 a 1d10):** padrão proposto: definido pela arma equipada (sem arma, 1d4). Alternativa: definido pela classe.
- **F. Teste de medicina:** padrão proposto: d20 + inteligência contra uma DT fixada na regra (por exemplo, 12); passou, recupera 25% do HP máximo, no máximo uma vez por dia. Alternativa: o mestre define a DT.
</decisions>

<canonical_refs>
## Referências

- `.planning/ROADMAP.md` (Phase 5), `.planning/STATE.md`
- `.planning/phases/04-rea-do-jogador-perfil-personagem-e-progress-o/` (formato dos planos e padrões do player)
- `.planning/phases/05-combate-interativo-e-realtime/05-ENGINE-SPEC.md`
- `supabase/migrations/20260524031051_initial_rpg_schema.sql`, `supabase/seed.sql`
- `src/services/playerProgression.js` (curva de XP e atributos), `src/services/playerSpells.js`, `src/services/playerQuests.js`
- `.planning/design-system/BRAND.md`, `tokens.css`, `components.css`
</canonical_refs>
