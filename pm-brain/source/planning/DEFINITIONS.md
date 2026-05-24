# DOCUMENTAÇÃO COMPLETA — SISTEMA RPG

## Visão Geral do Projeto

Este projeto é um sistema de RPG original focado em:

* Estratégia
* Progressão constante
* Combate por turnos
* Classes distintas
* Sistema de mana inteligente
* Elementos com interações reais
* Evolução de personagem
* Expansão modular

A ideia central do sistema é criar um RPG onde:

* O jogador precisa administrar recursos.
* As decisões durante o combate importam.
* Os elementos possuem impacto real.
* Cada classe tenha identidade própria.
* O sistema possa crescer futuramente sem precisar ser refeito.

---

# Filosofia do Sistema

O sistema NÃO deve ser baseado apenas em:

* Dano bruto
* Spam de habilidades
* Progressão infinita sem estratégia

O foco principal é:

* Gestão de mana
* Escolha estratégica de magias
* Vantagens elementais
* Builds diferentes
* Posicionamento tático
* Combates mais inteligentes

---

# Estrutura Geral

## O sistema será dividido em:

1. Sistema de atributos
2. Sistema de level e XP
3. Sistema de mana
4. Sistema de classes
5. Sistema elemental
6. Sistema de magias
7. Sistema de combate
8. Sistema de raças
9. Sistema de inventário
10. Sistema de NPCs
11. Sistema de missões
12. Interface do usuário
13. Banco de dados
14. Balanceamento
15. Expansões futuras

---

# Sistema de Atributos

## Atributos Base

### Vida (HP)

Quantidade de dano que o personagem pode sofrer.

### Mana (MP)

Recurso utilizado para magias e habilidades.

### Força

Aumenta dano físico.

### Defesa

Reduz dano recebido.

### Inteligência

Aumenta dano mágico e eficiência de habilidades.

### Velocidade

Determina ordem dos turnos.

### Resistência

Reduz efeitos negativos.

### Resistência Elemental

Reduz dano de elementos específicos.

### Chance Crítica

Chance de causar dano aumentado.

### Esquiva

Chance de evitar ataques.

---

# Sistema de Progressão

## Sistema de Level

Cada inimigo derrotado concede XP.

Ao subir de nível:

* Atributos aumentam.
* Novas magias são desbloqueadas.
* Algumas classes recebem bônus específicos.

## Escalamento

### Regiões

As regiões devem possuir:

* Nível mínimo recomendado
* Inimigos próprios
* Resistências específicas

### Progressão

O jogador deve sentir:

* Evolução constante
* Aumento gradual de poder
* Desbloqueio de novas estratégias

---

# Sistema de Mana

## Conceito Principal

Mana é um recurso estratégico.

O jogador NÃO deve conseguir usar habilidades fortes infinitamente.

## Regras

* Mana limitada.
* Regeneração lenta em combate.
* Regeneração rápida fora de combate.
* Habilidades avançadas possuem custo elevado.
* Algumas magias consomem porcentagem da mana total.

## Mecânicas Futuras

### Overload Mágico

Uso excessivo de mana pode:

* Aplicar debuffs.
* Reduzir regeneração.
* Impedir uso temporário de magia.

### Fadiga

Magias lendárias podem:

* Reduzir velocidade.
* Diminuir defesa.
* Aplicar exaustão.

---

# Sistema de Classes

## Objetivo

Cada classe precisa ter:

* Identidade única.
* Gameplay própria.
* Vantagens e fraquezas.

---

## Classes Iniciais

### Guerreiro

Foco:

* Combate físico
* Resistência
* HP alto

Características:

* Baixo uso de mana
* Alto sustain
* Bom contra inimigos frágeis

---

### Mago

Foco:

* Dano elemental
* Controle de área
* Alto burst

Características:

* Mana elevada
* Defesa baixa
* Dependente de posicionamento

---

### Assassino

Foco:

* Crítico
* Velocidade
* Execução rápida

Características:

* Baixa defesa
* Alto dano isolado
* Mobilidade elevada

---

### Tank

Foco:

* Proteção
* Provocação
* Mitigação de dano

Características:

* Defesa extremamente alta
* Baixo dano
* Controle defensivo

---

### Suporte

Foco:

* Cura
* Buffs
* Controle secundário

Características:

* Sustentação do time
* Controle estratégico
* Dependência de aliados

---

# Sistema Elemental

## Elementos Base

* Fogo
* Água
* Terra
* Ar
* Raio
* Gelo
* Luz
* Sombras

---

# Interações Elementais

## Exemplos

### Água

* Forte contra fogo.
* Fraco contra raio.

### Fogo

* Forte contra gelo.
* Fraco contra água.

### Luz

* Forte contra sombras.

### Terra

* Resistente a raio.

---

# Efeitos Secundários

## Fogo

Aplica queimadura.

## Gelo

Aplica lentidão.

## Raio

Pode causar paralisia.

## Sombras

Pode drenar mana.

## Água

Pode reduzir precisão.

## Terra

Pode aumentar defesa.

---

# Sistema de Magias

## Estrutura das Magias

Cada magia deve possuir:

* Nome
* Elemento
* Tipo
* Dano
* Custo de mana
* Cooldown
* Escalamento
* Efeito secundário
* Nível necessário
* Raridade

---

# Classificação das Magias

## Comum

* Baixo dano
* Baixo custo
* Uso frequente

## Rara

* Dano moderado
* Efeitos extras

## Épica

* Grande impacto
* Alto custo

## Lendária

* Extremamente poderosa
* Grande cooldown
* Alto risco

---

# Balanceamento de Mana

## Filosofia

Quanto maior:

