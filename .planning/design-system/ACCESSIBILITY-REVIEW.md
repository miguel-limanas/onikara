# Revisão de Acessibilidade do Design System Onikara

## Escopo

Esta revisão cobre os artefatos estáticos da Fase 2:

- `.planning/design-system/tokens.css`
- `.planning/design-system/components.css`
- `.planning/design-system/preview.html`

O objetivo é validar se os tokens, componentes base e previews de admin, player e master oferecem uma fundação segura para implementação futura de UI.

## Referência de Padrão

A revisão adota práticas compatíveis com WCAG 2.2 em nível AA quando aplicáveis ao escopo estático atual.

Os critérios observados incluem:

- contraste suficiente entre texto, superfície e estados;
- foco visível em controles interativos;
- rótulos reais ou nomes acessíveis;
- alvos de toque com pelo menos 44px nos controles primários;
- estados de erro, sucesso, carregamento e desabilitado;
- navegação por teclado em controles demonstrados;
- respeito a `prefers-reduced-motion`.

## Matriz de Testes Manuais

| Item | Verificação | Status |
|------|-------------|--------|
| button | Possui foco visível, estado normal, loading, erro, sucesso e disabled. | Passou |
| input | Possui `label`, foco visível, estado de erro e suporte a disabled via CSS. | Passou |
| select | Possui `label`, foco visível e área mínima de interação. | Passou |
| modal | Usa bloco focado de conteúdo com botão de ação nomeado. | Passou |
| tabs | Usa `role="tablist"`, `role="tab"`, `aria-selected` e botões alcançáveis por teclado. | Passou |
| table | Usa `table`, `thead`, `tbody`, `th` e wrapper com rolagem horizontal controlada. | Passou |
| badge | Usa texto visível para raridade e estado. | Passou |
| toast | Usa texto visível e estado de sucesso/erro por classe. | Passou |
| stat bar | Exibe valores de HP e mana em texto, não apenas por cor. | Passou |
| toolbar | Possui `aria-label` no grupo e nomes acessíveis nos botões. | Passou |
| admin preview | Mantém leitura administrativa densa, com tabela e status legíveis. | Passou |
| player preview | Exibe personagem, HP, mana, status e inventário com texto visível. | Passou |
| master preview | Exibe campanha, cena, mobs, ambiente e fichas de jogadores em modo somente leitura. | Passou |

## Navegação por Teclado

Os principais elementos interativos do preview são elementos nativos (`button`, `input` e `select`), portanto entram naturalmente na ordem de tabulação do navegador.

Os tabs são representados como botões com `role="tab"` e `aria-selected`. Como não há JavaScript nesta fase, a troca dinâmica de painel não é implementada; o objetivo aqui é validar estrutura visual e estados básicos.

O CSS define foco visível para:

- `.ok-button:focus-visible`
- `.ok-input:focus-visible`
- `.ok-select:focus-visible`
- `.ok-tab:focus-visible`
- `.ok-toolbar__action:focus-visible`

## Contraste e Cor

A interface usa preto como base institucional, texto claro para leitura e carmesim/dourado velho como acentos. A orientação do design system é não usar carmesim ou dourado velho em textos longos.

HP, mana, raridade e estados não dependem apenas de cor: o preview também mostra rótulos e valores textuais, como `HP`, `Mana`, `Raro`, `Lendário`, `Salvo`, `Rejeitado` e `Somente leitura`.

## Alvos de Toque

Controles primários usam no mínimo:

- `min-height: 44px`
- `min-width: 44px`

Isso cobre botões, inputs, selects, tabs e ações de toolbar. Badges e indicadores não são tratados como controles primários nesta fase.

## Movimento Reduzido

`tokens.css` inclui `@media (prefers-reduced-motion: reduce)` e reduz os tokens de movimento para `1ms` com easing linear.

Componentes usam os tokens `--motion-fast` e `--motion-ease`, portanto herdam a redução de movimento sem exigir alterações adicionais em cada componente.

## Checks Responsivos

`components.css` inclui:

- `overflow-x: hidden` no corpo do preview para evitar vazamento lateral global;
- `overflow-x: auto` em wrappers de tabela para preservar leitura em telas estreitas;
- `@media (max-width: 780px)` para reduzir largura útil, empilhar grids e adaptar cabeçalho/logotipo.

Os modos admin, player e master usam a mesma grade responsiva e devem empilhar em viewport estreita.

## Limitações Conhecidas

- Esta revisão é estrutural e manual, sem execução de ferramenta automatizada como axe ou Lighthouse.
- O preview é estático; tabs e modal não possuem comportamento JavaScript real nesta fase.
- A validação fina de contraste numérico deve ser refeita quando as telas reais forem implementadas sobre estes tokens.
- A fonte exata do wordmark oficial não foi identificada; a serifada declarada é uma aproximação segura por fallback do sistema.

## Critérios de Passagem

Considera-se que a Fase 2 passa pela revisão de acessibilidade quando:

- todos os componentes base aparecem no preview;
- controles possuem rótulos reais ou nomes acessíveis;
- foco visível está presente;
- alvos primários de interação respeitam 44px;
- estados disabled, error, loading e success aparecem;
- os modos admin, player e master são cobertos pela matriz manual;
- `prefers-reduced-motion` está presente nos tokens;
- as limitações foram documentadas explicitamente.

Status: passou para uso como fundação de design system da Fase 2.
