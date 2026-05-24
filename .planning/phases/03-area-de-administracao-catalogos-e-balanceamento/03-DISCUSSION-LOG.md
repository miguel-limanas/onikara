# Phase 3: Area de Administracao - Catalogos e Balanceamento - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 3-Area de Administracao - Catalogos e Balanceamento
**Areas discussed:** Escopo integrado da fase, API Supabase, login/landing, admin UI, mockups canonicos

---

## Escopo Integrado da Fase

| Option | Description | Selected |
|--------|-------------|----------|
| Admin CRUD only | Implementar apenas tabelas/formularios administrativos, deixando login/landing e API para fases separadas. | |
| Admin + Supabase API + Login/Landing | Incluir a camada real de acesso Supabase, portal/login e shell administrativo como entrega coesa da Phase 3. | x |
| Static UI first | Criar telas visuais primeiro, sem conexao completa com Supabase. | |

**User's choice:** Incluir todo o desenvolvimento de API com Supabase e considerar login + landing e admin.
**Notes:** A Phase 3 foi consolidada como a primeira experiencia administrativa real, nao apenas mockup ou CRUD isolado.

---

## API Supabase

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase JS direto com RLS | Usar PostgREST/RPC via Supabase JS, preservando Auth, policies, auditoria e contratos da Phase 1. | x |
| Backend proprio completo | Criar API propria entre frontend e Supabase desde ja. | |
| Service role no cliente | Expor permissao elevada no navegador para simplificar escrita administrativa. | |

**User's choice:** Desenvolver API com Supabase.
**Notes:** A decisao foi interpretada conforme a arquitetura do projeto: Supabase JS + RLS + RPCs para acoes sensiveis; `service_role` permanece proibido no cliente.

---

## Login e Landing

| Option | Description | Selected |
|--------|-------------|----------|
| Portal Onikara real | Implementar landing/login como entrada oficial, com Auth, sessao e roteamento para contexto admin. | x |
| Login minimo tecnico | Tela simples de email/senha sem linguagem visual forte. | |
| Adiar login | Trabalhar admin com dados locais e proteger acesso depois. | |

**User's choice:** Considerar o mockup de login + landing.
**Notes:** `.planning/design-system/onikara_landing.html` foi registrado como referencia canonica para esta parte da fase.

---

## Admin UI

| Option | Description | Selected |
|--------|-------------|----------|
| Seguir UI UX Pro Max + Design System | Usar tokens/componentes Onikara e checklist UI UX Pro Max para tabelas, formularios, estados, acessibilidade e responsividade. | x |
| Copiar mockup literalmente | Reproduzir o HTML exploratorio sem transformar em componentes/tokens reais. | |
| Criar estilo novo | Ignorar o kit de Phase 2 e redesenhar a administracao. | |

**User's choice:** UI com UI UX Pro Max e considerar o mockup admin.
**Notes:** `.planning/design-system/onikara_admin.html`, `INITIAL-KIT.md`, `BRAND.md`, `tokens.css` e `components.css` foram promovidos a referencias obrigatorias.

---

## Mockups Canonicos

| Option | Description | Selected |
|--------|-------------|----------|
| Landing + Admin como referencias principais | Usar landing/login e admin como guias de Phase 3; dashboard player apenas como separacao visual. | x |
| Todos os mockups entram na Phase 3 | Incluir tambem funcionalidades do dashboard/player dentro da fase administrativa. | |
| Mockups apenas inspiracionais | Nao trata-los como referencias de planejamento. | |

**User's choice:** Considerar o mockup de login + landing e admin.
**Notes:** O dashboard do jogador ficou explicitamente fora do escopo funcional da Phase 3 para evitar puxar Phase 4 para dentro do admin.

---

## the agent's Discretion

- Definir estrutura final de pastas e modulos JS.
- Escolher granularidade dos primeiros formularios conforme schema real.
- Decidir entre SPA estatica simples ou paginas HTML/JS separadas, desde que login -> admin seja real e testavel.
- Criar componentes auxiliares pequenos quando o kit inicial nao cobrir a necessidade.

## Deferred Ideas

- Experiencia completa do jogador em `/play`.
- HUD de combate e Realtime.
- Modo master/campanhas.
- Metricas avancadas e suporte operacional amplo.