* Dano
* Controle
* Alcance
* Efeito secundário

Maior deve ser:

* Custo de mana
* Cooldown
* Risco

---

# Sistema de Raças

## Raças Base

* Humanos
* Onis
* Elfos
* Bestiais

---

# Sistema Oni

## Oni Fraco

Características:

* Mais velocidade
* Menos resistência
* Maior esquiva

---

## Oni Médio

Características:

* Balanceado
* Bom para iniciantes

---

## Oni Forte

Características:

* Muito dano
* Defesa elevada
* Velocidade baixa

---

# Sistema de Combate

## Modelo

Combate por turnos.

---

# Mecânicas de Combate

## Ordem de Turnos

Definida pela velocidade.

## Crítico

Multiplica dano.

## Esquiva

Permite evitar ataques.

## Buffs

Aumentam atributos temporariamente.

## Debuffs

Reduzem atributos ou aplicam efeitos negativos.

## Efeitos Contínuos

Exemplo:

* Queimadura
* Veneno
* Sangramento
* Congelamento

---

# Inteligência Artificial dos Inimigos

## Os inimigos devem:

* Explorar fraquezas.
* Priorizar sobrevivência.
* Utilizar habilidades especiais.
* Defender quando necessário.
* Atacar alvos vulneráveis.

---

# Sistema de Inventário

## Categorias

### Armas

### Armaduras

### Acessórios

### Artefatos

### Consumíveis

---

# Sistema de Raridade

* Comum
* Raro
* Épico
* Lendário

---

# Efeitos de Equipamentos

Itens podem:

* Aumentar mana.
* Reduzir cooldown.
* Melhorar dano elemental.
* Aumentar crítico.
* Melhorar regeneração.

---

# Sistema de NPCs

## Tipos

### Comerciantes

Vendem itens.

### Mestres

Ensinam habilidades.

### NPCs de Lore

Expandem história.

### NPCs Secretos

Eventos especiais.

---

# Sistema de Missões

## Tipos de Missão

### História Principal

Avança narrativa.

### Caça

Eliminar monstros.

### Exploração

Descobrir regiões.

### Eventos

Missões temporárias.

---

# Interface do Usuário

## HUD

Necessário:

* Barra de HP
* Barra de mana
* Cooldowns
* Status
* Ordem de turno

---

# Menus

## Inventário

## Equipamentos

## Habilidades

## Árvore de Skills

## Missões

---

# Banco de Dados

## Deve armazenar:

* Personagem
* Nível
* Inventário
* Skills
* Equipamentos
* Progresso
* Missões

---

# Estrutura Recomendada

```txt
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
```

---

# Arquitetura Recomendada

## Backend

Responsável por:

* Regras do jogo
* Combate
* Banco de dados
* Balanceamento

---

## Frontend

Responsável por:

* Interface
* Menus
* Feedback visual
* Efeitos
* HUD

---

# Ordem Recomendada de Desenvolvimento

## Primeira Etapa

1. Sistema de atributos
2. Sistema de combate
3. Sistema de mana
4. Sistema de level

---

## Segunda Etapa

5. Classes
6. Elementos
7. Magias
8. Balanceamento

---

## Terceira Etapa

9. Inventário
10. NPCs
11. Missões
12. Interface completa

---

# MVP (Versão Inicial)

A primeira versão deve conter:

* 2 classes
* 4 elementos
* Sistema básico de combate
* Sistema de mana
* 10 magias
* Inimigos simples
* Sistema de XP

---

# Expansões Futuras

## Possíveis expansões:

* Multiplayer
* Guildas
* PvP
* Bosses mundiais
* Eventos sazonais
* Mercado entre jogadores
* Dungeons
* Sistema de pets
* Crafting

---

# Objetivos Técnicos

O sistema deve:

* Ser modular
* Ser escalável
* Facilitar balanceamento
* Permitir expansão fácil
* Possuir boa organização
* Evitar código acoplado

---

# Objetivos Criativos

O jogo deve transmitir:

* Evolução constante
* Estratégia
* Sensação de poder crescente
* Identidade única entre classes
* Progressão recompensadora

---

# Diretrizes de Balanceamento

## O jogo NÃO deve:

* Ter habilidades infinitamente fortes.
* Permitir spam sem consequência.
* Possuir apenas uma build dominante.

## O jogo DEVE:

* Incentivar estratégia.
* Permitir estilos variados.
* Premiar planejamento.
* Manter desafios relevantes.

---

# Ideias Futuras de Sistema

## Possíveis Mecânicas

### Sistema de Clima

O clima altera elementos.

Exemplo:

* Chuva fortalece água.
* Tempestade fortalece raio.

---

### Sistema de Afinidade

Personagens podem:

* Ganhar afinidade elemental.
* Evoluir magias.
* Especializar builds.

---

### Sistema de Corrupção

Uso excessivo de magia sombria pode:

* Alterar aparência.
* Modificar habilidades.
* Desbloquear poderes.

---

# Resumo Final

O projeto busca criar:

* Um RPG estratégico.
* Modular.
* Escalável.
* Focado em progressão.
* Com identidade forte.
* E combate baseado em decisões.

O maior diferencial é a combinação entre:

* Sistema de mana estratégico
* Interações elementais
* Classes únicas
* Combates inteligentes
* Balanceamento pensado desde o início

---

# Minha opinião

O sistema já possui uma base extremamente forte para crescer futuramente. O diferencial mais importante é que ele não depende apenas de números altos, mas de estratégia, recursos e escolhas durante o combate. Se o desenvolvimento continuar organizado desde o início, esse projeto pode facilmente evoluir para algo muito maior no futuro.

---

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
