# Roadmap: Onikara

## Overview

Este roadmap orienta o desenvolvimento do MVP de **Onikara**, um RPG estratégico por turnos com base persistente em Supabase. A base mínima de dados já existe com catálogos de classes, raças, elementos, magias, itens, inimigos, missões, perfis, inventário, equipamentos e sessões de combate.

A próxima direção do produto passa a separar claramente duas experiências:

- **Área de administração**: usada para configurar e balancear a plataforma, governando catálogos, conteúdo, regras, progressão, permissões e telemetria operacional.
- **Área de interação dos jogadores**: usada para criação de personagem, progressão, inventário, missões, combate e feedback visual do estado do jogo.

Todas as fases devem usar os recursos já disponíveis do Supabase sempre que possível: Auth, Postgres, RLS, PostgREST, Realtime, Storage, Edge Functions quando necessário e migrations/seed para manter configuração reproduzível.

## Architecture Direction

## Implementation Flow

As decisões de implementação deste roadmap devem seguir o fluxo descrito em `.planning/IMPLEMENTATION_FLOW.md`, combinando PM skills para descoberta/definição de escopo com GSD para planejamento, execução, validação e atualização dos artefatos do projeto.

### Supabase como fonte de verdade

- **Auth**: autenticação de jogadores e administradores.
- **Postgres**: armazenamento relacional dos catálogos e estado dos jogadores.
- **RLS**: isolamento entre jogador, administrador e tabelas públicas de catálogo.
- **PostgREST / Supabase JS**: leitura e escrita do frontend sem criar API própria antes da hora.
- **Realtime**: atualização de eventos de combate, logs de administração e estados vivos quando a UI precisar reagir.
- **Storage**: assets de identidade visual, ícones, retratos, banners, imagens de itens e conteúdo editorial.
- **Migrations e seed**: versionamento de schema, conteúdo inicial e dados de demonstração.

### Separação das interfaces

- `/admin`: backoffice operacional com foco em densidade, tabelas, formulários, revisão, validação e auditoria.
- `/play`: experiência do jogador com HUD, navegação de personagem, inventário, missões e combate.
- `/auth`: login, cadastro, recuperação de acesso e roteamento por papel.
- Camada compartilhada: cliente Supabase, design tokens, componentes base, validações e modelos de domínio.

## Product Areas

### Administração

A área administrativa deve permitir:

- Gerenciar classes, raças, elementos, efeitos de status, magias, vínculos classe-magia, itens, inimigos, magias de inimigos, missões e etapas de missão.
- Configurar tabelas de progressão, curvas de XP, regras de mana, parâmetros de combate e balanceamento.
- Visualizar perfis de jogadores, inventários, equipamentos, missões ativas, status e sessões de combate.
- Executar ações controladas de suporte, como conceder item, ajustar XP, encerrar sessão travada e reprocessar recompensa.
- Publicar ou arquivar conteúdo sem apagar histórico sensível.
- Acompanhar métricas simples: personagens criados, combates iniciados/finalizados, taxa de vitória, uso de magias, distribuição de classes e gargalos de progressão.

### Jogadores

A área de interação dos jogadores deve permitir:

- Criar personagem escolhendo nome, classe e raça.
- Ver painel do personagem com nível, XP, atributos, estado atual, magias equipadas, inventário e equipamentos.
- Navegar por missões disponíveis/ativas/concluídas.
- Iniciar e jogar combates por turnos com HUD de HP, mana, cooldowns, efeitos ativos, ordem de turno e log de eventos.
- Receber feedback claro de recompensas, evolução de nível, desbloqueio de magia e alterações de status.

## UI/UX Direction

Diretrizes derivadas da skill `ui-ux-pro-max`:

- **Admin**: interface densa, calma e operacional. Priorizar tabelas filtráveis, formulários com validação inline, estados de salvamento, confirmação para ações destrutivas e navegação previsível. Evitar visual excessivamente heroico no backoffice.
- **Jogador**: interface mais expressiva, com identidade Onikara, feedback visual forte para combate, raridade, mana, elementos e progressão. Ainda assim, manter legibilidade e velocidade de decisão.
- **Acessibilidade**: contraste mínimo 4.5:1, navegação por teclado, foco visível, labels reais nos inputs, botões com área mínima de 44px e ícones com `aria-label`.
- **Responsividade**: mobile-first, sem scroll horizontal, layouts estáveis para HUD, inventário, grids e tabelas.
- **Formulários**: labels visíveis, erros próximos ao campo, validação no blur, mensagens de sucesso/erro e proteção contra duplo envio.
- **Performance**: reservar espaço para assets, usar lazy loading, tokens de layout estáveis e evitar animações que causem reflow.
- **Motion**: microinterações de 150-300ms, respeito a `prefers-reduced-motion`, animações com função clara.
- **Design system**: definir tokens semânticos para cor, tipografia, espaçamento, radius, sombra, raridade, elementos e estados de combate.

