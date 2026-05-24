# Hipóteses - Primeiro viewport operacional

## Metadados

- **Feature:** [knowledge/product/features/first-operational-viewport.md](../knowledge/product/features/first-operational-viewport.md)
- **Status:** active
- **Responsável:** Fundador/criador
- **Última atualização:** 2026-05-24

## Valor

### H-V1: O primeiro viewport pode comunicar a premissa de Onikara antes de existir gameplay completo

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - O trabalho de sketch existente explora o primeiro viewport operacional Oni e modos admin/player/mestre. [source/planning/sketches/001-primeiro-viewport-operacional-oni/README.md](../source/planning/sketches/001-primeiro-viewport-operacional-oni/README.md)
  - O fundador quer que a direção transmita suspense, estratégia, identidade premium e vontade de explorar. `(chat, no artifact)`
- **Evidências contra:**
  - Nenhum tester validou o viewport ainda. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - A beautiful first viewport is not enough if users cannot infer what actions exist.
- **Teste:** Ask testers what they think Onikara is, what role they are in, and what they would click next.
- **Gatilho de decisão:** Promover se at least three target testers infer the core premise and next action without explanation.
- **Resolução:** Pendente.

## Usabilidade

### H-U1: O enquadramento de modos admin/player/mestre reduzirá ambiguidade

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - O roadmap separa `/admin`, `/play`, `/auth` e camadas compartilhadas. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Rótulos de modo no primeiro viewport podem adicionar carga cognitiva se aparecerem cedo demais. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - É preciso decidir se "mestre" é um papel visível, uma camada de sabor ou sinônimo de admin.
- **Teste:** Compare mode labels in sketch review.
- **Gatilho de decisão:** Promover se users can explain the difference between player and admin/master.
- **Resolução:** Pendente.

## Viabilidade técnica

### H-F1: A static sketch can be converted into a navigable prototype without waiting for full backend

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - Current sketch artifacts already exist as HTML/CSS under `.planning/sketches`. [source/planning/sketches/MANIFEST.md](../source/planning/sketches/MANIFEST.md)
- **Evidências contra:**
  - Persistent flows still depend on Supabase governance and contracts. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Perguntas abertas / ressalvas:**
  - Use fake/demo state only where it does not imply shipped functionality.
- **Teste:** Convert the winning sketch into a small navigable prototype with clear demo-state labels.
- **Gatilho de decisão:** Promover se prototype can support review/playtest without backend coupling.
- **Resolução:** Pendente.

## Viabilidade de negócio

### H-Vi1: A validação do primeiro viewport deve acontecer antes de uma grande implementação de UI

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O fluxo de implementação pergunta qual problema/oportunidade está sendo atacado e qual é o menor incremento testável antes de codar features grandes. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Evidências contra:**
  - Too much sketching could delay functional MVP work. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Timeboxar a revisão de sketches e rotear resultados de volta para as Fases 2/3/4.
- **Teste:** Rodar uma revisão estruturada e tomar uma decisão.
- **Gatilho de decisão:** Promover se review changes or confirms the first navigable experience scope.
- **Resolução:** Pendente.

## Outros riscos

### H-O1: Storytelling may become decorative instead of operational

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O fundador quer storytelling, tom estratégico e conceito de sistema operacional, não só styling superficial. `(chat, no artifact)`
- **Evidências contra:**
  - O roadmap conecta direção de UI a fluxos admin/player concretos. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Perguntas abertas / ressalvas:**
  - Every lore label should help the user understand role, state, or consequence.
- **Teste:** During review, ask which text helps action vs. which is merely flavor.
- **Gatilho de decisão:** Promover se o enquadramento narrativo do viewport melhorar a orientação.
- **Resolução:** Pendente.
