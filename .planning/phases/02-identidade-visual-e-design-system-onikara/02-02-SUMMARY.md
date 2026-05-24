---
phase: 02-identidade-visual-e-design-system-onikara
plan: 02
status: concluído
completed_at: 2026-05-24
subsystem: design-system-css-preview
tags:
  - tokens
  - componentes
  - preview
  - admin
  - player
  - master
provides:
  - tokens CSS de dois níveis
  - biblioteca base de componentes
  - preview estático dos três modos
requirements_completed:
  - UIDB-01
  - identidade visual
---

# Resumo 02-02: Tokens, Componentes e Preview

## Concluído

- Criado `.planning/design-system/tokens.css` com tokens base e aliases semânticos para interface, estados, recursos de RPG, raridades, elementos e modos.
- Criado `.planning/design-system/components.css` com estilos para botão, input, select, modal, tabs, tabela, badge, toast, barra de status e toolbar.
- Criado `.planning/design-system/preview.html` como página estática em PT-BR, vinculando `tokens.css` e `components.css`.
- Incluídos previews de admin, player e master, com o master descrito como regente de campanha e com fichas de jogadores em modo somente leitura.
- Revisado o preview para representar o fluxo correto: autenticação por ID/login, seleção de contexto registrado e abertura isolada do shell correspondente.
- Adicionados exemplos de aplicação do logotipo e uma composição tipográfica com Cinzel Decorative/Cinzel, caixa alta, espaçamento amplo e losangos nos `A`.

## Decisões Capturadas

- Tokens seguem dois níveis: valores base (`--oni-*`) e aliases semânticos (`--color-*`, `--mode-*`).
- Componentes usam variáveis CSS semânticas sempre que possível.
- O modo master mostra campanha, cena, mobs, mapa/ambiente e fichas de jogadores em leitura, sem controles de administração da plataforma.
- Textos humanos do preview seguem português brasileiro com acentuação e norma culta, preservando classes, tokens e nomes técnicos em inglês.
- `/admin`, `/player` e `/master` não devem aparecer como fichas simultâneas; eles são destinos isolados após seleção de contexto.

## Verificação

- `rg -n -- "--oni-black|--oni-crimson|--oni-gold|--color-surface|--color-hp|--color-mana|--color-rarity-legendary|--mode-master|prefers-reduced-motion" .planning/design-system/tokens.css`
- `rg -n 'ok-button|ok-input|ok-select|ok-modal|ok-tabs|ok-table|ok-badge|ok-toast|ok-stat-bar|ok-toolbar|focus-visible|is-loading|is-error|is-success|\[data-mode="master"\]' .planning/design-system/components.css`
- `rg -n 'tokens.css|components.css|Onikara|data-mode="admin"|data-mode="player"|data-mode="master"|Somente leitura|Campanha|Cena|Mobs|Fichas dos jogadores|ok-button|ok-table|ok-stat-bar|ok-toolbar' .planning/design-system/preview.html`
- `Test-Path .planning/design-system/tokens.css; Test-Path .planning/design-system/components.css; Test-Path .planning/design-system/preview.html`

Todos os checks estruturais passaram. A inspeção visual em navegador ainda será consolidada na revisão de acessibilidade do plano 02-03.
