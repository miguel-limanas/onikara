# Onikara

Este repositório usa um PM Brain em [`pm-brain/`](./pm-brain/).

Ao iniciar uma tarefa de produto, estratégia, descoberta, hipótese, decisão, stakeholder ou manutenção, carregue primeiro [`pm-brain/CLAUDE.md`](./pm-brain/CLAUDE.md) e roteie pelo índice em [`pm-brain/INDEX.md`](./pm-brain/INDEX.md).

Mantenha `.claude/` na raiz: os comandos e hooks dependem desse local.

## Idioma dos artefatos

Escreva documentos, resumos, guias, relatórios, decisões e textos de preview em português brasileiro, com acentuação correta e registro de norma culta. Preserve em inglês apenas identificadores técnicos, nomes de arquivos, classes, tokens CSS, comandos, APIs e termos que façam parte do contrato técnico.

## Visão geral do produto

Onikara é uma plataforma original de RPG tático por turnos, centrada em fraquezas elementais e gestão tática de mana (classes, raças com Oni em níveis, magias por raridade, itens, NPCs e missões). Há duas áreas: o backoffice administrativo (`/admin`) e a experiência do jogador.

- Fonte de verdade do produto: [`.planning/PROJECT.md`](./.planning/PROJECT.md).
- Estado atual e próxima fase: [`.planning/STATE.md`](./.planning/STATE.md) e [`.planning/ROADMAP.md`](./.planning/ROADMAP.md). O desenvolvimento segue o fluxo GSD (`/gsd-*`), com planos por fase em `.planning/phases/`.
- Análises detalhadas de código: `.planning/codebase/` (`ARCHITECTURE.md`, `CONVENTIONS.md`, `STACK.md`).

## Stack e comandos

- JavaScript vanilla com ES modules (`"type": "module"`), **sem bundler e sem build**. O navegador carrega os arquivos de `src/` diretamente.
- `supabase-js` vem do CDN `esm.sh` em `src/services/supabaseClient.js`; o pacote em `node_modules` não é usado pelo navegador. Ao atualizar a versão, altere a URL de import.
- Backend: Supabase local via CLI (Docker Desktop precisa estar em execução).
- Não há testes automatizados, lint nem formatter configurados. Valide mudanças rodando o app.

| Comando | Efeito |
| --- | --- |
| `npm run supabase:start` | Sobe o Supabase local (API 54321, DB 54322, Studio 54323, Inbucket 54324). |
| `npm run dev` | Servidor estático em `http://127.0.0.1:4173/` (variável `PORT` sobrescreve). |
| `npm run supabase:status` / `supabase:stop` | Consulta ou para o Supabase local. |
| `npm run supabase:db:reset` | Recria o banco a partir das migrations e de `supabase/seed.sql`. **Apaga dados locais**; só rode quando pedido. |

## Estrutura

- `public/index.html`: login (CSS inline); após autenticar, redireciona para `/admin`.
- `public/admin.html`: casca que carrega `src/admin/adminApp.js` e `src/admin/admin.css`.
- `src/admin/`: `adminApp.js` (gate de sessão, navegação e roteamento de views) e views `*View.js`, que exportam `render*View`.
- `src/services/`: acesso a dados. `supabaseClient.js` expõe `runSupabase` e `normalizeSupabaseError`; os serviços `admin*.js` agrupam consultas por domínio.
- `src/ui/`: helpers compartilhados (`html`, `escapeHtml`, `formatDate`, `statusBadge`, toast, validação de formulários, `parseJSON`).
- `src/config/supabase.js`: resolução de URL e chave do Supabase.
- `supabase/migrations/` e `supabase/seed.sql`: schema, RLS e dados iniciais.
- `.planning/design-system/`: tokens (`tokens.css`), componentes (`components.css`) e identidade visual (`BRAND.md`).

## Padrões de código

- Todo acesso a dados passa por `runSupabase((client) => ...)`, que retorna `{ ok, data, count, error }` com o erro normalizado em pt-BR. Não chame o client fora desse wrapper.
- Catálogos administrativos são orientados a dados: para um novo catálogo, adicione uma entrada em `catalogDefinitions` (`src/services/adminCatalogs.js`) com `columns` e `fields`, em vez de criar uma tela nova.
- Renderize HTML com os helpers de `src/ui/components.js` e escape todo conteúdo dinâmico com `escapeHtml`.
- Somente exports nomeados; arquivos em camelCase; indentação de 2 espaços, aspas simples e vírgula final; comentários esparsos.
- CSS: use os tokens `--oni-*` do design system; variáveis locais do admin usam `--admin-*`; classes de componente usam o prefixo `ok-` com modificadores de estado `is-*`.
- Textos de interface em pt-BR com acentuação correta. Há strings antigas sem acento nos arquivos JS; corrija-as ao editar o trecho.
- Preserve a identidade dark fantasy/Oni: não transforme as telas em um dashboard SaaS genérico.

## Banco de dados e segurança

- Mudanças de schema entram como **nova** migration em `supabase/migrations/`. Não edite migrations já aplicadas sem combinar com o usuário.
- RLS está habilitada em todas as tabelas e toda tabela nova deve tê-la:
  - catálogos: leitura pública; escrita restrita a `is_admin()`;
  - regras versionadas (`progression_rules`, `mana_rules`, `combat_rules`, `rarity_rules`, `loot_rules`): `status` `active`/`archived`, expostas pelas views `active_*_rules`;
  - dados do jogador: escopo do dono (`auth.uid() = user_id`), mais leitura e gestão por admin.
- Papéis vêm de `app_metadata.app_role` (`player` por padrão, `admin`, `master`), lidos no SQL por `current_app_role()`, `is_admin()` e `is_master()` e no cliente por `getAppRole()`.
- Tabelas administráveis novas recebem os triggers `<tabela>_set_updated_at` e `<tabela>_admin_audit` (auditoria em `admin_audit_logs`).
- **Nunca** use a chave `service_role` no cliente: apenas a chave anon/publishable com a sessão do usuário. Ações sensíveis exigem RPC auditada no banco.
- Nomes de policies são frases em inglês (por exemplo, `admins can insert spells`).

## Armadilhas

- O servidor de desenvolvimento serve a **raiz do repositório**: `admin.css` importa `.planning/design-system/*.css` e `index.html` usa o logotipo em `.planning/design-system/assets/`. Não mova esses arquivos.
- Rotas limpas: `/` e `/admin`. Acessos a `*.html` recebem redirecionamento 308.
- URL e chave do Supabase são resolvidas nesta ordem: `globalThis.ONIKARA_SUPABASE_URL`/`ONIKARA_SUPABASE_ANON_KEY`, depois `localStorage` com as mesmas chaves, depois o padrão local. O `.env.example` não é lido pelo navegador.
- O app precisa de acesso à internet para `esm.sh` e Google Fonts.
- O hook de `.claude/settings.json` executa `python` a cada Write/Edit para validar arquivos do PM Brain; o Python precisa estar no PATH.
