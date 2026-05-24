# Phase 1: Nucleo Supabase, Papeis e Governanca - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Preparar a fundacao Supabase de Onikara para separar administracao de plataforma, jogadores e o papel futuro de mestre, com Auth/JWT claims, RLS, auditoria, configuracoes versionadas de gameplay e contratos de acesso documentados para admin/player/master.

Esta fase formaliza a governanca backend. Ela nao entrega telas completas de admin, campanhas de mestre, UI de jogador ou ferramentas narrativas.

</domain>

<decisions>
## Implementation Decisions

### Papeis e Claims
- **D-01:** O modelo deve ser hibrido: `player` e `admin` ficam ativos no MVP, mas o schema/claims devem nascer preparados para papeis graduais futuros.
- **D-02:** `admin` significa platform admin, nao operador limitado. Ele tem autoridade ampla sobre tabelas, configuracoes, permissoes e operacao da plataforma.
- **D-03:** `master` e um papel conceitualmente separado de `admin`: pode tambem ser jogador, monta campanhas e conduz narrativa. Phase 1 deve reconhecer `master` como claim, mas sem telas ou fluxos especiais.
- **D-04:** O backend deve reconhecer papeis por claims no JWT do Supabase Auth. RLS/helpers devem confiar em claims assinadas, nunca em logica apenas no frontend.
- **D-05:** A promocao/admin inicial deve ser feita por seed/migration local por enquanto. Nao ha fluxo no cliente para promover usuarios nesta fase.

### RLS e Poder Administrativo
- **D-06:** Catalogos de gameplay permanecem com leitura publica e escrita restrita a `admin`.
- **D-07:** `admin` pode ver dados de todos os jogadores, conceder/revogar permissoes e operar todas as tabelas necessarias da plataforma.
- **D-08:** O app `/admin` deve operar via Supabase JS e RLS normal usando helper SQL como `is_admin()` baseado em claim.
- **D-09:** `service_role` fica restrito a scripts, seed e manutencao fora do cliente. Nunca deve ser exposto no navegador.
- **D-10:** `player` acessa e gerencia seus proprios dados por RLS baseada em identidade.
- **D-11:** `master` deve ter claim reconhecida e politicas futuras documentadas, mas nenhuma policy ativa alem das permissoes de player na Phase 1.

### Auditoria Administrativa
- **D-12:** Auditar todo CRUD administrativo em catalogos/configuracoes e toda acao sensivel sobre jogadores/permissoes.
- **D-13:** Para catalogos e configuracoes, `admin_audit_logs` deve guardar `before`/`after` completo.
- **D-14:** Para jogadores e permissoes, o log deve guardar payload resumido/redigido para evitar despejar estado sensivel inteiro.
- **D-15:** Usar triggers SQL para CRUD de catalogos/configuracoes.
- **D-16:** Usar RPC/funcoes administrativas para acoes sensiveis sobre jogador, permissoes e suporte, preservando contexto operacional.
- **D-17:** Logs de plataforma sao leitura exclusiva de `admin`. `master` nunca le logs de plataforma.

### Configuracoes Versionadas
- **D-18:** Configuracoes de gameplay devem usar tabelas explicitas por dominio, nao uma tabela generica de chave/JSON.
- **D-19:** Dominios da Phase 1: progressao, mana, combate, raridade e loot.
- **D-20:** Cada dominio deve suportar versionamento com `draft`, `active` e `archived`.
- **D-21:** O cliente/player/game engine deve consumir regras ativas por views publicas, como `active_progression_rules`, `active_mana_rules`, `active_combat_rules`, `active_rarity_rules` e `active_loot_rules`.

### Contratos Supabase JS
- **D-22:** Phase 1 deve documentar contratos antes de criar codigo JS prematuro.
- **D-23:** Os contratos devem ser Markdown com shapes/JSON, tabelas, views, RPCs, permissoes e consumidores.
- **D-24:** Separar tres contratos conceituais: `admin`, `player` e `master`.
- **D-25:** `admin` cobre plataforma, governanca, configuracoes, permissoes, auditoria e operacao.
- **D-26:** `player` cobre dados proprios, personagem, inventario, quests e combate.
- **D-27:** `master` fica conceitualmente separado e reservado para campanhas/narrativa, mesmo sem endpoints especiais ativos nesta fase.
- **D-28:** O cliente deve proibir expressamente `service_role`, segredos, mutacoes fora dos contratos documentados e qualquer bypass de RLS.

