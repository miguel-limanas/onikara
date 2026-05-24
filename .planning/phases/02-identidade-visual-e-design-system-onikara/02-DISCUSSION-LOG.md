# Phase 2: Identidade Visual e Design System Onikara - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 2-Identidade Visual e Design System Onikara
**Areas discussed:** Marca e tom, Modos e UI, Tokens e componentes, Master na identidade

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Todas | Cobre marca, modos, tokens e componentes para deixar o contexto forte antes do planejamento. | yes |
| Marca e tom | Foca na sensacao Onikara: sistema de contencao, dark fantasy, anime contido, linguagem operacional. | |
| Modos e UI | Foca em como admin, player e master compartilham a marca sem virar tres produtos diferentes. | |
| Tokens e componentes | Foca em cor, tipografia, radius, raridade, elementos, estados e componentes base. | |

**User's choice:** Todas.
**Notes:** Usuario tambem informou o logotipo oficial da marca.

---

## Marca e Tom

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Como o logo deve ser tratado dentro da UI? | Selo institucional; simbolo ritual/ameaca; hibrido por contexto | Selo institucional |
| Qual deve ser a paleta base? | Preto/osso/vermelho oni; grafite/vermelho/dourado velho; preto frio/vermelho/cinza tecnico | Preto, carmesim e dourado velho |
| Qual tipografia deve guiar o sistema? | Serifada de marca + sans operacional; sans tecnica; serifada dramatica | Serifada de marca + sans operacional |
| Como os assets visuais devem ser produzidos? | Kit minimo oficial; kit expandido ritual; so tokens | Kit minimo oficial |

**User's choice:** Logo institucional, paleta preto/carmesim/dourado velho, serifada da marca com sans operacional, kit minimo oficial.
**Notes:** Usuario corrigiu a paleta: substituir grafite por preto e vermelho por carmesim. Usuario informou que o logo oficial esta em `.planning/sketches/onikara-logotipo.png`.

---

## Modos e UI

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Como admin, player e master devem se diferenciar? | Mesma estrutura/intensidade diferente; tres modos bem distintos; um unico shell | Tres modos bem distintos |
| Qual navegacao deve ser a base inicial? | Entradas separadas por rota; seletor global; portal comum + shells separados | Portal comum + shells separados |
| Como deve ser a linguagem visual do admin? | Backoffice de contencao; painel premium minimalista; central de comando cinematografica | Painel premium minimalista |
| Como deve ser a linguagem visual do player? | HUD de cacador registrado; RPG anime dark fantasy; dossie narrativo | HUD de cacador registrado |

**User's choice:** Tres modos distintos, portal comum com shells separados, admin premium minimalista, player como HUD de cacador registrado.
**Notes:** Usuario inicialmente escolheu central cinematografica para admin, depois corrigiu para painel premium minimalista.

---

## Tokens e Componentes

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Como os tokens de cor devem ser organizados? | Semanticos por funcao/lore; so visuais; dois niveis | Dois niveis |
| Quais componentes base sao obrigatorios? | Base operacional completa; base minima; base visual + HUD | Base operacional completa |
| Como deve ser a documentacao/entrega? | Markdown + CSS tokens + HTML preview; so Markdown; mini Storybook caseiro | Markdown + CSS tokens + HTML preview |
| Nivel minimo de acessibilidade? | Checklist essencial; auditoria mais pesada; so diretrizes | Auditoria mais pesada |

**User's choice:** Dois niveis de tokens, base operacional completa, Markdown + CSS tokens + HTML preview, auditoria de acessibilidade mais pesada.
**Notes:** Usuario perguntou o que sao tokens; foi explicado que tokens sao valores oficiais do design system, usados por componentes via nomes reutilizaveis.

---

## Master na Identidade

| Question | Options considered | Selected |
|----------|--------------------|----------|
| Como deve ser a presenca visual do master? | Console de narrador operacional; mesa ritualistica; diretor tatico | Console de narrador operacional + diretor tatico |
| Master pode editar ficha de jogadores da campanha? | Visualizar apenas; editar campos narrativos; editar ficha dentro da campanha | Visualizar apenas |
| Como o preview HTML deve mostrar o master? | Terceiro modo completo; apenas tokens/badges; nota conceitual | Terceiro modo completo |

**User's choice:** Master como regente da campanha criada por ele, com console narrativo e tatico, acesso a arquivos/cenas/mobs/espacos da campanha e fichas em leitura.
**Notes:** Usuario esclareceu que master nao tem permissoes para alterar software/backend, rege apenas campanha criada por ele, controla mobs, espacos, cenario e acessa fichas dos jogadores da campanha. Fichas sao somente leitura para o master.

---

## the agent's Discretion

- Nomear tokens CSS finais desde que mantenham os niveis base e semantico.
- Escolher a sans operacional e a serifada mais proxima do wordmark oficial, se a fonte exata nao estiver disponivel.
- Estruturar o preview HTML, desde que admin, player e master aparecam como modos separados e validaveis.

## Deferred Ideas

- Permissoes reais de campanha para master.
- Ferramentas completas de campanha, cenas, mobs e espacos.
- Efeitos reais de campanha sobre fichas.
- Kit expandido ritual com padroes, selos, texturas e ornamentos.
