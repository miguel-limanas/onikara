# Kit Inicial do Design System Onikara

## Base UI/UX Pro Max

A redefinição do kit inicial usa a skill `ui-ux-pro-max` como referência de qualidade visual e UX. As recomendações automáticas relevantes foram adaptadas para a marca Onikara:

- **Padrão estrutural**: Enterprise Gateway, aplicado como portal de autenticação e seleção de contexto.
- **Estilo principal**: Dark Mode OLED, adaptado para preto institucional, carmesim e dourado velho.
- **Acessibilidade prioritária**: navegação por teclado, skip link, heading hierarchy, foco visível e contraste alto.
- **Responsividade**: mobile-first real, com densidade progressiva apenas em tablet e desktop.
- **Formulários**: labels visíveis, `autocomplete`, `inputmode` e mensagens auxiliares.
- **Tabelas**: rolagem horizontal contida em wrapper, sem rolagem global da página.

## Princípios Visuais

- Onikara é um sistema operacional de contenção sobrenatural, não uma landing page genérica.
- A interface deve parecer institucional, tática, escura e premium.
- O logotipo é selo de autoridade, não ornamento repetido.
- Carmesim indica ameaça, energia Oni, perigo e ação crítica.
- Dourado velho indica autoridade, raridade, hierarquia e prestígio.
- Azul aparece apenas como semântica de mana/player, não como cor dominante da marca.

## Layout Inicial

### Portal

O portal é o primeiro ponto de entrada. Ele contém:

- wordmark ONIKARA em caixa alta;
- logotipo institucional;
- login/ID;
- senha;
- ação de autenticação;
- lista de contextos disponíveis após autenticação.

### Seleção de Contexto

Cada contexto é um bloco de escolha independente:

- Player: personagem em uma campanha específica.
- Master: campanha regida pelo usuário.
- Admin: plataforma, apenas quando houver permissão administrativa.

O usuário nunca vê `/admin`, `/player` e `/master` como fichas simultâneas de um mesmo painel operacional. Ele escolhe um contexto e entra em um shell isolado.

### Shells

Cada shell possui navegação própria:

- `/player`: ficha, missão, inventário e combate.
- `/master`: campanha, cena, mobs, ambiente e fichas em somente leitura.
- `/admin`: tabelas, formulários, auditoria e configurações da plataforma.

## Componentes Iniciais

| Componente | Classe | Uso |
|------------|--------|-----|
| Botão | `.ok-button` | Ações primárias, secundárias, loading, erro, sucesso e disabled. |
| Campo | `.ok-input` | Login, filtros e formulários. |
| Select | `.ok-select` | Seleções de missão, contexto e filtros. |
| Modal | `.ok-modal` | Confirmações focadas, perigo e mensagens formais do sistema. |
| Tabs | `.ok-tab` | Navegação interna de shell. |
| Tabela | `.ok-table` | Dados densos, sempre dentro de `.ok-table-wrap`. |
| Badge | `.ok-badge` | Raridade, status e marcadores compactos. |
| Toast | `.ok-toast` | Feedback não bloqueante. |
| Empty state | `.ok-empty` | Ausência de dados com mensagem clara. |
| Stat bar | `.ok-stat-bar` | HP, mana e recursos de personagem. |
| Toolbar | `.ok-toolbar` | Agrupamento de ações rápidas sem quebrar touch targets. |
| Access option | `.ok-access-option` | Seleção de contexto pós-login. |
| Route shell | `.ok-route-shell` | Superfície isolada de `/admin`, `/player` ou `/master`. |

## Estados Obrigatórios

- Normal
- Hover
- Focus-visible
- Loading
- Success
- Error
- Disabled
- Empty
- Somente leitura

## Tokens

Os tokens ficam em dois níveis:

- Base: `--oni-*`, `--space-*`, `--text-*`, `--radius-*`, `--motion-*`.
- Semânticos: `--color-*`, `--mode-*`, `--color-hp`, `--color-mana`, `--color-rarity-*`, `--color-element-*`.

Componentes devem usar tokens semânticos sempre que possível.

## Responsividade

O CSS é mobile-first:

- padrão: uma coluna;
- `min-width: 781px`: duas ou três colunas quando couber;
- `min-width: 1025px`: grids de quatro colunas quando necessário;
- mobile pequeno mantém logotipo e cards compactos;
- tabelas rolam apenas dentro do wrapper.

## Arquivos do Kit

- `.planning/design-system/BRAND.md`
- `.planning/design-system/INITIAL-KIT.md`
- `.planning/design-system/RESPONSIVE-SPEC.md`
- `.planning/design-system/LOGO-APPLICATIONS.md`
- `.planning/design-system/ACCESSIBILITY-REVIEW.md`
- `.planning/design-system/tokens.css`
- `.planning/design-system/components.css`
- `.planning/design-system/preview.html`
- `.planning/design-system/MOCKUPS.md`
- `.planning/design-system/onikara_landing.html`
- `.planning/design-system/onikara_admin.html`
- `.planning/design-system/onikara_dashboard.html`
- `.planning/design-system/assets/README.md`

## Critério de Evolução

Fases futuras devem reutilizar este kit antes de criar estilos novos. Se uma tela precisar de variação, ela deve ser adicionada como extensão documentada, não como exceção solta.
