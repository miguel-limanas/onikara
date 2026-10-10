---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready_for_review
last_updated: "2026-10-10T23:00:00.000Z"
last_activity: 2026-10-10 -- Phase 05 implemented (plans 05-01 a 05-08), verificada localmente
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 22
  completed_plans: 22
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-24)

**Core value:** Prover um motor de combate por turnos modular e facilmente balanceável, onde as fraquezas elementais e a gestão tática de mana sejam determinantes para a vitória.
**Current focus:** Phase 5 — combate interativo conduzido pelo mestre (implementada); próxima: Phase 6

## Current Position

Phase: 5 of 6 (combate interativo e Realtime)
Plan: 8 of 8 concluídos (05-01 a 05-08)
Status: Implementada e verificada localmente (ver `.planning/phases/05-combate-interativo-e-realtime/05-VERIFICATION.md`). Sem UAT formal; Edge Function ainda não publicada; telas do `/admin` não reabertas após as mudanças de RLS.
Last activity: 2026-10-10 -- Phase 05 implementada, testada (53 testes do motor + scripts de fluxo) e verificada no navegador

Progress: [████████░░] 83% (5 de 6 fases)

## Performance Metrics

**Velocity:**

- Total plans completed: 14
- Average duration: 0 min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Núcleo Supabase/Governança | 0 | 3 | - |
| 2. Identidade Visual/Design System | 0 | 3 | - |
| 3. Área de Administração | 4 | 4 | 19 min |
| 4. Área do Jogador | 4 | 4 | - |
| 5. Combate Interativo/Realtime | 0 | 4 | - |
| 6. Observabilidade/Polimento | 0 | 4 | - |
| 01 | 3 | - | - |
| 02 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: N/A
- Trend: Stable

## Accumulated Context

### Decisions

- [Project]: Artefatos, resumos, guias, relatórios, decisões e textos de preview devem ser escritos em português brasileiro, com acentuação correta e registro de norma culta. Identificadores técnicos, nomes de arquivos, classes, tokens CSS, comandos e APIs podem permanecer em inglês quando fizerem parte do contrato técnico.

- [Phase 1]: Escolha da arquitetura modular baseada em JavaScript puro para as regras de negócio e motor do jogo.
- [Phase 1]: Escalonamento definido como MVP de 4 fases para validar o combate estratégico de mana/elementos de forma enxuta.
- [Phase 1]: Nome do produto definido como Onikara.
- [Phase 1]: Roadmap reorganizado para conter área de administração e área de interação dos jogadores, ambas apoiadas em Supabase.
- [Phase 3]: O backoffice usa Supabase JS no browser com anon key e sessão autenticada; `service_role` permanece proibido no cliente.
- [Phase 3]: Catálogos e regras são editados por módulos de serviço específicos, com validação de JSON antes do envio.
- [Phase 3]: Suporte mutável fica bloqueado até existir RPC auditada dedicada; a tela atual é operacional e somente leitura.

- [Phase 4]: `/play` é a área do jogador (rota limpa, shell isolado do `/admin`); o portal manda admin para `/admin` e jogador para `/play`, onde o onboarding aparece quando não há personagem.
- [Phase 4]: `profiles.xp` guarda o XP dentro do nível atual; XP para subir = `base_xp * level_multiplier^(nível-1)` da regra ativa (fallback 100 / 1,35). Atributos crescem pelo `scaling` da classe a cada nível acima de 1.
- [Phase 4]: A criação de personagem concede um kit inicial (arma da classe, armadura remendada, 2 unguentos, 1 tônico); equipar/desequipar usa PostgREST direto sob RLS, sem RPC; magias equipam em até 8 slots.
- [Phase 4]: Aba de missões é somente leitura; avanço de progresso e recompensas ficam para a Phase 5 (RPC auditada).
- [Phase 5]: Motor de combate puro em `src/engine/combat/` com PRNG semeado, executado na Edge Function `combat` (autoridade) e no navegador (treino local). Tabelas de combate somente leitura para jogador e admin; escrita só por `persist_combat_step` (service_role).
- [Phase 5]: Três perfis: admin (conteúdo e suporte, sem função no combate), mestre (conduz a campanha, controla os inimigos, concede recompensas) e jogador. Campanha mínima: um jogador por campanha; o mestre libera inimigos e concede magias.
- [Phase 5]: HP persiste entre combates; derrota deixa 1 de HP e a mana gasta fica gasta; recuperação por dias (dado em `recovery_rules`), teste de medicina d20 + inteligência contra a DT do mestre (padrão 12) e poções.
- [Phase 5]: Elemento do personagem escolhido na criação (`profiles.element_id`); criação por RPC `create_character`; jogador não escreve em perfil (exceto nome/preferências), inventário nem missões. O boneco de treino e o treino local são só para contas `@onikara.local`.
- [Phase 5]: Realtime por `postgres_changes` em `combat_events`, `combat_sessions` e `combat_rewards`, com consulta periódica de reserva.
- [Phase 4]: O visual do personagem é um placeholder em camadas (descrição em texto + retrato SVG por classe/raça), substituível por arte depois.

### Pending Todos

- Phase 5: publicar e validar a Edge Function (`supabase functions deploy`), incluindo o empacotamento do import de `src/engine`.
- Phase 5: reabrir as telas do `/admin` (login, catálogos, balanceamento, jogadores, sessões) para regressão após as mudanças de RLS; incluir `recovery_rules` nas telas de balanceamento.
- Phase 5: dar à missão seed `first-sparks` um alvo que jogadores reais possam enfrentar (hoje o boneco de treino é só de contas de teste) e definir como o mestre cadastra conteúdo (papel `master` ainda sem escrita em catálogos).
- Phase 5: permitir que o jogador reveja o resultado de um combate encerrado; testar com dois navegadores e reconexão do Realtime.
- Balanceamento: o Imp de Cinzas (nível 2) derrotou um Mago de nível 1 no navegador, mas perde em 100% das 200 simulações com personagens de nível 3; revisar valores no admin.
- Seed: nomes e descrições de itens/magias/missões sem acento (dados do banco); corrigir quando combinado.
- Testar login de admin em `/` após a mudança de roteamento (só jogador foi exercitado).
- Rodar `/gsd-verify-work` / UAT formal da Phase 4 se desejado.

### Blockers/Concerns

None yet.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-25T21:37:02.221Z
Stopped at: Phase 4 implementada (revisão pendente)
Resume file: .planning/ROADMAP.md (próxima: Phase 5, combate interativo)
