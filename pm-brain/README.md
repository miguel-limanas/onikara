# PM Brain - Onikara

Um segundo cérebro markdown-native para Onikara: uma plataforma de RPG em estágio pré-PMF/protótipo-para-MVP, com identidade dark fantasy/Oni, separação admin/player apoiada por Supabase e direção de gameplay tático em turnos.

## O que é

- Um repositório. Arquivos Markdown. Versionado com git.
- Um manual operacional `CLAUDE.md` que o agente lê no início de cada sessão.
- Carregar contexto antes da tarefa e atualizar conhecimento depois dela. Sem drift silencioso.

Sem banco vetorial, embeddings ou auto-tagging. O sistema é inspecionável, editável e auditável.

## Como iniciar uma sessão

1. Abra este repo no Claude Code, Codex ou outro IDE agentic.
2. O agente lê [`../CLAUDE.md`](../CLAUDE.md) na raiz e depois [`CLAUDE.md`](./CLAUDE.md).
3. Inicie uma tarefa. O agente roteia por [`INDEX.md`](./INDEX.md) até a área relevante.

## Prioridades iniciais

1. **Ingerir um artefato real de playtest ou referência** - cole a próxima revisão de sketch, referência visual ou nota de tester com `/ingest`.
2. **Preparar a próxima revisão com o fundador** - rode `/prep fundador-criador` antes da próxima revisão semanal de progresso/identidade.
3. **Rodar `/review` na sexta-feira.** A manutenção mantém estratégia, roadmap, hipóteses e `.planning/` alinhados.

## Como o sistema pensa

- **Memória de trabalho vs conhecimento durável.** Ingestão bruta vive em `ingestion/`. Só sinais recorrentes, relevantes para decisão ou estratégia, sobem para `knowledge/`.
- **Hipóteses vs decisões.** Apostas em teste vivem em `hypotheses/`. Compromissos assumidos vivem em `decisions/`. Eles se comportam de modo diferente e continuam consultáveis separadamente.
- **Sinalizar, nunca bloquear.** O sistema expõe conflitos, hipóteses ausentes e tensões estratégicas. O PM resolve. Isto é um sistema de raciocínio, não de compliance.
- **Contradições são preservadas.** Quando evidências entram em conflito de verdade, o sistema registra o conflito em vez de achatá-lo em falso consenso.

Posicionamento completo e diferenciadores estruturais: [docs/overview.md](./docs/overview.md).

## Mapa de pastas

```text
CLAUDE.md           Manual operacional. Ler em toda sessão.
INDEX.md            Roteamento mestre.
source/             Evidência imutável copiada de artefatos existentes.
knowledge/          Conhecimento durável e sintetizado: estratégia, produto, usuários, mercado, organização.
stakeholders/       Um arquivo por pessoa ou grupo stakeholder.
hypotheses/         Hipóteses por feature, nas 5 áreas de risco.
decisions/          Log append-only. Status: pending | decided | superseded.
rules/              Como este PM conduz descoberta, priorização, entrega, escrita e dados.
ingestion/          Memória de trabalho: entrevistas, reuniões, mercado, adhoc.
maintenance/        Relatórios de revisão periódica.
docs/               Workflows, schemas, visão geral e evolução do sistema.
```

## Documentos de referência

- **[docs/overview.md](./docs/overview.md)** - O que é, o que diferencia e o que não é.
- **[docs/workflows.md](./docs/workflows.md)** - Cada comando, o que carrega e o que atualiza.
- **[docs/schemas.md](./docs/schemas.md)** - Índice cruzado dos schemas.
- **[docs/system-evolution.md](./docs/system-evolution.md)** - Como manter o sistema útil ao longo do tempo.
