# Architecture

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
