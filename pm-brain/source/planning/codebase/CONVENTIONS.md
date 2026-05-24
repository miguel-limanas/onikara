# Conventions

Diretrizes de desenvolvimento, padrões de codificação e boas práticas estabelecidas para o **Sistema RPG**.

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
