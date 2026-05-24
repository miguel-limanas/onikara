# PM Brain - Índice Mestre

Comece aqui. Toda tarefa passa primeiro por este arquivo.

## Áreas

| Área | Caminho | Carregar quando |
| --- | --- | --- |
| Estratégia | [knowledge/strategy.md](./knowledge/strategy.md) | Planejamento, priorização e checagens de desvio |
| Produto | [knowledge/product/](./knowledge/product/) | Trabalho de features, métricas e roadmap |
| Usuários | [knowledge/users/](./knowledge/users/) | Descoberta, síntese de entrevistas e segmentação |
| Mercado | [knowledge/market/](./knowledge/market/) | Análise competitiva e posicionamento |
| Organização | [knowledge/org/](./knowledge/org/) | Time, processo e ferramentas |
| Stakeholders | [stakeholders/](./stakeholders/) | Preparação para 1:1s e conversas multifuncionais |
| Hipóteses | [hypotheses/](./hypotheses/) | Pré-lançamento, desenho de experimentos e avaliação pós-lançamento |
| Decisões | [decisions/](./decisions/) | Qualquer escolha que comprometa esforço futuro ou reverta uma decisão anterior |
| Regras | [rules/](./rules/) | Como este PM conduz descoberta, priorização, entrega, escrita e dados |
| Ingestão | [ingestion/](./ingestion/) | Entrevistas, reuniões, inteligência de mercado e notas avulsas sintetizadas |
| Fontes | [source/](./source/) | Âncoras de auditoria verbatim para cada artefato ingerido; nunca editar |
| Manutenção | [maintenance/](./maintenance/) | Revisões semanais ou periódicas do sistema |

## Workflows

Veja [docs/workflows.md](./docs/workflows.md) para a lista completa de comandos e modos de ingestão.

## Atalhos

- `/ingest interview <file>` - processar uma transcrição de entrevista
- `/ingest meeting <file>` - processar notas de reunião ou 1:1
- `/ingest market <url-or-file>` - processar inteligência de mercado ou concorrência
- `/ingest adhoc` - registrar algo aprendido em formato livre
- `/prep <stakeholder-slug>` - carregar stakeholder e contexto recente para uma conversa
- `/hypothesize <feature-slug>` - gerar ou atualizar hipóteses de uma feature
- `/decide <slug>` - registrar uma decisão
- `/review` - rodar a manutenção completa
- `/strategy-check` - checar desvios entre decisões/ingestões recentes e `knowledge/strategy.md`
- `/ideate <problem>` - gerar direções de solução ancoradas em evidência
- `/risk <feature-slug>` - fazer varredura de riscos nas 5 áreas e rascunhar lacunas
- `/plan <objective>` - transformar um objetivo em perguntas de descoberta, hipóteses, experimentos e pontos de decisão

Equivalentes conversacionais funcionam para todos esses comandos. Os comandos são opcionais.
