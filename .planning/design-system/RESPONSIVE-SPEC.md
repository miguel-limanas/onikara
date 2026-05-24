# Responsividade do Design System Onikara

## Princípio

Onikara deve abrir e permanecer operável em mobile, tablet e desktop. A abordagem é mobile-first: o layout padrão é pensado para telas pequenas e os breakpoints ampliam densidade, colunas e navegação quando houver espaço.

## Breakpoints

| Faixa | Largura | Regra de layout |
|-------|---------|-----------------|
| Mobile pequeno | 320px a 374px | Uma coluna, botões em largura confortável, tabelas com rolagem horizontal. |
| Mobile padrão | 375px a 767px | Uma coluna, navegação por grupos empilhados, prioridade para login/contexto/shell ativo. |
| Tablet | 768px a 1023px | Duas colunas quando o conteúdo permitir, navegação ainda flexível. |
| Desktop | 1024px a 1439px | Duas ou três colunas, tabelas densas, shells com painéis laterais. |
| Wide desktop | 1440px+ | Container máximo controlado, sem texto esticado de ponta a ponta. |

## Regras Obrigatórias

- Todo HTML deve manter `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Usar `min-height: 100dvh` em superfícies de tela cheia para respeitar chrome móvel.
- Alvos de toque primários devem ter pelo menos `44px` de altura e largura.
- O layout não deve gerar rolagem horizontal global.
- Tabelas podem rolar horizontalmente dentro de `.ok-table-wrap`; a página inteira não.
- Formulários devem usar `label` visível, `autocomplete` e `inputmode` quando aplicável.
- Navegação de shells deve quebrar linha em mobile e não depender de hover.
- O botão voltar do navegador/app deve preservar o fluxo: portal -> seleção de contexto -> shell.
- Todo shell deve ter rota isolada: `/admin`, `/player` e `/master` não aparecem como fichas simultâneas em uma tela operacional.
- Conteúdo textual deve quebrar linha naturalmente; não usar texto fixo que force overflow.

## Estrutura Mobile

### Portal

No mobile, o portal deve priorizar:

1. identificação visual da Onikara;
2. campo de ID/login;
3. campo de senha;
4. ação de autenticação;
5. lista de contextos disponíveis.

### Seleção de Contexto

Cada contexto aparece como bloco de largura total:

- tipo de acesso: player, master ou admin;
- nome do personagem ou campanha;
- explicação curta do escopo;
- ação clara para abrir o shell.

Exemplo: Miguel escolhe `Akio na Campanha X` para entrar como player ou `Campanha Y` para entrar como master.

### Shells

No mobile, cada shell mostra apenas sua própria navegação. O shell player não exibe controles de master/admin, e o shell master não exibe controles globais de plataforma.

## Estrutura Tablet/Desktop

Em tablet e desktop:

- o portal pode usar duas colunas: autenticação e contextos;
- shells podem usar duas colunas: resumo/estado e tabela/dados;
- previews de logotipo podem usar três colunas;
- componentes podem aparecer em grade, desde que mantenham leitura e foco.

## Validação Manual

Antes de aprovar uma tela baseada neste design system, validar:

- 320px: nenhum elemento ultrapassa a largura da viewport.
- 375px: login, contexto e shell são operáveis com toque.
- 768px: grids de duas colunas não comprimem textos.
- 1024px: tabelas e navegação ficam legíveis sem excesso de espaço vazio.
- 1440px: container máximo impede linhas de texto longas demais.
- Orientação landscape em mobile: conteúdo continua rolável e acessível.
- `prefers-reduced-motion`: transições são reduzidas.
- Navegação por teclado: skip link, campos, botões e tabs seguem ordem visual.

## Limitações Atuais do Preview

O preview é estático. Ele demonstra estrutura responsiva, ordem de conteúdo e estados visuais, mas não implementa troca real de rota, histórico do navegador ou comportamento de tabs. Esses comportamentos devem ser implementados nas fases de UI reais seguindo este contrato.
