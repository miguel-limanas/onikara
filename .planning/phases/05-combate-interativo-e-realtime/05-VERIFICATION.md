# Phase 5: Verificação

**Data:** 2026-10-10 (ambiente local: Supabase CLI 2.101, Docker, Node 24)
**Resultado:** implementada; verificada por testes automatizados do motor, scripts de fluxo contra o Supabase local e testes manuais no navegador. Sem UAT formal e sem publicação da Edge Function.

## Como repetir

| O quê | Comando | Pré-requisitos |
| --- | --- | --- |
| Testes do motor (53) | `npm test` | Node 24 |
| Simulação no terminal | `npm run combat:sim -- --class mage --enemy ash-imp --level 3 --runs 200` | Node 24 |
| Migrations locais | `npx supabase migration up` | Supabase local rodando |
| Função de combate | `npx supabase functions serve combat` | Supabase local rodando |
| RLS do combate (6 verificações) | `docker exec -i supabase_db_onikara psql -U postgres -d postgres < supabase/tests/combat_rls.sql` | usuários de teste |
| Campanha e mestre | `node supabase/tests/campaignFlow.mjs` | função servindo; usuários de teste |
| Recompensas, missões e recuperação | `node supabase/tests/rewardsFlow.mjs` | função servindo; usuários de teste |
| Anti-trapaça (15 verificações) | `node supabase/tests/hardeningFlow.mjs` | usuário `outro.teste` sem personagem |

Usuários de teste (todos `@onikara.local`, mesma senha de desenvolvimento): `jogador.teste` (personagem Aria Teste, Mago), `outro.teste` (sem personagem), `master.teste` (`app_role = master`, definido por SQL).

## O que foi verificado

**Motor (automatizado):** ordem por velocidade e desempate, dano físico e mágico com valores do seed, vantagem 1.5x e desvantagem 0.75x, crítico, piso de dano, mana, regeneração, recarga, status (dano por turno, perda de ação, defesa, velocidade, empilhamento, expiração), escudo, purificação, dreno de mana, bônus de defesa, área, fadiga, consumíveis, fuga, IA (alvo de menor HP, pesos, vantagem elemental), determinismo por semente, 200 combates simulados por classe e inimigo com invariantes. Teste de deriva compara a fixture com `supabase/seed.sql`.

**Servidor:** início, ação, versão antiga (409), campos falsos ignorados, abandono, retomada; vários jogadores; mestre age só pelo inimigo da vez; jogador só na própria vez; inimigo não liberado recusado; recompensas idempotentes; progresso de missão; subida de nível, limite de pilha, regeneração por dias, medicina uma vez por dia.

**Segurança:** tabelas de combate somente leitura para jogador e admin; funções internas restritas a `service_role`; jogador não altera nível, XP, HP, inventário, missões nem efeitos; criação de personagem só por RPC; equipamento valida dono e slot.

**Navegador (manual):** treino local, combate do servidor com retomada, aba Mestre (campanha, convite, liberar inimigos, conceder magia, iniciar, sugestão da IA, recompensas), Realtime entre mestre (API) e jogador (tela) com indicador "Ao vivo", aceitar missão, onboarding com elemento e equipar item, sem rolagem horizontal em 375 px.

## O que não foi testado

- Publicação da Edge Function (`supabase functions deploy`) e empacotamento de produção; a importação de `src/engine` foi validada só no `functions serve` local.
- Dois navegadores/usuários ao mesmo tempo (o login compartilha o armazenamento do navegador); a ação do jogador chegando na tela do mestre foi verificada só pela API.
- Reconexão forçada do canal Realtime e o modo de consulta periódica.
- Telas do `/admin` (login de admin, catálogos, balanceamento, jogadores e sessões) após as mudanças de RLS; as políticas de leitura do admin foram mantidas por SQL, mas a interface não foi reaberta.
- Botão "Usar" do inventário e botão de medicina pela interface (verificados só pela RPC), recompensas com subida de nível pela interface, acessibilidade por teclado completa e mobile do mestre.
- Efeitos de custo percentual de mana, esquiva e `scales_with: power` em dano por turno (fora do escopo, ver `05-ENGINE-SPEC.md`).

## Desvios do plano original

- Importação do motor pela Edge Function funcionou direto (plano B de cópia não foi necessário).
- A IA virou apoio ao mestre (D-19); no treino solo ela joga sozinha.
- Recuperação ganhou tabela própria `recovery_rules` (versionada, com auditoria), ainda sem tela no admin.
- `profiles.element_id` e `campaigns.medicine_dt` foram adicionados; o jogador não vê um combate encerrado depois que sai da tela.
