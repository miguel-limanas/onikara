# Phase 4: Área do Jogador - Perfil, Personagem e Progressão - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar a primeira experiência jogável fora do console em `/play`, com autenticação real, criação de personagem, painel de personagem, progressão, inventário, equipamentos, magias e estado persistido no Supabase.

Esta fase transforma a fundação de Auth/RLS, os catálogos configurados no admin e o design system Onikara em uma experiência inicial de jogador. O jogador deve entrar pelo portal comum, ser roteado para criação quando ainda não tiver personagem e acessar um dashboard navegável quando já houver perfil criado.

Ficam fora desta fase: combate interativo em tempo real, orquestração de turnos, Realtime de combate, recompensas finais de combate, ferramentas administrativas novas, modo master e edição avançada de missões além da visualização do estado necessário ao perfil do jogador.

</domain>

<decisions>
## Implementation Decisions

### Onboarding e Criação de Personagem
- **D-01:** A criação inicial do personagem deve ser um fluxo direto em uma única tela.
- **D-02:** A tela deve conter nome do personagem, seleção de classe, seleção de raça e preview antes da confirmação.
- **D-03:** O preview deve mostrar atributos essenciais: HP, mana, força, defesa, inteligência, velocidade e um resumo textual da combinação de classe e raça.
- **D-04:** Ao confirmar, a aplicação deve criar o `profile` no Supabase e levar o jogador diretamente ao shell `/play`.
- **D-05:** Classes e raças devem vir dos catálogos publicados, respeitando RLS e sem duplicar conteúdo fixo no frontend quando o Supabase já fornecer a fonte de verdade.

### Shell `/play` e Dashboard do Jogador
- **D-06:** A primeira tela autenticada do jogador deve ser um dashboard inspirado em `.planning/design-system/onikara_dashboard.html`.
- **D-07:** O dashboard deve priorizar ficha principal, progresso, HP, mana, atributos, inventário, equipamentos e magias como blocos operacionais de leitura rápida.
- **D-08:** O player deve ser mais expressivo que o admin, com identidade Onikara forte, mas ainda tático, legível e navegável.
- **D-09:** A experiência mobile deve manter leitura rápida por empilhamento e blocos estáveis, sem rolagem horizontal global.
- **D-10:** A navegação do shell `/play` deve permanecer isolada de `/admin`; controles administrativos nunca aparecem no player.

### Atributos, Progressão, HP e Mana
- **D-11:** O perfil deve mostrar nível, XP, HP, mana e atributos principais com medidores ou barras quando isso melhorar a leitura.
- **D-12:** Cálculos devem ser claros para o jogador, mas sem expor fórmulas técnicas excessivas na primeira versão.
- **D-13:** A UI deve dar feedback visual para ganho de XP, mudança de nível e desbloqueio de magia quando esses estados estiverem disponíveis.
- **D-14:** Mana fora de combate deve aparecer como recurso do personagem, preparando o jogador para a lógica tática da Phase 5.
- **D-15:** O estado atual do personagem deve vir do Supabase e ser normalizado no cliente para renderização consistente.

### Inventário, Equipamentos e Magias
- **D-16:** O MVP deve permitir visualizar inventário, equipamentos e magias do personagem.
- **D-17:** As ações básicas do MVP são equipar e desequipar itens quando a tabela/estado permitir.
- **D-18:** Itens devem exibir tipo, raridade e indicação clara de equipamento atual.
- **D-19:** Magias bloqueadas por nível devem aparecer como bloqueadas, não escondidas, para comunicar progressão.
- **D-20:** Ações de inventário/equipamento devem ter feedback visual de loading, sucesso, erro e estado vazio.

### Autenticação e Roteamento Player/Admin
- **D-21:** O portal comum continua sendo a entrada oficial de Onikara.
- **D-22:** Usuário com papel `admin` deve ser roteado para `/admin` quando escolher ou acionar o contexto administrativo.
- **D-23:** Usuário jogador com personagem existente deve ir para `/play`.
- **D-24:** Usuário jogador sem personagem deve ir para criação de personagem antes do dashboard.
- **D-25:** Usuário sem permissão administrativa não deve ver shell administrativo nem dados de plataforma.
- **D-26:** A autenticação deve usar Supabase Auth, sessão persistida e RLS; `service_role` permanece proibido no navegador.

### the agent's Discretion
- Definir a granularidade exata dos módulos `src/player` e `src/services/player*`, desde que preserve ES Modules, Supabase JS e separação entre player/admin.
- Escolher a composição final do dashboard com base no mockup e no schema real, mantendo os blocos essenciais da fase.
- Decidir se pequenas ações de inventário exigem RPC ou PostgREST direto conforme RLS, constraints e necessidade transacional.
- Ajustar microcopy e estados vazios para português brasileiro com acentuação correta e tom institucional Onikara.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planejamento do Produto
- `.planning/ROADMAP.md` - Define Phase 4, objetivo, critérios de sucesso e planos 04-01 a 04-03.
- `.planning/REQUIREMENTS.md` - Define `STLV`, `CLRC`, `MANA`, `EQIP`, `NPCQ`, `UIDB-01`, `UIDB-02` e `UIDB-04`.
- `.planning/PROJECT.md` - Define Onikara, separação admin/player, Supabase como plataforma base e identidade visual.
- `.planning/STATE.md` - Estado atual do projeto e decisões acumuladas.
- `.planning/IMPLEMENTATION_FLOW.md` - Define fluxo de incremento vertical, validação e impacto em Supabase/RLS/UI.

