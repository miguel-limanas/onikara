# Phase 3: Area de Administracao - Catalogos e Balanceamento - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar a primeira experiencia funcional de administracao da plataforma Onikara, incluindo portal de entrada/login, roteamento para `/admin`, protecao por Auth/RLS, camada de API via Supabase JS e CRUD operacional de catalogos, relacionamentos e regras de balanceamento.

Esta fase deve transformar a fundacao Supabase e o design system em produto navegavel: administradores autenticam, acessam o shell administrativo, veem um dashboard operacional inicial, configuram conteudo de gameplay e editam regras publicaveis com auditoria. A entrega deve usar Supabase como backend principal e UI UX Pro Max como criterio de qualidade para landing/login, tabelas, formularios, estados e responsividade.

Ficam fora desta fase: experiencia jogavel completa do player, combate interativo, Realtime de combate, modo master/campanhas, metricas avancadas de operacao e automacoes complexas de suporte.

</domain>

<decisions>
## Implementation Decisions

### Escopo Integrado da Fase
- **D-01:** A Phase 3 deve incluir todo o desenvolvimento necessario de API/integração com Supabase para o admin, nao apenas telas estaticas.
- **D-02:** A API deve ser entendida como camada de acesso Supabase JS sobre PostgREST/RPC/RLS, com modulos de dominio e validacoes no cliente; backend proprio so deve existir se uma regra exigir segredo, elevacao de privilegio ou fluxo impossivel via RLS normal.
- **D-03:** O fluxo de entrada deve contemplar landing/login como primeiro contato real com o produto antes do shell `/admin`.
- **D-04:** O mockup `.planning/design-system/onikara_landing.html` deve orientar portal, login, identidade inicial, selecao de contexto e sensacao institucional.
- **D-05:** O mockup `.planning/design-system/onikara_admin.html` deve orientar o shell administrativo, densidade de dados, navegacao lateral, dashboard, catalogos, balanceamento e auditoria.
- **D-06:** `.planning/design-system/onikara_dashboard.html` pode ser lido apenas para preservar separacao visual entre admin e player; nao deve puxar funcionalidades de jogador para a Phase 3.

### Login, Landing e Roteamento
- **D-07:** A entrada oficial deve seguir o contrato de marca: portal comum Onikara, autenticacao, descoberta dos contextos disponiveis e abertura do shell isolado correspondente.
- **D-08:** Para esta fase, o caminho prioritario depois do login e `/admin` quando o usuario autenticado tiver papel administrativo.
- **D-09:** Usuarios sem permissao admin devem receber estado bloqueado claro, sem expor navegacao administrativa ou dados de plataforma.
- **D-10:** O login deve usar Supabase Auth e estado de sessao real, com feedback de carregamento, erro, sucesso, recuperacao basica de estado e protecao contra duplo envio.
- **D-11:** A landing/login deve carregar a marca Onikara como sinal de primeiro viewport, usando o logo como selo institucional e nao como decoracao repetida.

### Supabase e Contratos de API
- **D-12:** O admin deve operar com Supabase JS usando anon key + sessao autenticada + RLS. `service_role` permanece proibido no navegador.
- **D-13:** Modulos de acesso devem ser separados por dominio, por exemplo: `auth`, `adminProfile`, `catalogs`, `balanceRules`, `relationships`, `auditLogs`, `supportRead`.
- **D-14:** Cada modulo deve padronizar retorno de dados, loading, erro estruturado e mensagens amigaveis para UI.
- **D-15:** Escritas administrativas devem passar por RLS/helpers de admin e registrar auditoria conforme a Phase 1.
- **D-16:** RPCs devem ser usadas para acoes sensiveis, publicacao/arquivamento, operacoes que exigem validacao transacional ou suporte operacional controlado.
- **D-17:** CRUD simples de catalogos pode usar PostgREST/Supabase JS diretamente quando as policies e constraints forem suficientes.
- **D-18:** Regras de progressao, mana, combate, raridade e loot devem respeitar versionamento `draft`, `active` e `archived`.
- **D-19:** Conteudo publicado deve aparecer para jogadores por views/policies publicas ja previstas, mas a UI de player continua fora desta fase.
- **D-20:** Seeds/migrations devem continuar reproduziveis para desenvolvimento local.