## Identity Research Track

Nome escolhido: **Onikara**.

Linha de pesquisa visual:

- Investigar referências de dark fantasy com energia anime, máscaras Oni, caligrafia japonesa estilizada, brasas, metal escuro, cinzas, selos/runa e contraste entre disciplina tática e poder demoníaco.
- Definir uma identidade que funcione em dois modos: **Admin Onikara** mais sóbrio e produtivo; **Player Onikara** mais imersivo e emocional.
- Criar tokens iniciais para: cores de marca, cores funcionais, elementos mágicos, raridades, status, tipografia, iconografia, textura/padrão e motion.
- Produzir pelo menos uma proposta de logo/wordmark, uma direção de ícones e uma biblioteca pequena de assets para Storage.
- Validar legibilidade, contraste, reconhecimento da marca em primeiro viewport e consistência entre admin e jogador.

## Phases

- [x] **Phase 1: Núcleo Supabase, Papéis e Governança** - Formalizar Onikara no schema, roles administrativas, permissões RLS e contratos de dados para admin/player. (completed 2026-05-24)
- [x] **Phase 2: Identidade Visual e Design System Onikara** - Pesquisar identidade, definir tokens, componentes base e assets compartilhados para as duas áreas. (completed 2026-05-24)
- [x] **Phase 3: Área de Administração - Catálogos e Balanceamento** - Construir backoffice para configurar conteúdo e regras do RPG usando Supabase. (completed 2026-05-24)
- [x] **Phase 4: Área do Jogador - Perfil, Personagem e Progressão** - Construir a experiência inicial do jogador com criação/personagem/inventário/missões.
- [x] **Phase 5: Combate Interativo e Realtime** - Implementar HUD de combate, eventos, ações por turno e sincronização com tabelas de combate. (implementada em 2026-10-10, ver `05-VERIFICATION.md`)
- [ ] **Phase 6: Observabilidade, Suporte e Polimento** - Métricas, auditoria, ferramentas de suporte, qualidade visual, acessibilidade e UAT.

---

## Phase Details

### Phase 1: Núcleo Supabase, Papéis e Governança

**Goal**: Preparar o backend Supabase para sustentar administração e jogador com segurança, rastreabilidade e dados versionados.
**Mode**: mvp
**Depends on**: Base mínima de dados existente
**Requirements**: UIDB-02, governança administrativa, autenticação, RLS

**Success Criteria**:

1. Existem papéis claros para jogador e administrador, sem depender de segredo no cliente.
2. Políticas RLS separam leitura pública de catálogo, escrita administrativa e dados privados do jogador.
3. Tabelas de configuração/plataforma existem para settings globais, regras de progressão e parâmetros de combate.
4. Alterações administrativas relevantes são auditáveis.
5. Seeds continuam reproduzíveis para desenvolvimento local.

**Plans**:
**Wave 1**

- [x] 01-01: Criar modelo de papéis administrativos no Supabase, helper SQL de autorização e políticas RLS para escrita de catálogos.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Adicionar tabelas de configuração (`platform_settings`, `progression_rules`, `combat_rules`, `admin_audit_logs`) e seeds iniciais.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: Definir contratos de acesso Supabase JS para módulos compartilhados de admin e player.

### Phase 2: Identidade Visual e Design System Onikara

**Goal**: Definir a identidade visual da marca Onikara e criar um design system aplicável ao backoffice e à área de jogo.
**Mode**: ui
**Depends on**: Phase 1 pode rodar em paralelo parcial
**Requirements**: UIDB-01, identidade visual, acessibilidade

**Success Criteria**:

1. O nome Onikara aparece como marca principal do produto.
2. Tokens de cor, tipografia, espaçamento, radius, sombras, estados, raridades e elementos estão documentados.
3. Há distinção clara entre linguagem visual do admin, do player e do master sem quebrar consistência de marca.
4. Componentes base têm estados de loading, empty, error, disabled, focus e success.
5. Contraste, touch targets e navegação por teclado são contemplados desde o início.

**Plans**:
**Wave 1**

- [x] 02-01: Pesquisar direção visual Onikara e documentar moodboard textual, paleta, tipografia e princípios de marca.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: Criar design tokens e componentes base: button, input, select, modal, tabs, table, badge, toast, stat bar e command/action toolbar.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03: Validar responsividade e acessibilidade dos componentes em admin, player e master.

### Phase 3: Área de Administração - Catálogos e Balanceamento