### the agent's Discretion
- Escolher nomes finais de helpers SQL, tabelas e views desde que preservem as decisoes acima e sigam padroes Supabase/Postgres claros.
- Definir detalhes de constraints, indices e testes de RLS conforme a migration existente e as necessidades de verificacao.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planejamento do Produto
- `.planning/ROADMAP.md` - Define Phase 1, sucesso esperado, planos 01-01 a 01-03 e separacao admin/player.
- `.planning/REQUIREMENTS.md` - Define UIDB-02, ADMIN-01, ADMIN-02, ADMIN-03 e requisitos relacionados.
- `.planning/PROJECT.md` - Define Supabase como plataforma base e a separacao entre administracao e jogador.
- `.planning/STATE.md` - Estado atual do projeto e decisoes acumuladas.

### Arquitetura e Convencoes
- `.planning/codebase/STACK.md` - Stack local com Supabase self-hosted, Supabase JS, Node/npm e Docker.
- `.planning/codebase/ARCHITECTURE.md` - Direcao de `/admin`, `/play`, Auth, RLS, auditoria e estado privado.
- `.planning/codebase/CONVENTIONS.md` - Convencoes de modularidade, Supabase e persistencia desacoplada.

### Banco Existente
- `supabase/migrations/20260524031051_initial_rpg_schema.sql` - Schema inicial com catalogos, perfis, inventario, quests, combate, RLS basica e policies existentes.
- `supabase/seed.sql` - Seed inicial de classes, racas, elementos, status, magias, itens, inimigos e quest.
- `supabase/config.toml` - Configuracao local Supabase.
- `package.json` - Scripts Supabase e dependencias (`@supabase/supabase-js`, `supabase` CLI).

### Direcao de Produto/Modo
- `.planning/sketches/MANIFEST.md` - Diferenciacao visual/conceitual entre admin, player e master.
- `.planning/sketches/002-modos-admin-player-mestre/README.md` - Explora como identidade separa admin, player e mestre sem virar tres produtos distintos.
- `pm-brain/knowledge/product/features/supabase-governance-foundation.md` - Feature brain sobre a fundacao de governanca Supabase.
- `pm-brain/hypotheses/supabase-governance-foundation.md` - Hipoteses relacionadas a governanca Supabase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/migrations/20260524031051_initial_rpg_schema.sql`: base para evoluir RLS, catalogos, perfis, inventario, quests e combate sem recomecar o schema.
- `supabase/seed.sql`: ponto de entrada para tornar o setup local reproduzivel, incluindo admin inicial/claims conforme a abordagem escolhida.
- `package.json`: ja possui scripts `supabase:start`, `supabase:status` e `supabase:db:reset` para verificacao local.

### Established Patterns
- Catalogos ja sao tabelas publicas com leitura liberada por RLS.
- Dados privados de jogador ja usam policies baseadas em relacao com `auth.uid()` via `profiles.user_id`.
- O projeto usa Supabase direto pelo cliente com RLS como fronteira de seguranca, evitando backend proprio antes da hora.
- A logica do jogo deve continuar modular em JavaScript/ESM, com Supabase como persistencia e validacao de estado.

### Integration Points
- Evoluir policies existentes de catalogo para permitir escrita admin via helper de claim.
- Adicionar helper SQL de autorizacao para claims (`is_admin()` e base para `is_master()`/role checks futuros).
- Adicionar tabelas explicitas de regras versionadas e views publicas de regras ativas.
- Adicionar `admin_audit_logs`, triggers de auditoria e RPCs administrativas para acoes sensiveis.
- Documentar contratos Supabase JS antes das fases de UI admin/player/master.

</code_context>

<specifics>
## Specific Ideas

- O termo `admin` deve sempre significar administrador da plataforma, com autoridade ampla. Nao confundir com `master`.
- `master` e papel narrativo/campanha, pode tambem ser player, e deve ser reconhecido desde a fundacao para evitar confusao futura.
- A Area Admin existe para manipular e operacionalizar configuracoes, catalogos, permissoes, jogadores e estado da plataforma.

</specifics>

<deferred>
## Deferred Ideas

- Fluxos/telas de campanha para `master`.
- Permissoes especiais de `master` sobre campanhas e narrativa.
- UI de promocao/revogacao de roles no cliente.
- Ferramentas completas de suporte mutavel ao jogador alem das RPCs sensiveis planejadas.

</deferred>

---

*Phase: 1-Nucleo Supabase, Papeis e Governanca*
*Context gathered: 2026-05-24*
