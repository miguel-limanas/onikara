---
phase: 02-identidade-visual-e-design-system-onikara
plan: 01
status: concluído
completed_at: 2026-05-24
subsystem: design-system-brand
tags:
  - marca
  - logotipo
  - assets
  - design-system
provides:
  - guia de marca Onikara
  - inventário mínimo do kit de assets
  - cópia do logotipo oficial para previews do design system
requirements_completed:
  - identidade visual
---

# Resumo 02-01: Fundação de Marca Onikara

## Concluído

- Criado `.planning/design-system/BRAND.md` com fonte oficial do logotipo, personalidade da marca, direção de cores, direção tipográfica, expressão por modo, regras de uso do logotipo, orientações de faça/não faça e limites de escopo.
- Criado `.planning/design-system/assets/README.md` com o inventário do kit mínimo de assets e nomes necessários para derivações futuras.
- Copiado `.planning/sketches/onikara-logotipo.png` para `.planning/design-system/assets/onikara-logotipo.png`.

## Decisões Capturadas

- A fonte canônica do logotipo permanece `.planning/sketches/onikara-logotipo.png`.
- O logotipo é tratado como selo institucional, não como decoração de fundo.
- A paleta base é preto, carmesim e dourado velho; grafite atua apenas como neutro técnico de apoio.
- A direção tipográfica usa serifada de marca para identidade/autoridade e sans operacional para UI densa.
- Admin, player e master são modos visuais de primeira classe já na Fase 2.

## Verificação

- `rg -n "Logotipo Oficial|onikara-logotipo.png|preto|carmesim|dourado velho|Admin|Player|Master|selo institucional" .planning/design-system/BRAND.md`
- `Test-Path .planning/design-system/assets/onikara-logotipo.png`
- `rg -n "onikara-symbol.png|onikara-logo-mono.png|favicon.png|app-icon.png|fonte de verdade|monocromático|símbolo isolado" .planning/design-system/assets/README.md`

Todos os checks passaram.
