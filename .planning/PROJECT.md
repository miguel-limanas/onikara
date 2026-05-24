# Onikara

## What This Is

**Onikara** é uma plataforma de RPG original, modular e altamente escalável focada em combates estratégicos por turnos, mecânicas elementais dinâmicas, gerenciamento tático de mana, classes distintas com progressão de nível, raças customizadas (como a sub-raça Oni) e NPCs interativos. O projeto foi projetado desde a base técnica para ser extensível, equilibrado e preparado para futuras expansões de missões e multiplayer.

O sistema terá duas áreas principais:

- **Administração**: backoffice para configurar a plataforma, balancear conteúdo, gerenciar catálogos, acompanhar jogadores e operar o jogo com segurança.
- **Interação dos jogadores**: experiência jogável para criação de personagem, progressão, inventário, missões e combate.

## Core Value

Prover um motor de combate por turnos modular e facilmente balanceável, onde as fraquezas elementais e a gestão tática de mana sejam determinantes para a vitória, sobrepondo o dano bruto.

## Requirements

### Validated

*(Nenhum ainda — entregue para validar)*

### Active

- [ ] **Sistema de Atributos Base**: Criação e escalonamento de Vida, Mana, Força, Defesa, Inteligência, Velocidade, Resistência Elemental e Chance Crítica.
- [ ] **Sistema de Level e XP**: Curva de XP, escalonamento por nível, aumento de atributos e desbloqueio de magias por nível mínimo.
- [ ] **Sistema Tático de Mana**: Limitação de mana, taxas diferenciadas de regeneração (combate vs fora) e mecânica de fadiga para magias avançadas.
- [ ] **Classes Iniciais**: Implementação das classes Guerreiro, Mago, Assassino, Tank e Suporte com atributos e especializações únicas.
- [ ] **Sistema Elemental**: Implementação de reações e vantagens elementais (Fogo, Água, Terra, Ar, Raio, Gelo, Luz, Sombras) com efeitos secundários (queimadura, paralisia, dreno).
- [ ] **Sistema de Magias**: Estruturação de magias com custo de mana, cooldown, dano, efeitos e raridade (Comum, Rara, Épica, Lendária).
- [ ] **Sistema de Raças**: Diversidade estatística entre Humanos, Elfos, Bestiais e o sistema de Onis (Fraco, Médio, Forte) com modificadores de atributos.
- [ ] **Motor de Combate por Turnos**: Sistema de iniciativa por velocidade, turnos bem definidos, cálculo de crítico/esquiva, aplicação de status e IA básica de inimigos com priorização estratégica.
- [ ] **Inventário e Equipamentos**: Equipamentos (Armas, Armaduras, Acessórios e Artefatos) organizados por raridade, concedendo modificadores de status específicos.
- [ ] **NPCs e Missões**: Comerciantes, Mestres de Skill, NPCs de lore e missões de Caça/Exploração.
- [ ] **Interface do Usuário (UI)**: HUD de combate (HP, Mana, Cooldowns, Debuffs) e menus estruturados (Inventário, Habilidades, Missões).
- [ ] **Banco de Dados Modular**: Salvamento do estado do personagem, nível, inventário, skills equipadas e progresso das missões.

### Out of Scope

- [ ] **Multiplayer Online (Fase Inicial)** — Postergado para garantir estabilidade e polimento da engine em single-player.
- [ ] **Gráficos 3D Realistas** — O foco é uma arquitetura lógica robusta e interfaces estilizadas (2D ou texto rico em console) para validar o balanceamento primeiro.

## Context

- **Idioma dos artefatos**: documentos, resumos, guias, relatórios, decisões e textos de preview devem ser escritos em português brasileiro, com acentuação correta e registro de norma culta. Nomes técnicos de arquivos, classes, tokens CSS, comandos e APIs podem permanecer em inglês quando fizerem parte do contrato técnico.

- **Arquitetura Recomendada**: Divisão clara entre Backend (regras de jogo, combate, banco de dados) e Frontend (interface, menus e feedback visual).
- **Abordagem de Desenvolvimento**: Modular, permitindo a inserção simplificada de novas classes, magias e elementos sem a necessidade de reescrever as classes base de regras de jogo.
- **Supabase como plataforma base**: Auth, Postgres, RLS, PostgREST, Realtime, Storage, migrations e seed devem ser usados como recursos primários antes da criação de serviços próprios.
- **Identidade visual Onikara**: a marca deve equilibrar dark fantasy, energia anime, máscaras Oni, brasas, selos/runa e uma leitura tática clara para admin e jogador.

## Constraints

- **Tecnologia**: HTML estrutural e JavaScript puro para lógica no backend/frontend, garantindo máxima interoperabilidade.
- **Estilo de Código**: Modular, modularidade orientada a objetos ou factory-pattern para magias, raças e entidades.
- **Portabilidade**: Execução inicial local rápida sem dependência de infraestruturas pesadas de nuvem.

## Key Decisions

| Decisão | Rationale | Resultado |
|----------|-----------|-----------|
| Arquitetura Modular em JS | Facilitar a adição futura de novos elementos, classes e magias sem quebrar o motor central. | — Pending |
| MVP com 2 Classes, 4 Elementos e 10 Magias | Validar o motor tático de mana e combate de forma enxuta antes de escalonar o conteúdo completo. | — Pending |
| Supabase Self-Hosted em Docker | Utilização de serviços conteinerizados locais (PostgreSQL, Auth, PostgREST) para stack mínima de banco de dados, facilitando setup rápido e portabilidade total. | ✓ Good |
| Nome do produto: Onikara | Nome memorável com associação direta à linhagem Oni e potencial visual forte para RPG anime/dark fantasy. | ✓ Good |
| Duas áreas de produto | Separar backoffice operacional da experiência jogável reduz acoplamento de UX, permissões e navegação. | ✓ Good |

| Artefatos em PT-BR | Manter consistência editorial e clareza para o time, usando português brasileiro com acentuação e norma culta nos textos humanos do projeto. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after initialization*
