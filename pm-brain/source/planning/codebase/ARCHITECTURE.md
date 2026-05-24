# Architecture

## Produto: Onikara

Onikara passa a ser organizado em duas experiências de interface sobre a mesma base Supabase:

- **Área de administração (`/admin`)**: configura conteúdo, balanceamento, regras, catálogos, jogadores e suporte operacional.
- **Área de interação dos jogadores (`/play`)**: permite criar personagem, consultar progresso, gerenciar inventário/magias/missões e jogar combates.

O Supabase deve continuar sendo a plataforma base: Auth para identidade, Postgres para dados, RLS para isolamento, PostgREST/Supabase JS para acesso, Realtime para eventos vivos e Storage para assets visuais.

## Arquitetura da Área de Administração

- **Auth e papéis**: administradores devem ser identificados por role segura em tabela/perfil administrativo, nunca por lógica apenas no frontend.
- **Catálogos editáveis**: telas para `rpg_classes`, `rpg_races`, `elements`, `status_effects`, `spells`, `items`, `enemies`, `quests` e tabelas de relação.
- **Configurações de plataforma**: tabelas específicas para regras de progressão, mana, combate e flags de conteúdo.
- **Auditoria**: registrar alterações administrativas relevantes com usuário, tabela, operação, antes/depois e timestamp.
- **Suporte**: visualização controlada de perfis, inventários, missões e sessões de combate para diagnosticar problemas.

## Arquitetura da Área do Jogador

- **Onboarding**: criação de perfil/personagem com classe e raça vindas dos catálogos publicados.
- **Dashboard do personagem**: atributos, nível, XP, estado atual, magias, inventário, equipamentos e missões.
- **Combate**: leitura/escrita em `combat_sessions`, `combat_participants` e `combat_events`, com HUD sincronizado e persistência por evento.
- **Estado privado**: dados do jogador devem continuar protegidos por RLS baseada em `auth.uid()`.

## UI/UX e Identidade

- **Admin Onikara**: interface operacional, clara, responsiva, com tabelas densas, filtros, validação inline e estados de carregamento.
- **Player Onikara**: interface imersiva, com HUD expressivo, leitura rápida de HP/mana/cooldowns/status e feedback de recompensa/progressão.
- **Design system compartilhado**: tokens de cor, tipografia, espaçamento, radius, sombra, raridade, elemento e estado de combate.
- **Acessibilidade**: contraste mínimo, foco visível, navegação por teclado, labels reais e componentes com estados completos.

A arquitetura do **Sistema RPG** segue o padrão de desacoplamento entre a **Interface do Usuário (HUD/Menus)**, o **Motor Lógico do Jogo (Game Engine)** e a **Camada de Persistência de Dados (Supabase/Docker)**.

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
