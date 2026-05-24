# Phase 1: Nucleo Supabase, Papeis e Governanca - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 1-Nucleo Supabase, Papeis e Governanca
**Areas discussed:** Modelo de papeis administrativos, Fronteiras de RLS por tipo de dado, Auditoria administrativa, Configuracoes versionadas de gameplay, Contratos Supabase JS para admin/player/master

---

## Modelo de Papeis Administrativos

| Option | Description | Selected |
|--------|-------------|----------|
| Simples: `player` e `admin` | Mais rapido para o MVP; bom se so o fundador operar no inicio. | |
| Graduada: `owner`, `admin`, `support`, `content_editor` | Melhor para governanca futura, mas amplia escopo. | |
| Hibrida | Comecar com `admin`/`player`, mas modelar para aceitar papeis graduais depois. | yes |

**User's choice:** Hibrida.
**Notes:** Depois foi esclarecido que `admin` significa platform admin, com poder amplo. `master` e um papel separado, ligado a campanhas/narrativa, e pode tambem ser player.

| Option | Description | Selected |
|--------|-------------|----------|
| Tabela publica controlada | `admin_memberships` como fonte de verdade. | |
| Claims no JWT via Supabase Auth | RLS/helpers confiam em claims assinadas pelo Auth. | yes |
| Tabela como fonte de verdade + helper SQL | Mais simples para Phase 1, claims depois. | |

**User's choice:** Claims no JWT.
**Notes:** Promocao/admin inicial deve ocorrer por seed/migration local por enquanto. Roles ativos agora: `player` e `admin`; `master` reconhecido como claim separada.

---

## Fronteiras de RLS por Tipo de Dado

| Option | Description | Selected |
|--------|-------------|----------|
| Leitura publica para todos; escrita so `admin` | Mantem padrao atual de leitura aberta e adiciona governanca de escrita. | yes |
| Leitura so autenticada; escrita so `admin` | Mais fechado, mas menos flexivel. | |
| Leitura publica so de publicado; rascunhos so admin | Bom futuro, exige status de publicacao. | |

**User's choice:** Leitura publica e escrita admin.
**Notes:** Usuario corrigiu a premissa: admin de plataforma pode ver tudo, operar todas as tabelas, conceder e revogar permissoes. A divergencia real e `master`, nao admin.

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 1 so ativa `admin` e `player`; `master` reservado | Menor escopo. | |
| Phase 1 reconhece `master` como claim sem telas/fluxos | Captura distincao sem implementar campanhas. | yes |
| Phase 1 modela `master` parcialmente | Mais completo, mas amplia escopo. | |

**User's choice:** Reconhecer `master` como claim.
**Notes:** `master` deve ser separado de platform admin e de player puro.

| Option | Description | Selected |
|--------|-------------|----------|
| Policies explicitas com `is_admin()` | Transparente e testavel. | |
| Service role fora do cliente | Poderoso, mas inadequado para admin no navegador. | |
| Misto | RLS com helper para app admin; service role so scripts/seed/manutencao. | yes |

**User's choice:** Misto.
**Notes:** `master` fica sem policies especiais ativas alem de player nesta fase.

---

## Auditoria Administrativa

| Option | Description | Selected |
|--------|-------------|----------|
| Somente acoes sensiveis | Menos log, menos rastreabilidade. | |
| Todo CRUD em catalogos/configuracoes | Forte para conteudo, mas nao cobre suporte/permissoes. | |
| Todo CRUD admin + acoes sensiveis | Governanca forte para plataforma. | yes |

**User's choice:** Todo CRUD admin + acoes sensiveis.
**Notes:** Inclui catalogos, configuracoes, permissoes, jogadores e suporte.

| Option | Description | Selected |
|--------|-------------|----------|
| Payload minimo | Quem, acao, tabela, alvo, timestamp. | |
| Antes/depois completo para tudo | Mais rastreavel, mas arriscado para dados sensiveis. | |
| Hibrido/redigido | `before`/`after` para catalogos/configs; resumido para jogadores/permissoes. | yes |

**User's choice:** Payload hibrido/redigido.
**Notes:** Evitar despejar estado sensivel inteiro.

| Option | Description | Selected |
|--------|-------------|----------|
| Triggers SQL | Automatico, mas precisa contexto. | |
| RPC administrativa | Explicito, mas mais contratos. | |
| Misto | Triggers para CRUD; RPC para acoes sensiveis. | yes |

**User's choice:** Misto.
**Notes:** Logs sao leitura exclusiva de `admin`; `master` nunca le logs de plataforma.

---

## Configuracoes Versionadas de Gameplay

| Option | Description | Selected |
|--------|-------------|----------|
| Tabelas genericas chave/JSON | Rapido e flexivel, menos validavel. | |
| Tabelas explicitas por dominio | Mais claro e validavel. | yes |
| Hibrido | Settings gerais genericos, gameplay explicito. | |

**User's choice:** Tabelas explicitas por dominio.
**Notes:** Dominios escolhidos: progressao, mana, combate, raridade e loot.

| Option | Description | Selected |
|--------|-------------|----------|
| Uma linha ativa sem historico | Simples, auditoria cobre mudancas. | |
| Versoes com `draft`, `active`, `archived` | Preparar alteracoes e reverter versoes. | yes |
| Versoes com `effective_from` | Bom para temporadas, cedo demais. | |

**User's choice:** Versionamento por status.
**Notes:** Cliente consome views publicas de regras ativas.

---

## Contratos Supabase JS para Admin/Player/Master

| Option | Description | Selected |
|--------|-------------|----------|
| Funcoes finas por tabela | Simples, mas espalha regra de dominio. | |
| Servicos por dominio | Mais organizado para fases futuras. | |
| Contratos documentados primeiro | Evita codigo prematuro e guia planner/executor. | yes |

**User's choice:** Contratos documentados primeiro.
**Notes:** Formato escolhido: Markdown com shapes/JSON, sem criar stubs JS agora.

| Option | Description | Selected |
|--------|-------------|----------|
| Proibir so `service_role` e segredos | Basico. | |
| Proibir tambem mutacoes fora dos contratos | Mais forte. | |
| Proibir service role, segredos, mutacoes fora dos contratos e bypass de RLS | Fronteira dura para proximas fases. | yes |

**User's choice:** Fronteira dura.
**Notes:** Contratos devem separar conceitualmente `admin`, `player` e `master`.

---

## the agent's Discretion

- Escolher nomes finais de helpers SQL, tabelas, views e constraints, desde que preservem as decisoes capturadas.
- Definir detalhes de implementacao/testes de RLS e auditoria conforme a migration existente.

## Deferred Ideas

- Telas e fluxos completos de `master`.
- Permissoes especiais de campanha/narrativa para `master`.
- UI de promocao/revogacao de roles no cliente.
- Suporte operacional mutavel mais amplo sobre jogadores.
