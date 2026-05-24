# Requirements: Sistema RPG

**Defined:** 2026-05-24
**Core Value:** Prover um motor de combate por turnos modular e facilmente balanceável, onde as fraquezas elementais e a gestão tática de mana sejam determinantes para a vitória.

## v1 Requirements

### Core Stats & Levels (STLV)

- [ ] **STLV-01**: Sistema de atributos básicos com HP, MP, Força, Defesa, Inteligência, Velocidade e Resistência Elemental.
- [ ] **STLV-02**: Sistema de experiência (XP) por combate e ganho de nível com curva de escalonamento.
- [ ] **STLV-03**: Aumento automático de atributos conforme a classe (Guerreiro vs Mago) ao subir de nível.
- [ ] **STLV-04**: Restrição de uso de magias de acordo com o nível mínimo exigido do personagem.

### Tactical Mana (MANA)

- [ ] **MANA-01**: Limitação de mana estratégica com custo de mana fixo ou percentual dependendo do tipo da magia.
- [ ] **MANA-02**: Regeneração lenta de mana ativa durante turnos de combate e regeneração acelerada fora de combate.
- [ ] **MANA-03**: Fadiga ou penalidades físicas ao conjurar magias lendárias ou de altíssimo custo.

### Classes & Races (CLRC)

- [ ] **CLRC-01**: Implementação das duas classes iniciais do MVP (Guerreiro e Mago) com atributos iniciais distintos.
- [ ] **CLRC-02**: Implementação das raças iniciais do MVP (Humanos e a raça Oni - incluindo Oni Fraco, Médio e Forte) com modificadores de atributos.

### Combat Engine (CMBT)

- [ ] **CMBT-01**: Motor de combate por turnos sequencial com cálculo de ordem por velocidade das entidades.
- [ ] **CMBT-02**: Cálculo dinâmico de dano baseado em atributos físicos/mágicos, chance crítica, esquiva e mitigação por defesa.
- [ ] **CMBT-03**: IA simples para os inimigos (atacar jogador com menor vida ou usar habilidades especiais se houver mana).

### Elemental Magic (ELEM)

- [ ] **ELEM-01**: Mecânica elemental com reações e vantagens de dano para os 4 elementos do MVP: Fogo, Água, Gelo e Sombras.
- [ ] **ELEM-02**: Aplicação de efeitos secundários (queimadura do Fogo, lentidão do Gelo e dreno de mana da Sombra).
- [ ] **ELEM-03**: Implementação de 10 magias específicas para o MVP divididas entre as raridades Comum, Rara, Épica e Lendária.

---

## v2 Requirements

### Classes & Elements (v2)

- **CLRC-03**: Classes adicionais: Assassino, Tank, Suporte.
- **ELEM-04**: Elementos adicionais: Terra, Ar, Raio, Luz.

### Combat AI (v2)

- **CMBT-04**: IA avançada de inimigos que analisa dinamicamente vantagens elementais e decide defender ou curar estrategicamente.

### Equipment & Inventory (v2)

- **EQIP-01**: Sistema de inventário e equipamentos (Armas, Armaduras, Acessórios e Artefatos).
- **EQIP-02**: Modificadores de status por equipamentos com níveis de raridade (Comum, Rara, Épica, Lendária).

### NPCs & Quests (v2)

- **NPCQ-01**: NPCs de interação no mundo (Comerciantes, Mestres de Skills, NPCs de lore).
- **NPCQ-02**: Sistema de missões (Missões de Caça, Exploração e História Principal).

### UI & DB (v2)

- **UIDB-01**: Interface Gráfica (HUD completo de HP, Mana, Cooldowns, Menus para inventário/skills).
- **UIDB-02**: Integração com Banco de Dados modular de salvamento de estado do personagem.
- **UIDB-03**: Área de administração para configurar catálogos, balanceamento, regras, jogadores e suporte operacional usando Supabase.
- **UIDB-04**: Área de interação dos jogadores para criação de personagem, progressão, inventário, missões e combate persistido.
- **UIDB-05**: Identidade visual Onikara aplicada de forma consistente na administração e na área do jogador, com design system acessível.

### Platform Administration (ADMIN)

- **ADMIN-01**: Papéis administrativos seguros com RLS para restringir escrita de catálogos e leitura de dados sensíveis.
- **ADMIN-02**: Auditoria de alterações administrativas relevantes com usuário, operação, alvo, timestamp e payload de mudança.
- **ADMIN-03**: Configuração versionada de regras globais de progressão, mana, combate, raridade e loot.
- **ADMIN-04**: Painéis administrativos com métricas básicas de jogadores, combates, uso de magias e progressão.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STLV-01 | Phase 1 | Pending |
| STLV-02 | Phase 1 | Pending |
| STLV-03 | Phase 1 | Pending |
| MANA-01 | Phase 1 | Pending |
| MANA-02 | Phase 1 | Pending |
| CLRC-01 | Phase 1 | Pending |
| CLRC-02 | Phase 1 | Pending |
| ELEM-01 | Phase 2 | Pending |
| ELEM-02 | Phase 2 | Pending |
| ELEM-03 | Phase 2 | Pending |
| STLV-04 | Phase 2 | Pending |
| MANA-03 | Phase 2 | Pending |
| CMBT-01 | Phase 3 | Pending |
| CMBT-02 | Phase 3 | Pending |
| CMBT-03 | Phase 3 | Pending |
| UIDB-01 | Phase 2, Phase 4, Phase 5 | Pending |
| UIDB-02 | Phase 1, Phase 4, Phase 5 | Complete |
| UIDB-03 | Phase 3 | Pending |
| UIDB-04 | Phase 4, Phase 5 | Pending |
| UIDB-05 | Phase 2 | Pending |
| ADMIN-01 | Phase 1 | Complete |
| ADMIN-02 | Phase 1, Phase 3, Phase 6 | Complete |
| ADMIN-03 | Phase 1, Phase 3 | Complete |
| ADMIN-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Admin/player UI requirements: 9 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after initial definition*
