# Estratégia

> A estrela-guia. Carregue no início de qualquer tarefa de priorização, planejamento ou revisão. Atualize apenas de forma deliberada; desvios são sinalizados, não absorvidos em silêncio.

## Métrica estrela-guia

**Experiência navegável e testável do Onikara.**

Definição: percentual dos fluxos críticos do MVP que um tester consegue completar ponta a ponta sem ajuda de agente/desenvolvedor: primeiro viewport, onboarding do jogador, entrada admin/mestre, visão de missão e primeiro estado pronto para combate.

Valor atual: 0 usuários públicos / 0 playtests externos validados. A baseline ainda precisa de instrumentação.

## Prioridades de 1-2 trimestres

1. **Construir a base Supabase para separar admin/player.** Por que agora: papéis, RLS, auditabilidade, tabelas de configuração e seeds são pré-requisitos para qualquer interface real. Sucesso: planos da Fase 1 no roadmap implementados e verificados. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
2. **Transformar a identidade Onikara em um design system utilizável.** Por que agora: o produto não pode parecer um dashboard SaaS genérico nem um site anime genérico. Sucesso: tokens, componentes, primeiro viewport e distinção visual admin/player validados por clareza. [source/planning/BRANDING_IDEAS.md](../source/planning/BRANDING_IDEAS.md)
3. **Criar a primeira experiência navegável admin/player.** Por que agora: o próximo aprendizado é se a visão gera suspense, estratégia, sensação premium e vontade de explorar. Sucesso: um tester consegue navegar os primeiros fluxos de admin/mestre e jogador com estado e intenção claros. `(chat, no artifact)`

## Não-objetivos explícitos

- Multiplayer online no MVP inicial. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- Gráficos 3D realistas. [source/planning/PROJECT.md](../source/planning/PROJECT.md)
- Transformar Onikara em um dashboard SaaS genérico. `(chat, no artifact)`
- Exagerar a intensidade anime a ponto de perder clareza estratégica, premium e tática. `(chat, no artifact)`
- Adicionar sistemas complexos antes de o MVP provar a experiência central. `(chat, no artifact)`
- Borrar a separação entre jogador, mestre/admin e camada de sistema operacional. `(chat, no artifact)`

## Apostas vs. compromissos

- **Apostas** em teste: [`hypotheses/`](../hypotheses/)
- **Compromissos** decididos: [`decisions/`](../decisions/)

## Última revisão

2026-05-24

## Tensões

### T1: Densidade admin vs. identidade fantasy

- **Sinal:** Admin precisa ser denso, operacional, auditável e eficiente. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Tensão:** O produto também precisa parecer inequivocamente Onikara: dark fantasy, Oni, tático, premium, não SaaS genérico. `(chat, no artifact)`
- **Possíveis resoluções:** Manter o layout admin contido enquanto usa tokens de marca, linguagem de status, iconografia e arquitetura de informação específicas do domínio.

### T2: Fundação da Fase 1 vs. desejo pelo primeiro viewport

- **Sinal:** O roadmap começa por papéis/RLS/governança no Supabase antes das interfaces. [source/planning/ROADMAP.md](../source/planning/ROADMAP.md)
- **Tensão:** O próximo aprendizado desejado é uma primeira experiência navegável e testável. `(chat, no artifact)`
- **Possíveis resoluções:** Deixar sketches da Fase 2 seguirem em paralelo, mas bloquear fluxos persistentes até existirem contratos de segurança/dados da Fase 1.
