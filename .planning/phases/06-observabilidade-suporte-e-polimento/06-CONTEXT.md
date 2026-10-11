# Phase 6: Observabilidade, Suporte e Polimento - Context

**Gathered:** 2026-10-11
**Status:** Planejada (somente planejamento; nada executado). Decisões marcadas como "pendente" dependem do Léo ou do Miguel.

<domain>
## Phase Boundary

Fechar o ciclo operacional da plataforma depois do combate: o admin enxerga como o jogo está sendo usado (ADMIN-04), consegue ajudar jogadores e mestres sem mexer no banco à mão, o conteúdo pode crescer sem depender só do admin, e os fluxos críticos passam por uma validação formal (UAT) com documentação para repetir.

Ficam fora da fase: PvP, IA avançada de inimigos (CMBT-04), crafting e melhoria de raridade, loja ou economia, publicação em produção (o deploy da Edge Function entra só como verificação e documentação, ver 06-05) e qualquer decisão numérica de balanceamento dos inimigos (ponto em aberto, ver abaixo).
</domain>

<current_state>
## O que já existe (verificado no `git log` e no repositório em 2026-10-11)

O roadmap original da Fase 6 previa quatro planos (métricas, auditoria e suporte, revisão UI/UX e acessibilidade, documentação). Depois da Fase 5, a thread "Ajustes" entregou, direto na `master`, muita coisa que reduz ou muda esse escopo.

| Item do roadmap original | O que já existe | Efeito no escopo |
| --- | --- | --- |
| Qualidade visual e consistência | Avatar redondo editável (`avatar.js`, `20261011080000_avatars.sql`); avatar de item e de magia com padrão por tipo/elemento e campo `image_url` no admin (`d42d852`, `6b74e18`); arena de combate com fichas (`65a3fbf`); dados animados (`ad18914`, `42b8904`); confete na vitória e parede de chamas na derrota (`a1c02eb`, `42de91d`) | **Não repetir.** A revisão de UI vira checagem de regressão e acessibilidade dessas telas novas, não redesenho. |
| Fluxo de campanha e mestre | Campanha em construção/ativa/encerrada, convites com aceite, histórico expansível, sugestão de história, missões cadastradas pelo mestre, abas do mestre (visão geral, combate, missões), estado dos jogadores ao vivo (`cdfa176`, `fe7d893`, `a45c005`, `01092ca`, `2e794d3`, `907e867`, `ac55c67`) | **Não repetir.** Entra apenas no roteiro de UAT. |
| Regeneração e recuperação | Regeneração calculada no servidor para todos (`dca569e`, `20261011180000_server_regeneration.sql`) | Resolvido no servidor; falta só a tela da regra no admin (06-02). |
| Suporte mutável | `adminSupport.js` ainda devolve `unsupportedSupportAction` ("adiada até existir RPC auditada") | Continua pendente: 06-03. |
| Métricas (ADMIN-04) | Dashboard conta linhas por catálogo e mostra auditoria recente; nenhuma métrica de uso | Continua pendente: 06-01. |
| Documentação | `CLAUDE.md` tem comandos e armadilhas; `05-VERIFICATION.md` tem a tabela de como repetir; não há guia único de seed, reset e usuários de teste | Continua pendente: 06-05. |
| Testes | `npm test` cobre só o motor (53 testes); fluxos do servidor rodam como scripts em `supabase/tests/` | Falta um único comando de verificação (06-05). |

## Pendências conhecidas que entram na fase

1. **Mestre não cadastra inimigos nem magias.** Escrita em catálogos continua `is_admin()`; o mestre só liberta inimigos existentes e cadastra missões (06-04).
2. **Balanceamento do dano dos inimigos.** Relatos de dano 1 contra defesa alta e o Imp de Cinzas perdendo em 100% das simulações com personagens de nível 3. **Ponto em aberto**: o Léo define os números com o Miguel. A fase só entrega a ferramenta para enxergar o problema (06-02), sem alterar valores.
3. **Regra de recuperação sem tela no admin.** `recovery_rules` é versionada e auditada, mas não aparece em `balanceView.js` (06-02).
4. **Imagens reais de itens, magias e inimigos.** Os campos `image_url` de itens e magias existem; inimigos ainda não têm o campo e não há upload (Storage). Cadastro das imagens em si é conteúdo, não código (06-04).
5. **Pendências herdadas da Fase 5** (`STATE.md`): publicar e validar a Edge Function; reabrir telas do `/admin` após as mudanças de RLS; dar à missão `first-sparks` um alvo para jogadores reais; reconexão do Realtime e teste com dois navegadores; textos de seed sem acento.
</current_state>

<decisions>
## Decisões tomadas por padrão (podem ser revertidas)

- **D-01 (métricas sem tabela nova):** as métricas vêm de funções SQL de leitura (`SECURITY DEFINER`, restritas a `is_admin()`) agregando tabelas que já existem (`profiles`, `combat_sessions`, `combat_events`, `combat_rewards`, `campaigns`, `character_quests`). Sem telemetria de cliente nem tabela de eventos nova nesta fase.
- **D-02 (simulação no admin):** o motor é módulo puro, então o relatório de balanceamento roda `src/engine/combat/` no navegador do admin com as regras ativas, sem escrever em banco. Valores não são alterados por essa tela.
- **D-03 (suporte por RPC):** toda ação de suporte é uma RPC `SECURITY DEFINER` com `search_path` fixo, exigindo `is_admin()`, motivo obrigatório, escrita em `admin_audit_logs` e idempotência quando faz sentido. Sem escrita direta de admin em `profiles` (coerente com 05-08).
- **D-04 (papéis):** `admin` dá suporte e cuida do conteúdo global; `master` conduz a campanha; a fase não cria papel novo.
- **D-05 (acessibilidade como regressão):** os critérios da Fase 2 (contraste 4.5:1, foco visível, alvos de 44px, `prefers-reduced-motion`) são conferidos nas telas novas; o efeito de confete e fogo já respeita movimento reduzido (`a1c02eb`) e entra só no checklist.
- **D-06 (idioma):** todo texto de interface e de documento em pt-BR com acentuação correta; strings antigas sem acento são corrigidas ao tocar o trecho (regra do `CLAUDE.md`).

## Decisões pendentes (perguntas curtas)

Registradas em `06-QUESTIONS.md`. Nenhum plano com `autonomous: false` deve ser executado antes da resposta correspondente.
</decisions>

<risks>
## Riscos

- **RLS e funções de agregação:** função `SECURITY DEFINER` mal escrita vaza dados de jogadores. Mitigação: `is_admin()` na primeira linha, teste SQL provando que jogador e mestre recebem erro (06-01, 06-03).
- **Conteúdo do mestre vira vetor de abuso:** inimigo ou magia absurdos quebram o combate de outros. Mitigação: escopo por campanha e limites validados no banco (06-04), ou fila de aprovação do admin conforme a resposta à pergunta Q3.
- **Mexer em número de balanceamento sem combinar:** o ponto está em aberto; 06-02 é somente leitura por decisão.
- **UAT sem pessoa:** o UAT precisa do Léo e do Miguel jogando. O plano 06-05 entrega o roteiro e o script de pré-verificação; o veredito é humano.
</risks>
