# Roadmap: Sistema RPG

## Overview

Este roadmap orienta o desenvolvimento do MVP (Mínimo Produto Viável) do Sistema de RPG, focando na criação de uma engine de combate por turnos modular e equilibrada. Partimos da modelagem básica de dados e classes de personagens, passando pelo motor elemental de magias, a inteligência de combate, até a entrega de um loop jogável em terminal interativo de console.

## Phases

- [ ] **Phase 1: Núcleo Estatístico e Personagem** - Criação de atributos, classes base, raças e gerenciamento estratégico de mana e XP/nível.
- [ ] **Phase 2: Motor Elemental e Magias** - Desenvolvimento dos reatores elementais, magias com custos/raridade e efeitos secundários (queimadura, lentidão, dreno).
- [ ] **Phase 3: Motor de Combate e IA** - Construção do fluxo de turnos, cálculo dinâmico de mitigação de dano, chance crítica, esquiva e IA básica de inimigos.
- [ ] **Phase 4: Consolidação e Loop de Console** - Implementação da HUD no terminal, menus de escolha e loop interativo completo para validação e balanceamento do jogo.

---

## Phase Details

### Phase 1: Núcleo Estatístico e Personagem
**Goal**: Estabelecer a fundação de dados do sistema, modelando atributos, classes, raças (Humanos e sub-raças Oni), curva de experiência/nível e gerenciamento tático de mana.
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: STLV-01, STLV-02, STLV-03, CLRC-01, CLRC-02, MANA-01, MANA-02
**Success Criteria** (what must be TRUE):
  1. Personagem criado com classe/raça calculando corretamente os atributos iniciais e aplicando modificadores estatísticos (ex: raça Oni).
  2. Ganho de XP simulado resulta em avanço de nível e escalonamento automático de atributos.
  3. Pool de mana máximo é respeitado e regeneração tática lenta ativa em combate vs rápida em descanso funciona de forma previsível.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Implementar classes base de Atributos, Personagem, especializações de Classe (Guerreiro, Mago) e Raça (Humanos, Oni).
- [ ] 01-02: Implementar motor de XP (evolução de nível) e gerenciador de regeneração/gasto de mana tática.

### Phase 2: Motor Elemental e Magias
**Goal**: Implementar a tabela de vantagens elementais e secundárias (Fogo, Água, Gelo, Sombras) e o sistema de conjuração de magias por cooldown, mana e fadiga.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: ELEM-01, ELEM-02, ELEM-03, STLV-04, MANA-03
**Success Criteria** (what must be TRUE):
  1. Magias possuem custo de mana, cooldown, elemento e raridade respeitados durante a conjuração.
  2. Amplificação de dano por vantagem elemental (ex: Água vence Fogo) é aplicada corretamente no cálculo de dano.
  3. Efeitos contínuos (queimadura) ou debuffs (lentidão, dreno de mana) são devidamente ativados e aplicados no alvo.
  4. Magias lendárias ou de altíssimo custo aplicam corretamente o efeito de fadiga.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Desenvolver sistema elemental com vantagens, fraquezas e efeitos secundários de status contínuos.
- [ ] 02-02: Criar repositório com as 10 magias do MVP catalogadas por raridades, com checagem de nível, consumo de mana e fadiga.

### Phase 3: Motor de Combate e IA
**Goal**: Implementar o motor físico e de lógica de batalha por turnos sequenciais, cálculo de iniciativa, mitigação de dano, chance crítica, esquivas e IA de inimigos simples.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: CMBT-01, CMBT-02, CMBT-03
**Success Criteria** (what must be TRUE):
  1. Ordem de turnos calculada e ordenada de forma decrescente pela velocidade dos combatentes.
  2. Ataques e magias calculam com precisão esquiva (baseada em velocidade), mitigação por defesa física e acerto crítico.
  3. Inimigos agem de forma autônoma atacando alvos debilitados ou disparando magias se possuírem mana suficiente.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Desenvolver a máquina de estados de Combate em Turnos com ordenação por velocidade e fila de ações.
- [ ] 03-02: Implementar fórmulas de combate (crítico, esquiva, mitigação de dano) e inteligência artificial para o oponente.

### Phase 4: Consolidação e Loop de Console
**Goal**: Criar o loop de jogo jogável no console através do terminal interativo, com exibição de HUD atualizada em cada turno e validação do balanceamento do MVP.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: (Consolidação geral do MVP)
**Success Criteria** (what must be TRUE):
  1. Jogador pode jogar uma partida interativa de combate completa em terminal no console através de entradas textuais.
  2. HUD do terminal atualiza em tempo real mostrando HP, Mana, Cooldowns e efeitos de status ativos dos personagens e inimigos.
  3. O balanceamento do jogo permite vitória e derrota justas em testes contínuos de jogabilidade.
**Plans**: 1 plan

Plans:
- [ ] 04-01: Implementar interface interativa rica em console (CLI), loop principal do jogo e rodar testes de balanceamento de classes.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Núcleo Estatístico | v1.0 MVP | 0/2 | Not started | - |
| 2. Motor Elemental | v1.0 MVP | 0/2 | Not started | - |
| 3. Motor de Combate | v1.0 MVP | 0/2 | Not started | - |
| 4. Loop de Console | v1.0 MVP | 0/1 | Not started | - |
