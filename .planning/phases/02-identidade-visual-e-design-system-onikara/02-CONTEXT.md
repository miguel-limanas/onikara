# Phase 2: Identidade Visual e Design System Onikara - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Definir a identidade visual oficial de Onikara e criar um design system aplicavel aos tres modos conceituais do produto: admin, player e master. A fase deve produzir direcao de marca, tokens, componentes base, kit minimo de assets e preview HTML validavel para os modos.

Esta fase nao implementa funcionalidades completas de admin, player ou master, nem altera permissoes de backend. Ela define linguagem visual, contratos de UI e exemplos suficientes para orientar as fases seguintes.

</domain>

<decisions>
## Implementation Decisions

### Marca Oficial
- **D-01:** `.planning/sketches/onikara-logotipo.png` e o logotipo oficial da marca Onikara e deve ser tratado como referencia canonica da Fase 2.
- **D-02:** O logo deve funcionar primeiro como selo institucional do sistema, usado em header, login, documentos internos, loading, telas restritas e estados de autoridade.
- **D-03:** A leitura visual do logo e: mascara Oni simetrica, agressiva e limpa; preto quase absoluto; carmesim profundo; wordmark serifado, espacado, ritualistico e premium.
- **D-04:** A fase deve produzir um kit minimo oficial de assets: logo principal, simbolo isolado, versao monocromatica, favicon/app icon e regras de uso.
- **D-05:** Selos, padroes, texturas e ornamentos ritualisticos podem ser documentados como camada secundaria, mas nao devem inflar a entrega principal.

### Paleta e Tipografia
- **D-06:** A paleta base deve ser preto, carmesim e dourado velho. Preto e a superficie principal e autoridade institucional; carmesim substitui vermelho generico para ameaca, sangue, selo, alerta e energia Oni; dourado velho serve para hierarquia, raridade, brasoes, bordas finas e prestigio.
- **D-07:** Grafite nao deve ser cor dominante. Pode existir apenas como variacao tecnica/neutra de apoio.
- **D-08:** A tipografia deve combinar a serifada da marca, baseada no modelo do wordmark oficial, com uma sans operacional para UI densa.
- **D-09:** A serifada guia marca, titulos especiais, telas de acesso, documentos institucionais e momentos de autoridade. A sans operacional guia tabelas, formularios, filtros, menus, controles e leitura repetida.

### Modos de Produto
- **D-10:** Admin, player e master devem ser visualmente distintos, mas unidos por logo, paleta, tokens e linguagem Onikara.
- **D-11:** A entrada inicial deve ser um portal comum da Onikara. Depois do acesso, o usuario entra em shells separados: `/admin`, `/play` e futuramente `/master`.
- **D-12:** Admin deve ser um painel premium minimalista: dark, elegante, institucional e eficiente. Pode usar carmesim/dourado e sinais de contencao, mas nao deve virar central cinematografica nem prejudicar CRUD, tabelas e formularios.
- **D-13:** Player deve ser um HUD de cacador registrado: personagem, atributos, missao, HP/mana, status, inventario e progresso como equipamento operacional de campo.
- **D-14:** Master deve estar presente ja nesta fase como terceiro modo visual completo, nao apenas como ideia futura. Deve combinar console de narrador operacional e diretor tatico.
- **D-15:** O preview HTML deve mostrar o modo master com campanha, cena, mobs, mapa/ambiente e fichas de jogadores em leitura.

### Contrato Conceitual do Master
- **D-16:** Master e regente da campanha criada por ele, nao admin da plataforma.
- **D-17:** Master pode acessar arquivos, cenas, mobs, espacos/cenarios, encontros e informacoes da campanha que ele criou.
- **D-18:** Master pode ver fichas dos jogadores participantes da campanha, mas nao edita diretamente atributos, inventario, HP, mana, progresso global ou estado permanente do jogador.
- **D-19:** Alteracoes de consequencia devem acontecer por mecanicas/acoes futuras da campanha, nao por edicao livre de ficha.
- **D-20:** Master nao altera configuracoes globais do software, backend, catalogos globais, regras globais, permissoes de plataforma ou auditoria admin.
- **D-21:** Visualmente, master deve parecer poderoso dentro da campanha, mas nunca dono da plataforma.

### Tokens e Componentes
- **D-22:** Tokens devem existir em dois niveis: tokens base visuais e aliases semanticos por uso.
- **D-23:** Tokens base incluem escalas como preto, carmesim, dourado velho e neutros. Tokens semanticos incluem `surface`, `text`, `danger`, `hp`, `mana`, `rarity`, `element-fire`, `focus`, `disabled` e equivalentes.
- **D-24:** Componentes devem usar tokens semanticos sempre que possivel; tokens base servem para documentacao, composicao e extensao.
- **D-25:** Componentes obrigatorios da fase: button, input, select, modal, tabs, table, badge, toast, stat bar e command/action toolbar.
- **D-26:** Componentes devem contemplar estados de loading, empty quando aplicavel, error, disabled, focus e success.
- **D-27:** A entrega deve incluir Markdown de design system, CSS com tokens oficiais e uma pagina HTML estatica de preview visual.

