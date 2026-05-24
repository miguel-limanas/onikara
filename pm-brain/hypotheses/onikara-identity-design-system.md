# Hypotheses — Onikara identity and design system

## Metadados

- **Feature:** [knowledge/product/features/onikara-identity-design-system.md](../knowledge/product/features/onikara-identity-design-system.md)
- **Status:** active
- **Responsável:** Fundador/criador
- **Última atualização:** 2026-05-24

## Valor

### H-V1: A dark fantasy/Oni/tactical identity will make Onikara more memorable than generic RPG tooling

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O nome escolhido e o território visual enfatizam máscaras Oni, brasas, metal escuro, selos/runas, magia elemental e consequência tática. [source/planning/BRANDING_IDEAS.md](../source/planning/BRANDING_IDEAS.md)
  - O fundador explicitamente quer evitar execução genérica de SaaS e anime. `(chat, no artifact)`
- **Evidências contra:**
  - Nenhum usuário externo validou a direção de marca ainda. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - A identidade precisa funcionar tanto em interfaces admin densas quanto em telas player mais expressivas.
- **Teste:** Rodar revisão de sketches com testers-alvo quando as variantes do primeiro viewport estiverem prontas.
- **Gatilho de decisão:** Promover se testers describe the experience as tactical, premium, suspenseful, and worth exploring.
- **Resolução:** Pendente.

## Usabilidade

### H-U1: Separate admin/player visual modes can preserve clarity without splitting the brand

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O roadmap pede UI admin sóbria e densa e UI player mais expressiva sob uma única identidade Onikara. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Nenhum design system implementado provou ainda o modelo de tokens compartilhados. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Components need accessibility, focus, loading, empty, error, disabled, and success states from the start.
- **Teste:** Validar o mesmo conjunto de tokens/componentes em uma tela admin e uma tela player.
- **Gatilho de decisão:** Promover se both screens feel related but optimized for their tasks.
- **Resolução:** Pendente.

## Viabilidade técnica

### H-F1: O projeto consegue definir estrutura suficiente de design system antes de existir gameplay completo

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - Os planos da Fase 2 incluem tokens e componentes base antes da implementação de UI das Fases 3/4. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Gameplay and admin workflows may reveal missing states/tokens later. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Evitar overdesign de componentes antes de existirem fluxos reais.
- **Teste:** Construir apenas componentes necessários para os primeiros slices admin/player.
- **Gatilho de decisão:** Promover se os tokens/componentes iniciais sobreviverem às Fases 3/4 sem grande retrabalho.
- **Resolução:** Pendente.

## Viabilidade de negócio

### H-Vi1: Strong identity is worth prioritizing early because first impression is a core validation target

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O fundador quer medir suspense, estratégia, sensação premium, vontade de explorar e clareza para novos usuários. `(chat, no artifact)`
- **Evidências contra:**
  - Identity work does not by itself validate retention or gameplay depth. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Validação visual precisa vir junto de validação de tarefas navegáveis.
- **Teste:** Pair visual review with task-based first viewport/navigation tests.
- **Gatilho de decisão:** Promover se visual identity improves comprehension and motivation without hurting task clarity.
- **Resolução:** Pendente.

## Outros riscos

### H-O1: O produto pode derivar para SaaS genérico ou anime estilizado demais

- **Origem:** proativa
- **Confiança:** alta
- **Evidências a favor:**
  - Founder named this as a current high-friction product-definition risk. `(chat, no artifact)`
- **Evidências contra:**
  - Current roadmap explicitly encodes separate admin and player UI direction. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Perguntas abertas / ressalvas:**
  - Maintain a checklist in design reviews for "not generic SaaS" and "not anime at the cost of strategy".
- **Teste:** Adicionar esses pontos como critérios de revisão durante a Fase 2.
- **Gatilho de decisão:** Promover se repeated reviews catch and correct drift.
- **Resolução:** Pendente.
