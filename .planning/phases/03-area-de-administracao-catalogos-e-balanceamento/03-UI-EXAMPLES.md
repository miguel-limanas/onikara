# Phase 3: Exemplos UI Propostos - Onikara Admin

**Origem:** UI UX Pro Max + design system Onikara + mockups `.planning/design-system/onikara_landing.html` e `.planning/design-system/onikara_admin.html`.

## Direção Geral

O admin deve parecer um painel operacional de uma organização de contenção sobrenatural: escuro, premium, disciplinado e eficiente. O visual não deve competir com CRUD, tabelas e formulários.

## Exemplo 1: Portal/Login

**Layout proposto**

- Primeiro viewport com marca Onikara como selo institucional.
- Coluna principal: identificação do sistema, status curto e formulário de login.
- Coluna secundária em desktop: status operacional, última sincronização, contextos disponíveis após autenticação.
- Mobile: formulário primeiro, contextos abaixo.

**Controles**

- Campo `email` com label visível, `autocomplete="email"` e erro inline.
- Campo senha com label visível, `autocomplete="current-password"` e botão textual/ícone para revelar senha se implementado.
- Botão principal `Entrar no sistema` com loading e disabled durante submit.
- Estado sem permissão: painel bloqueado com mensagem clara e ação de sair.

**Exemplo de conteúdo**

- Título: `ONIKARA`
- Subtítulo: `Portal de contenção e balanceamento`
- Status: `Supabase local conectado`, `Sessão protegida por RLS`, `Admin requerido`

## Exemplo 2: Shell Administrativo

**Layout proposto**

- Header compacto com logo/selo, ambiente, usuário e ação de logout.
- Sidebar em desktop; navegação horizontal/empilhada em mobile.
- Main area com toolbar fixa no topo do conteúdo, não no viewport inteiro.
- Breadcrumb simples: `Admin / Catálogos / Magias`.

**Navegação inicial**

- Dashboard
- Catálogos
- Relacionamentos
- Balanceamento
- Auditoria
- Suporte

## Exemplo 3: Dashboard Operacional

**Blocos**

- `Catálogos ativos`: classes, raças, magias, itens, inimigos, missões.
- `Regras ativas`: progressão, mana, combate, raridade, loot.
- `Pendências`: drafts, registros sem vínculo, JSON inválido localmente, conteúdo arquivado.
- `Atividade recente`: últimas entradas de `admin_audit_logs`.

**UI**

- Cards pequenos de métrica, não hero cards enormes.
- Tabela curta de auditoria recente.
- Badges `active`, `draft`, `archived`.
- Estados de skeleton para carregamento.

## Exemplo 4: Tabela de Catálogos

**Toolbar**

- Busca textual.
- Select de entidade: classes, raças, elementos, status, magias, itens, inimigos, missões.
- Filtros por raridade/elemento/status quando aplicável.
- Botão `Novo registro`.

**Tabela**

- Colunas comuns: ID, Nome, Tipo/Elemento, Status/Raridade, Atualizado em, Ações.
- Ações: editar, duplicar quando útil, arquivar/publicar quando suportado, excluir apenas quando seguro.
- Wrapper `.ok-table-wrap` para rolagem horizontal local.

**Mobile**

- Manter tabela rolável dentro do wrapper; se ficar ilegível, usar lista compacta por registro.

## Exemplo 5: Formulário/Drawer de Edição

**Estrutura**

- Título com entidade e ID.
- Campos escalares primeiro.
- Selects relacionais depois.
- Editor JSON em bloco próprio com validação.
- Rodapé com salvar/cancelar e estado de alterações pendentes.

**Validação**

- ID obrigatório e slug seguro.
- Nome obrigatório.
- Números com `min` coerente (`mana_cost >= 0`, `unlock_level >= 1`).
- JSON precisa parsear antes do submit.
- Erros aparecem junto ao campo.

## Exemplo 6: Relacionamentos

**Classe-Magia**

- Coluna esquerda: classe selecionada.
- Coluna direita: magias disponíveis.
- Tabela de vínculos com `unlock_level`.

**Inimigo-Magia**

- Inimigo selecionado.
- Magias vinculadas com `weight`.

**Etapas de Missão**

- Quest selecionada.
- Lista ordenada de `quest_steps`.
- Campo `step_order` visível e validado.

## Exemplo 7: Balanceamento

**Tabs**

- Progressão
- Mana
- Combate
- Raridade
- Loot

**Estado**

- Cada tabela mostra `draft`, `active`, `archived`.
- Deve existir destaque claro para versão ativa.
- Publicação/arquivamento precisa de confirmação.

**Editor**

- Campos principais legíveis.
- JSON estruturado validado.
- Preview textual da regra ativa quando possível.

## Exemplo 8: Auditoria

**Filtros**

- Entidade.
- Operação.
- Usuário.
- Data.

**Tabela**

- Timestamp.
- Ator.
- Ação.
- Entidade.
- ID.
- Indicador `redacted`.
- Ação `Ver detalhes`.

**Detalhe**

- Modal/drawer com antes/depois em JSON formatado.
- Logs redigidos devem dizer que dados sensíveis foram ocultados.

## Exemplo 9: Suporte Inicial

**Escopo**

- Leitura de perfis, inventário, equipamentos, missões e sessões de combate.
- Ações mutáveis só se houver RPC segura e auditada.

**UI**

- Busca por personagem/usuário.
- Painel de perfil.
- Tabelas relacionadas em tabs.
- Botões perigosos separados visualmente e confirmados.

## Checklist Visual para Execução

- Contraste mínimo 4.5:1.
- Foco visível em todos os controles.
- Controles primários com 44px mínimos.
- Estados loading/error/success/empty/disabled.
- `prefers-reduced-motion`.
- Sem emojis como ícones estruturais.
- Sem rolagem horizontal global.
- Tabelas dentro de wrapper dedicado.
- Formulários com labels reais e validação inline.
