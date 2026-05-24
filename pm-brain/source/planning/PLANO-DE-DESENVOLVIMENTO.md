# Plano de Desenvolvimento — Sistema RPG

## Objetivo do Projeto

Desenvolver um sistema de RPG original com:

* Sistema de classes
* Elementos mágicos
* Sistema de mana estratégico
* Progressão de nível
* Raças e sub-raças (como os Onis)
* Magias balanceadas por custo, dano e raridade
* NPCs interativos
* Combate por turnos
* Sistema de status e atributos
* Expansão futura para multiplayer e missões

O objetivo inicial é criar uma base sólida, organizada e escalável.

---

# Visão Geral do Sistema

## Estrutura Base

O sistema será dividido em:

1. Núcleo do combate
2. Sistema de mana
3. Sistema de classes
4. Sistema elemental
5. Progressão e XP
6. Inventário e equipamentos
7. NPCs e missões
8. Interface do usuário
9. Banco de dados
10. Balanceamento

---

# Fase 1 — Estrutura Inicial

## Objetivo

Criar a fundação do sistema.

## Prioridades

### 1. Sistema de Atributos

Criar atributos básicos:

* Vida (HP)
* Mana (MP)
* Força
* Defesa
* Inteligência
* Velocidade
* Resistência elemental
* Chance crítica

## Regras Básicas

* Cada classe possui atributos iniciais diferentes.
* Atributos aumentam por nível.
* Equipamentos modificam atributos.

---

### 2. Sistema de Level

Criar:

* XP por inimigo
* Escalamento de XP
* Evolução por nível
* Desbloqueio de habilidades

## Regras

* Cada nível aumenta atributos.
* Magias mais fortes exigem nível mínimo.
* Inimigos escalam por região.

---

### 3. Sistema de Mana

## Objetivo

Transformar mana em recurso estratégico.

## Regras

* Mana limitada.
* Regeneração lenta em combate.
* Regeneração maior fora de combate.
* Algumas magias consomem porcentagem da mana total.
* Magias avançadas podem causar fadiga.

## Mecânicas Futuras

* Overload mágico
* Quebra de concentração
* Buffs e debuffs mágicos

---

# Fase 2 — Sistema de Classes

## Objetivo

Criar identidade para cada estilo de jogo.

## Classes Iniciais

### Guerreiro

Foco:

* Vida alta
* Defesa
* Combate físico

### Mago

Foco:

* Dano elemental
* Controle de área
* Alto consumo de mana

### Assassino

Foco:

* Velocidade
* Crítico
* Esquiva

### Tank

Foco:

* Proteção
* Provocação
* Resistência

### Suporte

Foco:

* Cura
* Buffs
* Controle secundário

---

# Fase 3 — Sistema Elemental

## Elementos Iniciais

* Fogo
* Água
* Terra
* Ar
* Raio
* Gelo
* Luz
* Sombras

## Mecânicas

### Vantagens Elementais

Exemplo:

* Água vence fogo
* Terra resiste raio
* Luz causa dano extra em sombras

### Efeitos Secundários

#### Fogo

* Queimadura

#### Gelo

* Lentidão

#### Raio

* Paralisia temporária

#### Sombras

* Dreno de mana

---

# Fase 4 — Sistema de Magias

## Estrutura das Magias

Cada magia deve possuir:

* Nome
* Elemento
* Dano
* Custo de mana
* Tempo de recarga
* Efeito secundário
* Raridade
* Escalamento por nível

## Classificação

### Comum

Baixo dano e baixo custo.

### Rara

Maior dano e efeitos especiais.

### Épica

Grande impacto em combate.

### Lendária

Magias extremamente fortes.

---

# Fase 5 — Sistema de Raças

## Objetivo

Criar diversidade estratégica.

## Raças Base

* Humanos
* Onis
* Elfos
* Bestiais

## Sistema Oni

### Oni Fraco

* Mais velocidade
* Menor resistência

### Oni Médio

* Balanceado

### Oni Forte

* Muito dano
* Mais lento

---

# Fase 6 — Combate

## Modelo

Combate em turnos.

## Mecânicas

* Ordem por velocidade
* Crítico
* Esquiva
* Resistência elemental
* Buffs e debuffs
* Efeitos contínuos

## Sistema de IA

Os inimigos devem:

* Priorizar fraquezas elementais
* Defender quando com pouca vida
* Utilizar habilidades especiais

---

# Fase 7 — Inventário e Equipamentos

## Equipamentos

* Armas
* Armaduras
* Acessórios
* Artefatos mágicos

## Sistema de Raridade

* Comum
* Raro
* Épico
* Lendário

## Modificadores

Itens podem:

* Aumentar mana
* Melhorar resistência elemental
* Reduzir cooldown
* Aumentar crítico

---

# Fase 8 — NPCs e Missões

## NPCs

Criar:

* Comerciantes
* Mestres de habilidade
* NPCs de lore
* Inimigos especiais

## Missões

### Tipos

* Caça
* Exploração
* História principal
* Eventos especiais

---

# Fase 9 — Interface do Usuário

## Necessidades

### HUD

* Barra de HP
* Barra de mana
* Cooldowns
* Status negativos

### Menus

* Inventário
* Árvore de habilidades
* Equipamentos
* Missões

---

# Fase 10 — Banco de Dados

## Estrutura Necessária

Salvar:

* Personagem
* Inventário
* Nível
* Skills
* Equipamentos
* Progresso

## Sugestão

Utilizar estrutura modular e expansível.

---

# Arquitetura Recomendada

## Backend

Responsável por:

* Regras do jogo
* Combate
* Progressão
* Banco de dados
* Balanceamento

## Frontend

Responsável por:

* Interface
* Menus
* Animações
* Feedback visual

---

# Organização do Código

## Estrutura Recomendada

/src

/classes

/elements

/spells

/entities

/enemies

/items

/combat

/ui

/database

/utils

---

# Prioridade de Desenvolvimento

## Ordem Recomendada

### Primeiro

1. Sistema de atributos
2. Sistema de combate
3. Sistema de mana
4. Classes

### Segundo

5. Elementos
6. Magias
7. Balanceamento

### Terceiro

8. Inventário
9. NPCs
10. Interface completa

---

# Objetivos Técnicos

## O sistema deve:

* Ser modular
* Permitir adicionar novos elementos facilmente
* Permitir novas classes sem reescrever código
* Facilitar balanceamento
* Ser otimizado
* Permitir expansão futura

---

# Objetivos Criativos

## O jogo deve transmitir:

* Estratégia
* Progressão recompensadora
* Combates impactantes
* Identidade única entre classes
* Sensação de evolução constante

---

# Próximos Passos

## MVP (Versão Inicial)

A primeira versão deve conter:

* 2 classes
* 4 elementos
* 10 magias
* Sistema básico de combate
* Sistema de mana
* Inimigos simples
* Sistema de level

## Após o MVP

Adicionar:

* Novas regiões
* Bosses
* Sistema de guilda
* Multiplayer
* Eventos
* PvP

---

# Pedido para a Equipe de Desenvolvimento

Iniciar o projeto utilizando arquitetura modular.

Priorizar:

1. Escalabilidade
2. Organização
3. Facilidade de balanceamento
4. Sistema de combate funcional

O objetivo inicial é criar uma base sólida e divertida antes da expansão do conteúdo.

---

# Minha opinião

O maior diferencial desse sistema é o fato de ele não depender apenas de dano bruto. O sistema de mana, os elementos e as diferenças entre classes podem criar combates muito estratégicos. Se o balanceamento for bem feito desde o início, esse projeto tem potencial para virar algo realmente muito marcante.