### Admin UI com UI UX Pro Max
- **D-21:** A implementacao visual deve seguir o design system Onikara e aplicar UI UX Pro Max como checklist: acessibilidade, touch targets, formularios, tabelas, estados, responsividade e performance.
- **D-22:** O admin deve ser denso, calmo, operacional e premium minimalista; evitar hero cinematografico dentro do backoffice.
- **D-23:** Tabelas devem ser filtraveis, escaneaveis e contidas em wrappers responsivos, com scroll horizontal local quando necessario.
- **D-24:** Formularios devem ter labels visiveis, validacao no blur, indicadores de obrigatoriedade, feedback de submit, estados disabled/loading/error/success e mensagens proximas ao campo.
- **D-25:** Acoes destrutivas e arquivamento devem exigir confirmacao e indicar impacto.
- **D-26:** Icones estruturais devem usar biblioteca consistente ou SVGs consistentes; emojis nao devem ser usados como iconografia de produto.
- **D-27:** Foco visivel, navegacao por teclado, contraste minimo 4.5:1 e suporte a `prefers-reduced-motion` sao criterios bloqueantes.
- **D-28:** O admin deve reutilizar tokens e componentes de `.planning/design-system/tokens.css` e `.planning/design-system/components.css` antes de criar variacoes novas.

### Catalogos e Relacionamentos
- **D-29:** A primeira superficie de CRUD deve cobrir classes, racas, elementos, status, magias, itens, inimigos e missoes.
- **D-30:** Relacionamentos como classe-magia, inimigo-magia e etapas de missao devem ser editaveis com telas/projecoes que deixem claro o que esta sendo vinculado.
- **D-31:** Campos JSON/regras estruturadas devem ter validacao antes de salvar, evitando corromper configuracoes.
- **D-32:** O admin deve suportar publicar/arquivar conteudo sem apagar historico sensivel.

### Dashboard, Auditoria e Suporte Inicial
- **D-33:** O dashboard administrativo inicial deve mostrar status operacional util para a Phase 3: totais de catalogos, conteudos em draft/active/archived, atividades recentes e alertas de configuracao.
- **D-34:** Auditoria deve ser visivel em leitura para administradores, com filtro por entidade, operacao, usuario e data quando viavel no escopo.
- **D-35:** Visualizacao de jogadores, sessoes de combate e ferramentas de suporte deve ser inicial e controlada: leitura/diagnostico primeiro, acoes mutaveis apenas se ja houver RPC segura planejada.

### the agent's Discretion
- Escolher a organizacao final de pastas do frontend, desde que preserve ES Modules, modularidade e separacao entre `auth`, `admin`, componentes compartilhados e servicos Supabase.
- Definir a granularidade exata dos primeiros formulários e tabelas conforme o schema real, priorizando as entidades com maior impacto para configurar o MVP.
- Criar pequenos componentes auxiliares quando o kit inicial nao cobrir um padrao necessario, desde que os tokens e regras do design system sejam mantidos.
- Decidir se a primeira implementacao sera SPA estatica com rotas simples ou paginas HTML/JS separadas, desde que o fluxo login -> admin seja real e testavel localmente.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planejamento do Produto
- `.planning/ROADMAP.md` - Define Phase 3, objetivo, criterios de sucesso e planos 03-01 a 03-04.
- `.planning/REQUIREMENTS.md` - Define `UIDB-03`, `ADMIN-01`, `ADMIN-02`, `ADMIN-03`, `ADMIN-04` e requisitos de catalogo/balanceamento.
- `.planning/PROJECT.md` - Define Onikara, Supabase como plataforma base, separacao admin/player e direcao de identidade.
- `.planning/STATE.md` - Estado atual do projeto e foco na Phase 3.

### Fundacao Supabase
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-CONTEXT.md` - Decisoes sobre admin, player, master, RLS, auditoria, service_role e contratos.
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md` - Contratos de acesso Supabase para admin/player/master.
- `supabase/migrations/20260524031051_initial_rpg_schema.sql` - Schema inicial de catalogos, perfis, inventario, quests, combate, RLS e policies.
- `supabase/seed.sql` - Dados iniciais de classes, racas, elementos, status, magias, itens, inimigos e quest.
- `supabase/config.toml` - Configuracao Supabase local.
- `package.json` - Dependencias e scripts Supabase/npm.

