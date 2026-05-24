# Fluxo de Implementação Onikara

Este fluxo define como decidimos, especificamos e implementamos trabalho neste projeto. Ele combina o planejamento GSD já usado em `.planning/` com as PM skills instaladas de `phuryn/pm-skills`.

## Objetivo

Evitar começar uma implementação grande sem responder três perguntas:

1. Qual problema ou oportunidade estamos atacando?
2. Qual é o menor incremento jogável/operável que prova valor?
3. Como vamos saber que ficou pronto?

## Fluxo Padrão

### 1. Enquadrar a oportunidade

Use quando uma ideia ainda está aberta, grande ou ambígua.

Entradas:

- Ideia, dor, feature desejada ou fase do roadmap.
- Contexto atual de `.planning/PROJECT.md`, `.planning/ROADMAP.md` e schema Supabase.

Skills úteis:

- `opportunity-solution-tree`
- `identify-assumptions-new` ou `identify-assumptions-existing`
- `prioritize-assumptions`
- `user-personas`
- `customer-journey-map`

Saídas esperadas:

- Oportunidade descrita em uma frase.
- Hipóteses críticas.
- Usuário alvo: jogador, administrador ou operador.
- Critério para decidir se vale seguir.

### 2. Definir o incremento

Use para transformar a oportunidade em escopo implementável.

Skills úteis:

- `create-prd`
- `job-stories`
- `user-stories`
- `prioritize-features`
- `test-scenarios`

Saídas esperadas:

- Job story ou user story principal.
- Escopo MVP.
- Fora de escopo explícito.
- Critérios de aceite verificáveis.
- Cenários de teste/UAT.

Regra do projeto:

- Cada incremento deve tocar uma trilha principal: `admin`, `player`, `database`, `combat`, `identity/design-system` ou `operations`.
- Se o incremento alterar dados persistidos, ele precisa declarar impacto em migrations, seed, RLS e contratos Supabase JS.

### 3. Planejar execução

Use para converter o incremento em planos GSD.

Skills úteis:

- GSD: `gsd-discuss-phase`, `gsd-plan-phase`, `gsd-ui-phase`, `gsd-ai-integration-phase` quando aplicável.
- PM: `pre-mortem`, `stakeholder-map`, `sprint-plan`.

Saídas esperadas:

- Fase ou plano em `.planning/ROADMAP.md`.
- Plano detalhado em diretório de fase quando o trabalho for grande.
- Riscos e decisões registrados.
- Ordem de execução com dependências.

Checklist mínimo antes de codar:

- Segurança/RLS entendida quando houver Supabase.
- UI states definidos quando houver frontend.
- Dados de seed pensados quando houver catálogo ou conteúdo.
- Testes ou verificação manual definidos.

### 4. Implementar verticalmente

Use para construir o menor caminho ponta a ponta.

Sequência preferida:

1. Contratos e dados: migration, seed, tipos/helpers de acesso.
2. Regras de domínio: validações, cálculos, permissões, fluxos.
3. Interface: tela real, estados de loading/empty/error/success, responsividade.
4. Verificação: testes, reset Supabase, UAT e revisão visual quando aplicável.

Regra do projeto:

- Preferir slices verticais que deixem algo usável, mesmo pequeno.
- Evitar criar infraestrutura genérica antes de existir um fluxo real usando ela.
- O admin deve privilegiar densidade, auditoria e eficiência.
- O player deve privilegiar clareza de estado, feedback e decisão tática.

### 5. Validar e fechar

Use antes de marcar planos como concluídos.

Skills úteis:

- `test-scenarios`
- `retro`
- `release-notes`
- `metrics-dashboard`
- GSD: `gsd-verify-work`, `gsd-code-review`, `gsd-ui-review`, `gsd-audit-uat`.

Saídas esperadas:

- Evidência de teste ou verificação manual.
- Critérios de aceite marcados.
- Bugs ou débitos registrados.
- Roadmap/STATE atualizados quando o escopo mudar.

## Portões de Decisão

### Pode entrar no roadmap

- Tem usuário alvo claro.
- Tem valor ou risco validável.
- Cabe em uma fase existente ou justifica uma nova.
- Não conflita com decisões ativas do projeto.

### Pode entrar em implementação

- Tem critério de aceite.
- Tem impacto técnico mapeado.
- Tem caminho de verificação.
- Tem escopo pequeno o bastante para terminar sem perder o fio.

### Pode ser considerado pronto

- Funciona no fluxo real do usuário alvo.
- Persistência, permissões e seeds foram verificados quando aplicável.
- UI foi checada em desktop e mobile quando aplicável.
- Documentação/planning foram atualizados se a decisão mudou.

## Aplicação Imediata ao Roadmap Atual

Para as próximas fases do Onikara:

- Phase 1 deve usar `create-prd`, `test-scenarios` e `pre-mortem` para fechar roles, RLS, auditoria e contratos Supabase.
- Phase 2 deve usar `value-proposition`, `positioning-ideas`, `user-personas` e `customer-journey-map` para alinhar identidade visual com admin e player.
- Phase 3 deve usar `job-stories`, `prioritize-features` e `metrics-dashboard` para escolher o primeiro backoffice operável.
- Phase 4 e Phase 5 devem usar `user-stories`, `test-scenarios`, `cohort-analysis` ou `north-star-metric` conforme surgirem métricas reais de gameplay.

## Como Pedir Este Fluxo ao Codex

Exemplos:

- "Use o fluxo de implementação para detalhar a Phase 1."
- "Transforme essa ideia em PRD e planos GSD."
- "Antes de codar, rode um pre-mortem desse incremento."
- "Crie cenários de teste/UAT para este plano."
- "Valide se esta feature pode entrar no roadmap."

