# Hipóteses - Primeira experiência navegável

## Metadados

- **Feature:** [knowledge/product/features/first-navigable-experience.md](../knowledge/product/features/first-navigable-experience.md)
- **Status:** active
- **Responsável:** Fundador/criador
- **Última atualização:** 2026-05-24

## Valor

### H-V1: Um slice navegável admin/player é o próximo melhor passo de validação

- **Origem:** proativa
- **Confiança:** alta
- **Evidências a favor:**
  - O fundador identificou a próxima grande aposta como transformar a visão em uma experiência navegável e testável com fluxo player, fluxo admin/mestre, missões, cadastro de caçador/Oni e primeira experiência real de plataforma. `(chat, no artifact)`
  - As áreas de produto do roadmap já definem experiências admin e player como as duas superfícies principais. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Nenhum usuário externo validou a sequência ainda. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - É preciso decidir o menor fluxo que prova valor sem exigir todos os sistemas de combate/conteúdo.
- **Teste:** Construir um slice navegável fino e rodar playtests baseados em tarefas.
- **Gatilho de decisão:** Promover se testers conseguirem completar o slice e articular por que continuariam explorando.
- **Resolução:** Pendente.

## Usabilidade

### H-U1: Pontos de entrada player e admin/mestre precisam ser compreensíveis sem explicação

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O produto separa explicitamente administração de interação player. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- **Evidências contra:**
  - O enquadramento "mestre/admin" pode ser novo e precisa de validação. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - "Mestre" é papel de produto, título narrativo ou feature futura?
- **Teste:** Teste de primeiro clique para cada ponto de entrada.
- **Gatilho de decisão:** Promover se testers entenderem seu papel e próxima ação em menos de um minuto.
- **Resolução:** Pendente.

## Viabilidade técnica

### H-F1: O primeiro slice navegável pode ser construído como MVP vertical entre Supabase, UI e estado de domínio

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - O fluxo de implementação prefere slices verticais e evitar infraestrutura genérica antes que um fluxo real a use. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Evidências contra:**
  - O slice depende de várias áreas de fase: fundação Supabase, identidade/design system, UI admin/player e estado de missão/player. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Perguntas abertas / ressalvas:**
  - Precisa de slicing cuidadoso para evitar iniciar acidentalmente as Fases 3/4/5 de uma vez.
- **Teste:** Definir uma jornada com fronteiras explícitas de dentro/fora de escopo antes da implementação.
- **Gatilho de decisão:** Promover se uma jornada for entregue sem expandir para o escopo completo da plataforma.
- **Resolução:** Pendente.

## Viabilidade de negócio

### H-Vi1: Early playtests can validate direction before scale, revenue, or public launch

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - Current scale is zero public users, no revenue, solo/small team, and prototype-to-MVP stage. `(chat, no artifact)`
- **Evidências contra:**
  - Early friendly playtests may overestimate broader appeal. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Label early evidence as directional until it includes repeated independent testers.
- **Teste:** Rodar playtests pequenos com tags de tipo de participante e preservar notas em `source/interviews/`.
- **Gatilho de decisão:** Promover apenas após sinais repetidos de testers semelhantes ao público-alvo.
- **Resolução:** Pendente.

## Outros riscos

### H-O1: MVP scope may expand faster than validation

- **Origem:** proativa
- **Confiança:** alta
- **Evidências a favor:**
  - Founder explicitly listed avoiding systems too complex before MVP as off-limits. `(chat, no artifact)`
  - O roadmap contém muitos sistemas ricos em admin, player, combate, suporte e identidade. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - O fluxo de implementação inclui gates para incrementos pequenos, critérios de aceitação e verificação. [source/planning/IMPLEMENTATION_FLOW.md](../source/planning/IMPLEMENTATION_FLOW.md)
- **Perguntas abertas / ressalvas:**
  - Each slice should name what is not being built.
- **Teste:** Require out-of-scope list before implementation plans.
- **Gatilho de decisão:** Promover se o primeiro slice navegável continuar pequeno e testável.
- **Resolução:** Pendente.
