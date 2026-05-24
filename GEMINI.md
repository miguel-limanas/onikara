<!-- GSD:project-start source:PROJECT.md -->
## Project

**Sistema RPG**

Um sistema de RPG original, modular e altamente escalável focado em combates estratégicos por turnos, mecânicas elementais dinâmicas, gerenciamento tático de mana, classes distintas com progressão de nível, raças customizadas (como a sub-raça Oni) e NPCs interativos. O projeto foi projetado desde a base técnica para ser extensível, equilibrado e preparado para futuras expansões de missões e multiplayer.

**Core Value:** Prover um motor de combate por turnos modular e facilmente balanceável, onde as fraquezas elementais e a gestão tática de mana sejam determinantes para a vitória, sobrepondo o dano bruto.

### Constraints

- **Tecnologia**: HTML estrutural e JavaScript puro para lógica no backend/frontend, garantindo máxima interoperabilidade.
- **Estilo de Código**: Modular, modularidade orientada a objetos ou factory-pattern para magias, raças e entidades.
- **Portabilidade**: Execução inicial local rápida sem dependência de infraestruturas pesadas de nuvem.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Frontend & Motor de Jogo (Cliente)
*   **HTML5 & CSS3**: Estrutura e estilização visual pura (Vanilla CSS). Layout moderno baseado em CSS Grid e Flexbox com um tema dark/premium e micro-animações.
*   **Vanilla JavaScript (ES6+)**: Lógica completa do motor de combate, classes, raças, magias e gerenciamento de estado executada de forma modular utilizando ES Modules (`import`/`export`).
*   **Supabase JS Client (`@supabase/supabase-js`)**: Integração direta no cliente para persistência, autenticação e comunicação com os serviços de banco de dados.
## Backend & Persistência (Serviços Conteinerizados)
*   **Supabase (Self-Hosted em Docker)**: Uma alternativa open-source ao Firebase executada inteiramente local por meio de containers.
*   **Docker & Docker Compose**: Orquestração local dos serviços do Supabase (db, auth, rest API, real-time) garantindo portabilidade absoluta e setup rápido com um único comando.
## Ferramental de Desenvolvimento
*   **Node.js / npm**: Gerenciamento de dependências locais de desenvolvimento e facilitação de scripts de execução do servidor de desenvolvimento local.
*   **Git**: Versionamento de código e controle do ciclo de vida sob a metodologia GSD.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Organização do Código & Estrutura de Pastas
*   **Módulos de Código**: A estrutura de arquivos do cliente é organizada de forma modular sob ES Modules (ESM) para alta legibilidade:
*   `src/core` — Núcleo lógico (Atributos, Personagem, XP)
*   `src/classes` — Definições e balanceamentos das classes (Guerreiro, Mago)
*   `src/elements` — Lógica de vantagens e efeitos elementais
*   `src/spells` — Definição de magias por raridades e fábricas de instanciamento
*   `src/combat` — Máquina de estados do loop de combate e IA de oponentes
*   `src/services` — Comunicação externa e persistência (dbService.js)
*   `src/ui` — Renderizadores e manipuladores da HUD e Menus
*   `src/utils` — Helpers auxiliares matemáticos ou de formatação
## Padrões de Design de Código
*   **Factory Pattern (Padrão Fábrica)**:
*   Utilizado para instanciamento dinâmico de magias e inimigos a partir de um catálogo central JSON.
*   Exemplo: `SpellFactory.create('bola-de-fogo')` retorna uma instância pronta com atributos, cooldowns e comportamento configurados.
*   **Object-Oriented Programming (OOP) / Modularidade**:
*   Lógica encapsulada em classes ES6 bem definidas.
*   Personagens e entidades herdam de uma classe base comum (`Entity.js`), compartilhando gerenciamento de HP, Mana, velocidade e aplicação de status.
*   **State Machine (Máquina de Estados)**:
*   O combate é controlado por uma máquina de estados discreta (ex: `WAITING_ACTION`, `RESOLVING_TURN`, `ENEMY_TURN`, `VICTORY`, `DEFEAT`).
## Convenções de Estilo & Sintaxe (JS)
*   **Declarações**: Usar ES Modules (`import`/`export`). Nunca usar `require`/`module.exports` no cliente.
*   **Nomeação**:
*   Classes e Construtores: PascalCase (ex: `CombatEngine`, `CharacterEntity`).
*   Variáveis, Instâncias e Métodos: camelCase (ex: `currentMana`, `calculateDmg()`).
*   Constantes e Enums: UPPER_SNAKE_CASE (ex: `ELEMENT_BONUS = 1.5`, `COMBAT_STATES`).
*   **Assincronismo**: Toda comunicação com a camada de persistência Supabase deve utilizar `async`/`await` envolta em blocos `try`/`catch` estruturados.
## Integração com Banco de Dados (Supabase)
*   **State Alignment**: O estado do jogo em memória no cliente é a fonte da verdade (*source of truth*) durante o combate.
*   **Persistência Desacoplada**: Nenhuma lógica de cálculo estatístico de dano ou turnos é processada pelo banco de dados; o Supabase atua estritamente como repositório de persistência e validação de estado.
## Git & Commits
*   **Commits Atômicos**: Commits devem ser pequenos e focar em uma única alteração/correção.
*   **Mensagens de Commit**: Seguir o padrão *Semantic Commits* (ex: `feat(combat): implement initiative order calculation`, `docs(planning): update stack file with Supabase info`).
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Visão Geral do Fluxo
*   **Camada de Apresentação (HUD / Menus HTML/CSS)**:
*   Exibe em tempo real os status de HP, Mana, Cooldowns e status elementais.
*   Coleta entradas do usuário (clique em ações, escolhas de menu) e envia para a Game Engine.
*   **Motor Lógico do Jogo (Game Engine JS)**:
*   `CharacterEntity.js`: Atributos dinâmicos baseados em nível (XP), classe e sub-raça Oni.
*   `ElementalSystem.js`: Reações elementais cruzadas (vantagem e status).
*   `CombatEngine.js`: Máquina de estados de turnos e IA simples.
*   **Camada de Sincronização e DB (Supabase Service)**:
*   Interliga os eventos da Engine com as chamadas de banco no Supabase local.
*   **Ambiente Docker Local (Serviço Supabase)**:
*   `Supabase Auth` (GoTrue API): Cadastro de contas e verificação JWT.
*   `Supabase DB` (PostgreSQL): Tabelas relacionais (`profiles`, `character_spells`, `inventory`).
*   `Supabase API` (PostgREST): Traduz as tabelas do banco em endpoints REST rápidos.
## Componentes do Cliente (Game Engine)
*   **Módulo Personagem (`Character.js`)**:
*   Gerencia os atributos básicos de HP, MP, Força, Defesa, Inteligência, Velocidade e Resistências.
*   Calcula dinamicamente modificadores de nível (XP), raça (Humano, sub-raças Oni Fraco/Médio/Forte) e classe (Guerreiro, Mago).
*   **Módulo Elemental & Magias (`Elemental.js` / `Spell.js`)**:
*   Gerencia reações elementais e tabela de vantagens/desvantagens.
*   Implementa o acúmulo de efeitos colaterais de status (queimadura, lentidão, dreno de mana) e cooldowns de habilidades.
*   **Motor de Combate (`CombatEngine.js`)**:
*   Controla a máquina de estados do combate por turnos (Turn Loop).
*   Ordena o fluxo de turnos pela velocidade dos participantes.
*   Gerencia a fila de ações e o motor de Inteligência Artificial de inimigos simples.
*   **Serviço de Banco de Dados (`dbService.js`)**:
*   Instancia o cliente Supabase.
*   Gerencia requisições assíncronas para carregar/salvar estado de personagens, desbloqueio de magias e logs de sessões.
## Componentes do Servidor Local (Supabase em Docker)
*   **Autenticação**: Gerenciada pela tabela `auth.users` interna do Supabase.
*   **Perfil do Personagem (`profiles`)**: Armazena as informações básicas e atributos do personagem ativo (Nome, Nível, XP, Classe, Raça, Atributos Base).
*   **Magias do Personagem (`character_spells`)**: Controla quais magias o jogador desbloqueou para uso.
*   **Inventário (`inventory` - Fase 2)**: Controla itens, armas, armaduras e consumíveis carregados pelo jogador.
## Fluxo de Sincronização
*   **Offline First / Estado Local**: Durante o combate, o motor lógico gerencia todas as variáveis em memória local para garantir transições fluidas e alta velocidade de resposta (in-memory state).
*   **Escrita por Evento**: O banco é atualizado em eventos-chave para otimizar conexões (ex: ao terminar um combate, salvar progresso de missão, subir de nível ou sair do jogo).
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