### Design System e UI UX Pro Max
- `.planning/phases/02-identidade-visual-e-design-system-onikara/02-CONTEXT.md` - Decisoes de marca, paleta, tipografia, modos e acessibilidade.
- `.planning/design-system/BRAND.md` - Guia de marca Onikara, fluxo de acesso e expressao do admin.
- `.planning/design-system/INITIAL-KIT.md` - Kit inicial, componentes, estados obrigatorios, tokens e regras de responsividade.
- `.planning/design-system/RESPONSIVE-SPEC.md` - Contrato responsivo para telas futuras.
- `.planning/design-system/ACCESSIBILITY-REVIEW.md` - Checklist e auditoria de acessibilidade do design system.
- `.planning/design-system/tokens.css` - Tokens oficiais reutilizaveis.
- `.planning/design-system/components.css` - Componentes base reutilizaveis.
- `.planning/design-system/MOCKUPS.md` - Indice e regras de uso dos mockups.

### Mockups Canonicos para Phase 3
- `.planning/design-system/onikara_landing.html` - Referencia para portal, landing/login e primeiro acesso.
- `.planning/design-system/onikara_admin.html` - Referencia principal para shell administrativo, dashboard, catalogos, balanceamento e auditoria.
- `.planning/design-system/onikara_dashboard.html` - Referencia secundaria para manter separacao visual entre admin e player; nao importar funcionalidades de player para esta fase.

### Arquitetura e Convencoes
- `.planning/codebase/ARCHITECTURE.md` - Define `/admin`, `/play`, Auth, RLS, auditoria, suporte e Supabase como plataforma.
- `.planning/codebase/STACK.md` - Stack: HTML/CSS/JS puro, ES Modules, Supabase JS, Supabase local em Docker.
- `.planning/codebase/CONVENTIONS.md` - Convencoes de pastas, ESM, async/await, factory/OOP e integracao Supabase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/design-system/tokens.css`: fonte primaria de tokens visuais e semanticos para implementar landing/login e admin.
- `.planning/design-system/components.css`: base para botoes, inputs, selects, modais, tabs, tabelas, badges, toasts, empty states, stat bars e toolbars.
- `.planning/design-system/onikara_landing.html`: referencia de composicao do portal e primeiro viewport.
- `.planning/design-system/onikara_admin.html`: referencia de densidade, navegacao e organizacao administrativa.
- `supabase/migrations/20260524031051_initial_rpg_schema.sql`: base de tabelas e policies a serem consumidas pelo admin.
- `supabase/seed.sql`: dados iniciais para validar tabelas, formularios e filtros.
- `package.json`: confirma `@supabase/supabase-js` e scripts de Supabase local.

### Established Patterns
- O projeto usa HTML/CSS/JS puro com ES Modules, sem framework de UI.
- Supabase e RLS sao a fronteira de seguranca; o frontend nao deve contornar policies.
- Admin e player sao shells separados, com portal comum antes da entrada.
- O design system privilegia preto institucional, carmesim e dourado velho, com admin operacional e nao espetacular.
- Artefatos humanos devem permanecer em portugues brasileiro; identificadores tecnicos podem ficar em ingles.

### Integration Points
- Criar cliente Supabase compartilhado a partir de variaveis/configuracao local segura.
- Implementar guard de autenticacao e verificacao de role admin antes de renderizar `/admin`.
- Conectar tabelas de catalogo a listagens, filtros, formularios, publicacao/arquivamento e auditoria.
- Conectar regras versionadas a telas de balanceamento, preservando `draft`, `active` e `archived`.
- Expor auditoria como leitura administrativa sem permitir edicao dos logs.
- Reservar Realtime para fases futuras ou apenas estados que realmente precisem reagir ao vivo; Phase 3 nao deve forcar realtime onde polling/leitura sob demanda basta.

</code_context>

<specifics>
## Specific Ideas

- Incluir todo o desenvolvimento de API com Supabase dentro da Phase 3.
- Usar UI UX Pro Max como criterio de UI para a fase.
- Considerar explicitamente o mockup de login + landing e o mockup de admin.
- Tratar a landing/login como parte real do produto, nao apenas uma pagina decorativa.
- Fazer o admin nascer conectado ao Supabase e preparado para governar catalogos e balanceamento do RPG.

</specifics>

<deferred>
## Deferred Ideas

- Experiencia completa do jogador em `/play`, incluindo criacao de personagem, inventario, missoes e progressao.
- HUD de combate, turnos, eventos e Realtime de combate.
- Modo master com campanhas, cenas, mobs e fichas de jogadores.
- Metricas operacionais avancadas, relatorios completos de balanceamento e suporte mutavel amplo.

</deferred>

---

*Phase: 3-Area de Administracao - Catalogos e Balanceamento*
*Context gathered: 2026-05-24*
