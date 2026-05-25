# Phase 4: Área do Jogador - Perfil, Personagem e Progressão - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 4-Área do Jogador - Perfil, Personagem e Progressão
**Areas discussed:** Onboarding e criação de personagem, Shell `/play` e dashboard do jogador, Atributos e progressão, Inventário/equipamentos/magias, Autenticação e roteamento

---

## Seleção de Áreas

| Area | Description | Selected |
|------|-------------|----------|
| Onboarding e criação de personagem | Nome, classe, raça, preview de atributos e persistência inicial no Supabase. | ✓ |
| Shell `/play` e dashboard do jogador | Organização da primeira tela com ficha, progresso, missões, inventário e ações futuras. | ✓ |
| Atributos, XP, HP e mana | Apresentação de cálculos, nível, barras, mana e feedback de progressão. | ✓ |
| Inventário, equipamentos e magias | Ações básicas de visualizar, equipar, desequipar e bloquear magia por nível. | ✓ |
| Missões e progresso do jogador | Exibição de disponíveis, ativas, concluídas, etapas e recompensas. | |
| Autenticação e roteamento player/admin | Decisão do portal entre admin, jogador com personagem e jogador sem personagem. | ✓ |

**User's choice:** `1 2 3 4 6`
**Notes:** O usuário escolheu discutir todas as áreas principais exceto missões. Missões permanecem dentro do escopo do roadmap, mas sem decisões adicionais nesta conversa.

---

## Onboarding e Criação de Personagem

| Option | Description | Selected |
|--------|-------------|----------|
| Fluxo direto recomendado | Uma tela só: nome, classe, raça, preview de atributos e botão para criar. Mais rápido para validar o MVP. | ✓ |
| Fluxo guiado em etapas | Primeiro nome, depois classe, depois raça, depois confirmação. Mais imersivo, mas aumenta a implementação. | |
| Você decide | O planejador escolhe o formato mais simples que preserve a estética Onikara. | |

**User's choice:** `1`
**Notes:** A criação deve ser direta, em uma única tela.

---

## Preview de Personagem

| Option | Description | Selected |
|--------|-------------|----------|
| Atributos essenciais recomendado | HP, mana, força, defesa, inteligência, velocidade e resumo textual da combinação classe/raça. Dá clareza sem virar planilha. | ✓ |
| Ficha completa | Todos os atributos, modificadores, magia inicial, vantagens e fraquezas. Mais rico, porém mais denso. | |
| Visual narrativo | Poucos números e mais descrição de arquétipo, estilo de combate e risco/recompensa. Mais imersivo, menos preciso. | |

**User's choice:** `1`
**Notes:** O usuário repetiu `1` nas respostas seguintes. Isso foi interpretado como preferência pelas opções recomendadas/diretas nas decisões restantes.

---

## Shell `/play` e Dashboard do Jogador

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard direto recomendado | Primeira tela com ficha principal, progresso, HP/mana, atributos e blocos de inventário/equipamentos/magias. | ✓ |
| Navegação por abas | Separar ficha, inventário, magias e missões em abas desde o primeiro acesso. | |
| Experiência mais narrativa | Priorizar ambientação e texto, com dados mais discretos. | |

**User's choice:** Recomendado por repetição de `1`.
**Notes:** Usar `.planning/design-system/onikara_dashboard.html` como referência principal, preservando leitura mobile e separação de `/admin`.

---

## Atributos, XP, HP e Mana

| Option | Description | Selected |
|--------|-------------|----------|
| Leitura tática recomendada | Barras/medidores para HP, mana e XP, com atributos principais visíveis e fórmulas resumidas. | ✓ |
| Ficha numérica completa | Exibir atributos, modificadores e fórmulas em detalhes. | |
| Leitura simplificada | Mostrar apenas nível, HP, mana e classe/raça, reduzindo densidade. | |

**User's choice:** Recomendado por repetição de `1`.
**Notes:** Cálculos devem ser claros, mas sem virar documentação técnica na UI.

---

## Inventário, Equipamentos e Magias

| Option | Description | Selected |
|--------|-------------|----------|
| Ações básicas recomendadas | Visualizar, equipar e desequipar; raridade e tipo visíveis; magias bloqueadas por nível aparecem como bloqueadas. | ✓ |
| Somente leitura | Mostrar inventário/equipamentos/magias sem ações no MVP. | |
| Ações ampliadas | Incluir uso de consumíveis, descarte e filtros avançados. | |

**User's choice:** Recomendado por repetição de `1`.
**Notes:** Feedback visual de loading/sucesso/erro é obrigatório para ações.

---

## Autenticação e Roteamento

| Option | Description | Selected |
|--------|-------------|----------|
| Portal inteligente recomendado | Admin vai para `/admin`; jogador com personagem vai para `/play`; jogador sem personagem vai para criação. | ✓ |
| Escolha manual de contexto | Depois do login, sempre mostrar opções disponíveis antes de rotear. | |
| Roteamento separado por URL | Login do admin e login do player ficam em entradas diferentes. | |

**User's choice:** Recomendado por repetição de `1`.
**Notes:** O portal comum permanece como entrada oficial; usuário sem permissão admin não vê shell administrativo.

---

## the agent's Discretion

- Definir organização final dos módulos do player.
- Ajustar composição do dashboard ao schema real disponível.
- Escolher PostgREST direto ou RPC para ações de equipamento conforme RLS e necessidade transacional.
- Ajustar textos finais em português brasileiro com tom Onikara.

## Deferred Ideas

- Missões não foram discutidas em profundidade, mas continuam no escopo do roadmap para visualização de estado.
- Combate interativo, Realtime e recompensas pós-combate ficam para Phase 5.
- Modo master, campanhas e narrativa ficam fora desta fase.
