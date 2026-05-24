# Regras de dados

> Fonte da verdade por métrica, convenções de nome e o que conta como evidência.

## Fonte da verdade por métrica

- Conclusão dos fluxos do MVP: ainda não instrumentada; fonte futura deve ser telemetria do app/eventos Supabase combinados com notas de playtest.
- Estado de personagem/combate/progressão: Supabase/Postgres depois que os contratos de dados da Fase 1 forem implementados.
- Progresso de planejamento: `.planning/STATE.md` e `.planning/ROADMAP.md`.
- Síntese do PM Brain: `knowledge/strategy.md`, `knowledge/product/metrics.md` e hipóteses vinculadas.

## Convenções de nome

- Use nomes de eventos específicos do domínio que preservem a separação admin/player/mestre.
- Prefira slugs estáveis: `player_character_created`, `mission_viewed`, `combat_started`, `combat_completed`, `admin_catalog_updated`, `admin_rule_changed`.
- Segmente feedback de testers como `player`, `master-admin`, `collaborator` ou `clarity-tester` até surgirem personas reais.

## Qualidade de evidência

O que conta como evidência, por força:

1. **Evidência direta de usuário** - quotes, entrevistas, tickets de suporte, comportamento observado.
2. **Analytics de produto** - eventos instrumentados, comportamento de coorte, métricas de funil.
3. **Opiniões de stakeholders** - internas, mas informadas.
4. **Sinais de mercado/concorrência** - direcionais, não definitivos.
5. **Especulação interna** - menor peso. Rotule como premissa.

## TODO

Definir nomes concretos de eventos durante o primeiro slice implementado player/admin.
