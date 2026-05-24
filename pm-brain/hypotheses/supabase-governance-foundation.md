# Hipóteses - Fundação de governança Supabase

## Metadados

- **Feature:** [knowledge/product/features/supabase-governance-foundation.md](../knowledge/product/features/supabase-governance-foundation.md)
- **Status:** active
- **Responsável:** Fundador/criador
- **Última atualização:** 2026-05-24

## Valor

### H-V1: Governança Supabase segura é pré-requisito para um MVP admin/player crível

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O roadmap exige roles, RLS, auditability, config tables, and seeds before admin/player workflows become safe to build. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
  - Os requisitos incluem admin roles, audit logs, versioned configuration, and operational metrics. [source/planning/REQUIREMENTS.md](../source/planning/REQUIREMENTS.md)
- **Evidências contra:**
  - Nenhum usuário real admin/player validou que o trabalho de governança é o primeiro slice visível de maior valor. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Quanta governança é suficiente antes que a Fase 2/primeiro viewport possa avançar em paralelo com segurança?
- **Teste:** Completar a Fase 1 e verificar a player/admin separation scenario with seed data.
- **Gatilho de decisão:** Promover quando RLS/audit/config can support a real admin/player slice without service-key leakage.
- **Resolução:** Pendente.

## Usabilidade

### H-U1: Contratos de dados reduzirão confusão durante a implementação de UI

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - A Fase 1 inclui explicitamente Supabase JS access contracts for shared admin/player modules. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Nenhuma implementação de UI consumiu os contratos ainda. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - A nomeação dos contratos precisa preservar clareza de domínio for player, master/admin, and system layers.
- **Teste:** Implementar uma leitura/escrita de catálogo admin e um fluxo de leitura player por meio dos contratos.
- **Gatilho de decisão:** Promover se a mesma camada de contratos sustentar ambos os fluxos com clareza.
- **Resolução:** Pendente.

## Viabilidade técnica

### H-F1: A base Supabase existente pode sustentar o MVP sem uma API customizada primeiro

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - O roadmap orienta o projeto a usar Supabase Auth, Postgres, RLS, PostgREST, Realtime, Storage, migrations, and seed before creating custom services. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - Ainda não existe verificação completa da Fase 1. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Edge Functions ainda podem ser necessárias for sensitive game operations later.
- **Teste:** Implementar os planos da Fase 1 usando apenas primitivas Supabase, salvo bloqueio concreto.
- **Gatilho de decisão:** Promover se a Fase 1 for entregue sem exigir um serviço backend customizado.
- **Resolução:** Pendente.

## Viabilidade de negócio

### H-Vi1: Sequenciar governança primeiro evita retrabalho caro

- **Origem:** proativa
- **Confiança:** baixa
- **Evidências a favor:**
  - Separação admin/player, RLS, and audit are explicit roadmap success criteria before later admin/player UI phases. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Evidências contra:**
  - O fundador também precisa de progresso visível/navegável para validar a direção do produto. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - Investir demais em backend antes de um primeiro slice visível pode atrasar aprendizado.
- **Teste:** Timeboxar a Fase 1 e permitir sketches/design da Fase 2 em paralelo depois que as fronteiras de segurança estiverem claras.
- **Gatilho de decisão:** Promover se a Fase 1 destravar as Fases 3/4 sem retrabalho substancial de schema/segurança.
- **Resolução:** Pendente.

## Outros riscos

### H-O1: Decisões de segurança tomadas casualmente demais podem comprometer confiança futura

- **Origem:** proativa
- **Confiança:** média
- **Evidências a favor:**
  - Segurança de papel admin e RLS são requisitos explícitos. [source/planning/REQUIREMENTS.md](../source/planning/REQUIREMENTS.md)
- **Evidências contra:**
  - Ainda não há usuários/dados de produção. `(chat, no artifact)`
- **Perguntas abertas / ressalvas:**
  - São necessários cenários de verificação for role escalation and private player data.
- **Teste:** Adicionar checks de UAT/segurança for admin writes, public catalog reads, and private player reads.
- **Gatilho de decisão:** Promover quando verification catches these paths.
- **Resolução:** Pendente.
