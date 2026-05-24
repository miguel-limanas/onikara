# Phase 3: Área de Administração - Catálogos e Balanceamento - Research

**Data:** 2026-05-24  
**Status:** Completo  
**Fonte:** Contexto da Phase 3, schema Supabase existente, design system Onikara e consultas UI UX Pro Max.

## Resumo

A Phase 3 deve ser planejada como a primeira experiência administrativa real de Onikara. O caminho recomendado é uma aplicação web leve em HTML/CSS/JS puro com ES Modules, usando `@supabase/supabase-js` diretamente contra Auth/PostgREST/RPC/RLS. O Supabase já possui a base necessária: helpers de role, policies administrativas, tabelas de catálogo, tabelas versionadas de regras, views ativas e auditoria.

O planejamento deve preservar quatro blocos de entrega:

1. Portal/login + shell `/admin` protegido por role.
2. Camada de API Supabase JS para auth, catálogos, regras, auditoria e leitura de suporte.
3. CRUD administrativo de catálogos e relacionamentos de gameplay.
4. Telas de balanceamento, auditoria e suporte inicial.

## Pesquisa Supabase

### O que já existe

- `public.current_app_role()`, `public.has_app_role()`, `public.is_admin()` e `public.is_master()`.
- Policies RLS de leitura pública para catálogos.
- Policies RLS de escrita/admin para catálogos, regras e dados operacionais.
- `admin_audit_logs` com triggers em catálogos, relacionamentos e regras.
- RPCs `log_admin_permission_action` e `log_admin_support_action`.
- Tabelas principais para admin:
  - `rpg_classes`, `rpg_races`, `elements`, `status_effects`, `spells`, `items`, `enemies`, `quests`
  - `class_spells`, `enemy_spells`, `quest_steps`
  - `progression_rules`, `mana_rules`, `combat_rules`, `rarity_rules`, `loot_rules`
  - `profiles`, `inventory`, `equipment`, `character_quests`, `combat_sessions`, `combat_participants`, `combat_events`
  - `admin_audit_logs`
- Views públicas de regras ativas:
  - `active_progression_rules`
  - `active_mana_rules`
  - `active_combat_rules`
  - `active_rarity_rules`
  - `active_loot_rules`

### Implicações para planejamento

- CRUD simples de catálogos pode usar `.from(table).select/insert/update/delete`.
- Operações sensíveis devem ser planejadas como RPC ou guardadas para fases futuras.
- O cliente nunca deve usar `service_role`.
- Erros de RLS precisam virar mensagens amigáveis no admin: sem permissão, sessão expirada, dados inválidos, conflito de unicidade e violação de constraint.
- Campos `jsonb` exigem validação antes de salvar.

## Pesquisa UI UX Pro Max

### Design system recomendado

Consulta usada: `RPG admin dashboard dark fantasy operational Supabase tables forms --design-system`.

Resultado adaptado:

- Padrão: **Real-Time / Operations Landing** para entrada e status operacional.
- Estilo: **Dark Mode OLED**, adaptado ao preto institucional, carmesim e dourado velho do Onikara.
- Admin: interface densa, escaneável, com status colors para sucesso/alerta/erro.
- Tipografia operacional: sans/mono técnica para dados, preservando a serifada Onikara apenas para assinatura, títulos especiais e portal.
- Efeitos: glow mínimo, transições curtas, alta legibilidade e foco visível.

### Landing/login

Consulta usada: `enterprise gateway login landing authentication dark mode --domain landing`.

Padrão mais adequado:

- **Enterprise Gateway**
- Ordem recomendada: hero de missão/autoridade, prova/status, visão rápida do sistema, CTA/login.
- Para Onikara: portal institucional com logo, autenticação, status do sistema e seleção de contexto.
- O CTA principal da Phase 3 é entrar no admin quando o usuário tiver role adequada.

### Tabelas e formulários

Consulta usada: `admin forms tables responsive accessibility loading validation --domain ux`.

Regras relevantes:

- Tabelas em mobile devem usar wrapper com rolagem horizontal local ou layout em cards quando a leitura tabular quebrar.
- Formulários devem validar no blur e não apenas no submit.
- Operações assíncronas precisam de skeleton/spinner quando passarem de 300ms.
- Botões de submit devem desabilitar durante loading para evitar duplo envio.
- Inputs devem usar tipos corretos (`email`, `number`, etc.) e `autocomplete`.
- Fontes web devem usar `font-display: swap`.

## Exemplos Visuais Propostos

Os exemplos detalhados foram separados em `03-UI-EXAMPLES.md` para orientar execução. Eles cobrem:

- Portal/login Onikara como gateway operacional.
- Shell administrativo com navegação lateral e command toolbar.
- Dashboard operacional inicial.
- Tabela de catálogos com filtros, status e ações.
- Drawer/modal de formulário com validação inline.
- Editor de regras versionadas com JSON validado.
- Tela de auditoria.
- Tela de suporte em modo leitura/controlado.

## Riscos

- O projeto ainda não possui estrutura `src/`; a Phase 3 deve criar a primeira aplicação real sem extrapolar para framework.
- Auth real depende de configuração local Supabase e usuário com claim `app_role=admin`; execução deve documentar fallback/seed.
- JSON inválido pode corromper regras se não houver validação no cliente.
- Copiar os mockups literalmente pode cristalizar HTML exploratório em vez de componentes reutilizáveis.
- Suporte operacional mutável pode virar poder excessivo se não passar por RPCs auditadas.

## Recomendação de Plano

Criar quatro planos em ondas:

1. `03-01`: App shell, portal/login, Supabase client, guard admin e dashboard inicial.
2. `03-02`: CRUD de catálogos e relacionamentos principais.
3. `03-03`: Balanceamento e regras versionadas.
4. `03-04`: Auditoria, leitura de jogadores/sessões e suporte controlado inicial.

Cada plano deve incluir verificação de UI UX Pro Max: foco visível, estados loading/error/success, responsividade 375/768/1024/1440, labels reais, wrappers de tabela e proibição de `service_role` no cliente.

## RESEARCH COMPLETE
