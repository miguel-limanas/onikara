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

- [ ] **Phase 1: Núcleo Supabase, Papéis e Governança** - Formalizar Onikara no schema, roles administrativas, permissões RLS e contratos de dados para admin/player.
- [ ] **Phase 2: Identidade Visual e Design System Onikara** - Pesquisar identidade, definir tokens, componentes base e assets compartilhados para as duas áreas.
- [ ] **Phase 3: Área de Administração - Catálogos e Balanceamento** - Construir backoffice para configurar conteúdo e regras do RPG usando Supabase.
- [ ] **Phase 4: Área do Jogador - Perfil, Personagem e Progressão** - Construir a experiência inicial do jogador com criação/personagem/inventário/missões.
- [ ] **Phase 5: Combate Interativo e Realtime** - Implementar HUD de combate, eventos, ações por turno e sincronização com tabelas de combate.
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

- [ ] 01-02: Adicionar tabelas de configuração (`platform_settings`, `progression_rules`, `combat_rules`, `admin_audit_logs`) e seeds iniciais.

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03: Definir contratos de acesso Supabase JS para módulos compartilhados de admin e player.

### Phase 2: Identidade Visual e Design System Onikara

**Goal**: Definir a identidade visual da marca Onikara e criar um design system aplicável ao backoffice e à área de jogo.
**Mode**: ui
**Depends on**: Phase 1 pode rodar em paralelo parcial
**Requirements**: UIDB-01, identidade visual, acessibilidade

**Success Criteria**:

1. O nome Onikara aparece como marca principal do produto.
2. Tokens de cor, tipografia, espaçamento, radius, sombras, estados, raridades e elementos estão documentados.
3. Há distinção clara entre linguagem visual do admin e do player sem quebrar consistência de marca.
4. Componentes base têm estados de loading, empty, error, disabled, focus e success.
5. Contraste, touch targets e navegação por teclado são contemplados desde o início.

**Plans**:

- [ ] 02-01: Pesquisar direção visual Onikara e documentar moodboard textual, paleta, tipografia e princípios de marca.
- [ ] 02-02: Criar design tokens e componentes base: button, input, select, modal, tabs, table, badge, toast, stat bar e command/action toolbar.
- [ ] 02-03: Validar responsividade e acessibilidade dos componentes em admin e player.

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

- [ ] 03-01: Implementar shell do admin com navegação lateral, autenticação, proteção por role e dashboard operacional.
- [ ] 03-02: Implementar CRUD de catálogos de gameplay com tabelas filtráveis, formulários e validação.
- [ ] 03-03: Implementar telas de balanceamento: progressão, mana, combate, loot table, raridade e vínculos de desbloqueio.
- [ ] 03-04: Implementar visualização de jogadores, sessões de combate e ferramentas controladas de suporte.

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

- [ ] 04-01: Implementar autenticação, onboarding e criação de personagem.
- [ ] 04-02: Implementar painel do personagem, atributos, progressão e estado atual.
- [ ] 04-03: Implementar inventário, equipamentos, magias equipadas e missões.

### Phase 5: Combate Interativo e Realtime

**Goal**: Transformar as tabelas de combate em uma experiência de turno interativa para o jogador.
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: CMBT, ELEM, MANA, UIDB

**Success Criteria**:

1. Jogador inicia uma sessão de combate persistida em `combat_sessions`.
2. Participantes, turnos e eventos aparecem no HUD com atualização previsível.
3. Ações do jogador respeitam mana, cooldown, alvo, status e ordem de turno.
4. Eventos de combate são registrados em `combat_events`.
5. Vitória, derrota, recompensas e progressão atualizam o perfil do jogador.

**Plans**:

- [ ] 05-01: Implementar orquestração de combate usando `combat_sessions`, `combat_participants` e `combat_events`.
- [ ] 05-02: Implementar HUD de combate, ordem de turno, ações, cooldowns e log visual.
- [ ] 05-03: Integrar Realtime para eventos de combate e estados vivos quando necessário.
- [ ] 05-04: Persistir recompensas, XP, inventário e conclusão de missão ao fim do combate.

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

- [ ] 06-01: Implementar métricas operacionais e relatórios básicos de balanceamento.
- [ ] 06-02: Implementar auditoria visual, histórico de ações e suporte a recuperação de estados problemáticos.
- [ ] 06-03: Realizar revisão UI/UX, acessibilidade, responsividade e testes de fluxo completo.
- [ ] 06-04: Atualizar documentação de desenvolvimento, operação local e dados seed.

---

## Progress

**Execution Order:**
Phases execute in numeric order, with Phase 2 allowed to overlap Phase 1 after role/security boundaries are clear.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Núcleo Supabase, Papéis e Governança | v1.0 Admin/Player Foundation | 1/3 | In Progress|  |
| 2. Identidade Visual e Design System Onikara | v1.0 Admin/Player Foundation | 0/3 | Not started | - |
| 3. Área de Administração | v1.0 Admin/Player Foundation | 0/4 | Not started | - |
| 4. Área do Jogador | v1.0 Player MVP | 0/3 | Not started | - |
| 5. Combate Interativo e Realtime | v1.0 Player MVP | 0/4 | Not started | - |
| 6. Observabilidade, Suporte e Polimento | v1.0 Hardening | 0/4 | Not started | - |