**Goal**: Entregar o primeiro backoffice funcional para configurar conteúdo e balanceamento do RPG diretamente sobre o Supabase.
**Mode**: mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: UIDB-02, CLRC, ELEM, MANA, CMBT, EQIP, NPCQ

**Success Criteria**:

1. Administrador consegue listar, criar, editar e arquivar conteúdos principais: classes, raças, elementos, status, magias, itens, inimigos e missões.
2. Formulários validam campos estruturados e JSON de regras sem corromper dados.
3. Relações como classe-magia, inimigo-magia e etapas de missão são editáveis com clareza.
4. Alterações são registradas em auditoria.
5. Conteúdo publicado aparece para jogadores por políticas Supabase adequadas.

**Plans**:
**Wave 1**

- [x] 03-01: Implementar shell do admin com navegação lateral, autenticação, proteção por role e dashboard operacional.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02: Implementar CRUD de catálogos de gameplay com tabelas filtráveis, formulários e validação.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03: Implementar telas de balanceamento: progressão, mana, combate, loot table, raridade e vínculos de desbloqueio.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04: Implementar visualização de jogadores, sessões de combate e ferramentas controladas de suporte.

**Cross-cutting constraints:**

- D-01: Phase 3 includes real Supabase API/integration work for admin, not static screens only.
- D-12: Admin uses anon key + authenticated session + RLS; `service_role` is prohibited in browser code.
- D-14: Modules standardize data, loading, structured errors and friendly UI messages.
- D-21: UI follows Onikara design system and UI UX Pro Max checklist.
- D-27: Visible focus, keyboard navigation, 4.5:1 contrast and `prefers-reduced-motion` are blocking criteria.
- D-28: Reuse `tokens.css` and `components.css` before creating new styles.
- D-33: Dashboard shows Phase 3 operational status: catalog totals, draft/active/archived content, recent activity and configuration alerts.
- D-05: `onikara_admin.html` guides shell, density, sidebar navigation, dashboard, catalogs, balancing and audit.
- D-15: Administrative writes pass through admin RLS/helpers and register audit per Phase 1.
- D-23: Tables are filterable, scannable and contained in responsive wrappers with local horizontal scroll when needed.
- D-24: Forms use visible labels, blur validation, required indicators, submit feedback and field-level messages.
- D-25: Destructive/archive actions require confirmation and impact indication.
- D-31: JSON/rule fields validate before saving to avoid corrupting data.
- D-16: RPCs are used for sensitive, transactional or support operations when needed.

### Phase 4: Área do Jogador - Perfil, Personagem e Progressão

**Goal**: Entregar a primeira experiência jogável fora do console, com estado persistido no Supabase.
**Mode**: mvp
**Depends on**: Phase 1, Phase 2, parcialmente Phase 3 para conteúdo
**Requirements**: STLV, CLRC, MANA, EQIP, NPCQ, UIDB

**Success Criteria**:

1. Jogador autentica, cria personagem e visualiza atributos calculados por classe/raça.
2. Perfil mostra nível, XP, HP, mana, atributos, magias, inventário e equipamentos.
3. Inventário e equipamentos permitem ações básicas com feedback visual.
4. Missões disponíveis e progresso do jogador são exibidos com estado claro.
5. Experiência mobile e desktop permanece navegável e legível.

**Plans**:

**Wave 1**

- [x] 04-01: Implementar autenticação, onboarding e criação de personagem.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02: Implementar painel do personagem, atributos, progressão e estado atual.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03: Implementar inventário, equipamentos e magias equipadas.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04: Implementar aba de missões do jogador.

**Cross-cutting constraints:**

- D-09: Experiência mobile deve manter leitura rápida por empilhamento e blocos estáveis, sem rolagem horizontal global.
- D-10: Shell `/play` permanece isolado de `/admin`; controles administrativos nunca aparecem no player.
- D-26: Supabase Auth, sessão persistida e RLS; `service_role` permanece proibido no navegador.

### Phase 5: Combate Interativo e Realtime

**Goal**: Transformar as tabelas de combate em uma experiência de turno interativa, com motor testado, servidor como autoridade, recompensas e progressão.
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: CMBT, ELEM, MANA, STLV, NPCQ, UIDB
**Contexto e decisões**: `.planning/phases/05-combate-interativo-e-realtime/05-CONTEXT.md` e `05-ENGINE-SPEC.md`

**Success Criteria**:

1. Jogador inicia uma sessão de combate persistida em `combat_sessions` e consegue retomá-la após recarregar a página.
2. Participantes, ordem de turno, recargas, efeitos e log aparecem no HUD com atualização previsível.
3. Ações do jogador respeitam mana, recarga, alvo, status e ordem de turno; fraquezas elementais alteram o dano de forma visível.
4. Eventos de combate são registrados em `combat_events`; o mestre conduz a dinâmica, os jogadores agem na própria vez e ninguém escreve diretamente nas tabelas de combate.
5. Vitória atualiza XP, nível, inventário e missões de forma idempotente; derrota e fuga não concedem recompensa.
6. O motor tem testes automatizados determinísticos (`npm test`).

**Plans**:

**Wave 1**

- [x] 05-01: Motor de combate puro e testado: iniciativa, ação, dano com fraqueza elemental, mana, recarga e simulador de terminal.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02: Motor: efeitos de status, consumíveis, fuga e IA simples dos inimigos, com simulação em lote.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-03: Aba Combate em `/play`: HUD, ordem de turno, ações, recargas e log, em modo treino local sem recompensas.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 05-04: Combate autoritativo (Edge Function com o mesmo motor), RLS somente leitura e persistência de sessões, participantes e eventos.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 05-05: Campanha e papel do mestre: sessões multi-jogador conduzidas pelo mestre, atribuição de inimigos e magias aos jogadores da campanha e RLS por perfil (admin, mestre, jogador).

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 05-06: Realtime do combate entre mestre e jogadores.

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 05-07: Recompensas: XP e nível, loot, recuperação de HP, aceitar missão, progresso por combate e resgate de recompensa.

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 05-08: Anti-trapaça: `create_character` por RPC e escrita direta restrita em perfil, inventário e missões.

**Cross-cutting constraints:**

- D-01: Motor puro em `src/engine/combat/`, executado no servidor como autoridade e no navegador apenas no treino local.
- D-02: Todo sorteio é semeado por `combat_sessions.seed`; mesma semente e mesmas ações geram os mesmos eventos.
- D-09: Jogador só lê tabelas de combate; escrita por Edge Function e funções restritas a `service_role`; `service_role` segue proibido no navegador.
- Phase 4 D-10: `/play` permanece isolado de `/admin`.
- Mudanças de schema entram como nova migration; RLS em toda tabela nova.

### Phase 6: Observabilidade, Suporte e Polimento

**Goal**: Fechar o ciclo operacional da plataforma com qualidade de uso, suporte e confiança.
**Mode**: hardening
**Depends on**: Phase 3, Phase 4, Phase 5
**Requirements**: operação, UX, acessibilidade, telemetria

**Success Criteria**:

1. Admin possui métricas essenciais de uso e balanceamento.
2. Ações sensíveis têm confirmação, auditoria e permissões testadas.
3. Fluxos críticos passam por UAT: criar conteúdo, criar personagem, jogar combate e receber recompensa.
4. Interfaces passam por revisão de acessibilidade, responsividade e consistência visual.
5. Há documentação clara para rodar Supabase, resetar dados e testar fluxos.

**Plans**:

**Wave 1**

- [ ] 06-01: Métricas operacionais no admin (ADMIN-04): funções SQL de agregação e tela "Métricas".
- [ ] 06-02: Balanceamento sem alterar números: tela da regra de recuperação e relatório de simulação inimigo x classe x nível.

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 06-03: Suporte mutável por RPC auditada (item, XP, restaurar, encerrar sessão travada, reprocessar recompensa) e auditoria legível.
- [ ] 06-04: Conteúdo do mestre (inimigos e magias da própria campanha) e campo de imagem para inimigos. Depende das respostas Q2 e Q3.

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 06-05: Revisão de acessibilidade e responsividade, pendências da Fase 5, UAT dos fluxos críticos e guia de desenvolvimento.

Contexto, escopo ajustado ao que já foi entregue e perguntas abertas: `.planning/phases/06-observabilidade-suporte-e-polimento/` (`06-CONTEXT.md`, `06-QUESTIONS.md`).

---

## Progress

**Execution Order:**
Phases execute in numeric order, with Phase 2 allowed to overlap Phase 1 after role/security boundaries are clear.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Núcleo Supabase, Papéis e Governança | v1.0 Admin/Player Foundation | 3/3 | Complete    | 2026-05-24 |
| 2. Identidade Visual e Design System Onikara | v1.0 Admin/Player Foundation | 3/3 | Complete    | 2026-05-24 |
| 3. Área de Administração | v1.0 Admin/Player Foundation | 4/4 | Complete    | 2026-05-24 |
| 4. Área do Jogador | v1.0 Player MVP | 4/4 | Complete | 2026-10-10 |
| 5. Combate Interativo e Realtime | v1.0 Player MVP | 8/8 | Implemented (sem UAT formal) | 2026-10-10 |
| 6. Observabilidade, Suporte e Polimento | v1.0 Hardening | 0/5 | Planejada | - |