### Fundação Supabase e Admin
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-CONTEXT.md` - Decisões sobre roles, claims, RLS, auditoria, player/admin/master e proibição de `service_role`.
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md` - Contratos Supabase para player/admin/master.
- `.planning/phases/03-area-de-administracao-catalogos-e-balanceamento/03-CONTEXT.md` - Decisões sobre portal/login, Supabase JS, catálogos publicados, admin e separação do player.
- `supabase/migrations/20260524031051_initial_rpg_schema.sql` - Schema de `profiles`, `inventory`, `equipment`, `character_spells`, `character_quests`, catálogos, combate e RLS.
- `supabase/seed.sql` - Dados iniciais para classes, raças, magias, itens, inimigos, missões e regras.
- `src/config/supabase.js` - Configuração local do cliente Supabase.
- `src/services/supabaseClient.js` - Cliente Supabase compartilhado, persistência de sessão e normalização de erros.
- `src/services/adminAuth.js` - Padrão atual de Auth, sessão e leitura de `app_role`.

### Design System e Mockups
- `.planning/phases/02-identidade-visual-e-design-system-onikara/02-CONTEXT.md` - Decisões de marca, modo player, tokens, acessibilidade e componentes.
- `.planning/design-system/BRAND.md` - Guia de marca, fluxo de acesso e expressão visual do player.
- `.planning/design-system/INITIAL-KIT.md` - Componentes base, tokens, estados obrigatórios e contrato mobile-first.
- `.planning/design-system/RESPONSIVE-SPEC.md` - Regras responsivas para shells isolados e navegação mobile.
- `.planning/design-system/ACCESSIBILITY-REVIEW.md` - Checklist de contraste, foco, labels, estados e navegação por teclado.
- `.planning/design-system/tokens.css` - Tokens oficiais reutilizáveis.
- `.planning/design-system/components.css` - Componentes base reutilizáveis.
- `.planning/design-system/MOCKUPS.md` - Índice e regras de uso dos mockups.
- `.planning/design-system/onikara_landing.html` - Referência para portal/login e roteamento inicial.
- `.planning/design-system/onikara_dashboard.html` - Referência principal para dashboard do jogador.

### Arquitetura e Convenções
- `.planning/codebase/ARCHITECTURE.md` - Define `/play`, onboarding, dashboard do personagem, dados privados e Supabase.
- `.planning/codebase/STACK.md` - Stack: HTML/CSS/JS puro, ES Modules, Supabase JS e Supabase local.
- `.planning/codebase/CONVENTIONS.md` - Convenções de modularidade, `src/ui`, `src/services`, ESM, async/await e persistência desacoplada.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/index.html`: portal/login atual que pode rotear usuário autenticado para `/admin`, `/play` ou criação de personagem.
- `public/admin.html` e `src/admin/adminApp.js`: exemplo de shell isolado autenticado, renderização modular e proteção por sessão.
- `src/services/supabaseClient.js`: cliente Supabase compartilhado com sessão persistida e normalização de erro.
- `src/services/adminAuth.js`: padrão para obter sessão, ler `app_role` e bloquear acesso indevido.
- `src/ui/components.js`: base de renderização UI reutilizável quando fizer sentido para player.
- `.planning/design-system/onikara_dashboard.html`: composição visual desejada para o dashboard do jogador.

### Established Patterns
- O projeto usa HTML/CSS/JS puro com ES Modules, sem framework frontend.
- Supabase JS no browser opera com anon key, sessão autenticada e RLS.
- `service_role` não é permitido no cliente.
- Admin e player são shells separados por rota e por linguagem visual.
- Artefatos e textos humanos devem usar português brasileiro com acentuação correta.
- UI deve reutilizar tokens e componentes existentes antes de criar variações.

### Integration Points
- Criar rota/HTML de `/play` ou equivalente servida dinamicamente pelo servidor estático sem expor navegação por arquivo HTML.
- Criar módulos `src/player/*` para shell, onboarding, dashboard, inventário/equipamento e renderização de estado.
- Criar módulos `src/services/playerAuth.js` ou `playerProfile.js` para carregar sessão, perfil, catálogos públicos e estado privado.
- Integrar `profiles`, `inventory`, `equipment`, `character_spells`, `character_quests`, `rpg_classes`, `rpg_races`, `spells`, `items` e views/regras ativas quando disponíveis.
- Atualizar o portal para rotear jogador sem personagem para criação e jogador com personagem para `/play`.

</code_context>

<specifics>
## Specific Ideas

- Usar o caminho mais direto e recomendado nas decisões da discussão.
- Criar personagem em uma tela única.
- Mostrar preview com atributos essenciais antes de confirmar.
- Inspirar o dashboard em `.planning/design-system/onikara_dashboard.html`.
- Mostrar magias bloqueadas por nível como promessa de progressão, não como conteúdo escondido.
- Preservar a separação visual e funcional entre `/admin` e `/play`.

</specifics>

<deferred>
## Deferred Ideas

- Combate interativo, HUD de turnos, eventos e Realtime ficam para Phase 5.
- Recompensas de combate, vitória/derrota e atualização pós-combate ficam para Phase 5.
- Modo master, campanhas e narrativa ficam fora da Phase 4.
- Suporte mutável administrativo e métricas avançadas permanecem para Phase 6.

</deferred>

---

*Phase: 4-Área do Jogador - Perfil, Personagem e Progressão*
*Context gathered: 2026-05-25*