### Acessibilidade
- **D-28:** A fase deve ter auditoria de acessibilidade mais pesada, nao apenas diretrizes.
- **D-29:** Itens minimos de bloqueio: contraste adequado, foco visivel, labels reais, touch targets, estados disabled/error/loading/success, navegacao por teclado nos componentes base, suporte a `prefers-reduced-motion` e testes manuais documentados no preview.

### the agent's Discretion
- Definir nomes finais dos tokens CSS, desde que preservem os dois niveis: base visual e semantico.
- Escolher a sans operacional final e a fonte serifada mais proxima/adequada ao wordmark oficial, caso a fonte exata do logo nao esteja disponivel.
- Decidir a estrutura exata do preview HTML, desde que admin, player e master aparecam como modos separados e validaveis.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Marca e Storytelling
- `.planning/sketches/onikara-logotipo.png` - Logotipo oficial da marca Onikara; referencia canonica para simbolo, cor, wordmark e sensacao institucional.
- `.planning/STORYTELLING.md` - Define Onikara como sistema operacional de contencao sobrenatural, com segredo, organizacao real e horror controlado.
- `.planning/sketches/MANIFEST.md` - Direcao visual: sistema operacional de cacadores Oni, dark fantasy, vermelho/carmesim, dourado envelhecido, vidro escuro e energia anime contida.
- `.planning/sketches/001-primeiro-viewport-operacional-oni/README.md` - Explora primeiro viewport operacional Oni.
- `.planning/sketches/002-modos-admin-player-mestre/README.md` - Explora separacao visual entre admin, player e mestre.

### Planejamento do Produto
- `.planning/ROADMAP.md` - Define Phase 2, objetivo, modo UI, criterios de sucesso e planos 02-01 a 02-03.
- `.planning/REQUIREMENTS.md` - Define `UIDB-01`, `UIDB-05`, identidade visual e acessibilidade como parte da fase.
- `.planning/PROJECT.md` - Define Onikara, areas de administracao/player e direcao de identidade visual.
- `.planning/STATE.md` - Estado atual do projeto e decisoes acumuladas.

### Governanca e Modos
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-CONTEXT.md` - Decisoes de Phase 1 sobre admin, player, master, RLS e separacao conceitual.
- `.planning/phases/01-n-cleo-supabase-pap-is-e-governan-a/01-SUPABASE-CONTRACTS.md` - Contrato Supabase que separa admin, player e master; master reconhecido sem poderes de admin.

### Arquitetura e Convencoes
- `.planning/codebase/STACK.md` - Stack atual: HTML/CSS/JS puro, ESM, Supabase JS e Supabase local.
- `.planning/codebase/ARCHITECTURE.md` - Direcao de `/admin`, `/play`, futuro `/master`, design system compartilhado e acessibilidade.
- `.planning/codebase/CONVENTIONS.md` - Convencoes de modularidade, `src/ui`, ESM e integracao Supabase.
- `package.json` - Scripts e dependencias atuais; nao ha framework de UI/Storybook nesta fase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/sketches/onikara-logotipo.png`: logo oficial para extrair regras de uso, simbolo isolado, versoes monocromaticas e favicon/app icon.
- `.planning/sketches/001-primeiro-viewport-operacional-oni/index.html`: referencia visual exploratoria para primeiro viewport e linguagem operacional.
- `.planning/sketches/002-modos-admin-player-mestre/index.html`: referencia exploratoria para diferenciar admin, player e master.
- `package.json`: confirma stack leve sem framework de UI; preview deve funcionar com HTML/CSS/JS puro.

### Established Patterns
- Projeto privilegia HTML/CSS/JS puro e ES Modules.
- UI deve ser modular, com futura pasta `src/ui` para renderizadores, HUD e menus.
- Supabase e RLS ficam como base de dados e permissao; Fase 2 nao muda backend.
- Admin e player ja estao separados por produto; master e separado conceitualmente e deve ganhar linguagem visual propria nesta fase.

### Integration Points
- CSS tokens oficiais devem ser reutilizaveis por `/admin`, `/play` e futuro `/master`.
- Preview HTML deve validar componentes base para admin/player/master antes das fases de implementacao.
- Assets oficiais devem ficar em local previsivel para uso futuro por Storage, favicon/app icon e telas de acesso.

</code_context>

<specifics>
## Specific Ideas

- O logo oficial deve permanecer como selo institucional, nao como decoracao constante.
- A marca deve parecer uma organizacao secreta de contencao sobrenatural, nao um RPG anime colorido generico.
- Admin deve ser premium e minimalista; player deve parecer um HUD de cacador registrado; master deve parecer regente de campanha com console narrativo e tatico.
- Master deve ver fichas de jogadores da campanha em leitura, mas nao editar diretamente a ficha.
- O preview HTML deve ter uma tela master completa, com campanha, cena, mobs, mapa/ambiente e fichas somente leitura.

</specifics>

<deferred>
## Deferred Ideas

- Implementar permissoes reais de campanha para master.
- Implementar criacao/edicao completa de campanhas, cenas, mobs e espacos.
- Implementar efeitos completos de campanha sobre fichas de jogador.
- Produzir kit expandido ritual com padroes, selos, texturas e ornamentos alem do kit minimo oficial.

</deferred>

---

*Phase: 2-Identidade Visual e Design System Onikara*
*Context gathered: 2026-05-24*
