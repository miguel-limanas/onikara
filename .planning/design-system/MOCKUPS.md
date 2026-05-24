---
status: reference
created_at: 2026-05-24
source: mockups manuais criados no IDE
phase_usage:
  - Phase 3
  - Phase 4
---

# Mockups de Referência Onikara

Estes arquivos HTML são referências visuais exploratórias para orientar as próximas fases. Eles não substituem o contrato canônico do design system em `BRAND.md`, `INITIAL-KIT.md`, `tokens.css`, `components.css` e `preview.html`.

## Arquivos

| Arquivo | Uso previsto | Fase relacionada |
|---------|--------------|------------------|
| `.planning/design-system/onikara_landing.html` | Portal de entrada/login e direção de primeiro acesso. | Phase 3, Phase 4 |
| `.planning/design-system/onikara_admin.html` | Backoffice administrativo com catálogos, balanceamento, auditoria e configurações. | Phase 3 |
| `.planning/design-system/onikara_dashboard.html` | Dashboard do jogador com campanhas, progresso e entrada em sessões. | Phase 4 |

## Como Usar

- Usar os mockups para capturar intenção visual, hierarquia de informação, linguagem e densidade de tela.
- Ao implementar telas reais, migrar estilos para tokens e componentes compartilhados sempre que possível.
- Preservar a separação entre login/portal, admin e player como experiências distintas.
- Tratar textos, números e dados dos mockups como fictícios até que sejam ligados ao Supabase.

## Cuidados de Implementação

- Substituir emojis e símbolos soltos por ícones consistentes quando as telas forem implementadas.
- Garantir `aria-label`, foco visível, labels reais e navegação por teclado em todos os controles interativos.
- Validar responsividade em 375px, 768px, 1024px e 1440px.
- Evitar rolagem horizontal global; tabelas devem rolar dentro de wrappers dedicados.
- Revisar contraste, motion e `prefers-reduced-motion` antes de promover qualquer padrão para o produto.
