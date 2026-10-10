# Propostas visuais do Onikara

Três direções de identidade visual, cada uma com mockups HTML estáticos: **login**, **dashboard**, **catálogo de magias** e **área do jogador** (HUD). O logotipo não foi alterado em nenhuma delas; só o entorno (brilhos, partículas, gradientes, texturas).

## Como abrir

O mockup referencia o logotipo em `.planning/design-system/assets/`, então ele precisa ser servido a partir da raiz do repositório:

```bash
npm run dev
```

Depois abra `http://127.0.0.1:4173/docs/visual-proposals/` e compare. Requer internet (Google Fonts).

| Proposta | Login | Dashboard | Catálogo | Jogador |
| --- | --- | --- | --- | --- |
| Brasa Oni | `brasa/login.html` | `brasa/dashboard.html` | `brasa/catalogs.html` | `brasa/player.html` |
| Sumi-ê | `sumi/login.html` | `sumi/dashboard.html` | `sumi/catalogs.html` | `sumi/player.html` |
| Arcano | `arcano/login.html` | `arcano/dashboard.html` | `arcano/catalogs.html` | `arcano/player.html` |

## 1. Brasa Oni — a forja carmesim

- **Conceito:** evolução direta do que existe. Uma forja onde a mana queima: brasas sobem pela tela, bordas douradas finas e cantos chanfrados.
- **Paleta:** preto `#0a0708`, carmesim `#c8102e`, dourado velho `#c9a84c`, marfim `#f3ede2`. Elementos usam as cores já definidas em `tokens.css`.
- **Tipografia:** Cinzel (títulos e botões) + Inter (interface).
- **Efeitos:** partículas de brasa, halo pulsante e anéis girando atrás do logotipo, brilho carmesim em botões e no item ativo do menu, selo lendário que pulsa.
- **Layout:** barra lateral à esquerda (igual ao admin atual), painéis com canto cortado.
- **Área do jogador:** mesma moldura, com HUD de HP (carmesim), mana (azul) e XP (dourado); cartas de magia com borda por raridade.
- **Risco:** é a mais segura, mas a menos surpreendente.

## 2. Sumi-ê — tinta e selo

- **Conceito:** pintura a tinta sobre papel de arroz numa noite índigo. O vermelhão aparece como carimbo (hanko), como a lua e como o traço do pincel.
- **Paleta:** índigo-tinta `#0c0e14`, papel `#efe7d4`, vermelhão `#d9442b`, ouro apagado `#c8a85a`.
- **Tipografia:** Shippori Mincho (títulos, estilo caligráfico) + Zen Kaku Gothic New (interface).
- **Efeitos:** grão de papel sutil, pétalas caindo devagar, lua vermelha flutuando e montanhas em névoa no login, pincelada sob o título, selo `鬼` no topo.
- **Layout:** navegação horizontal no topo e conteúdo centralizado e arejado; muito espaço em branco.
- **Área do jogador:** ficha como pergaminho, retrato em selo circular, barras com traço de pincel, magias como cartas de papel que levantam no hover.
- **Risco:** foge do dark fantasy atual; precisa de revisão da regra "carmesim e dourado como acentos" (aqui o vermelhão é o protagonista).

## 3. Arcano — cristal de mana

- **Conceito:** a mana como luz. Vidro luminoso sobre aurora violeta, HUD de jogo e cores por elemento (fogo, água, gelo, tempestade, sombra).
- **Paleta:** noite `#060818`, violeta `#8b5cff`, ciano `#4fe3ff`, magenta `#ff4fd8`, mais cores de elemento.
- **Tipografia:** Chakra Petch (títulos e números, estilo HUD) + Sora (interface).
- **Efeitos:** orbes de mana flutuando, anel de luz girando em volta do logotipo, bordas com gradiente cônico animado, vidro fosco, brilho nos elementos e nas raridades.
- **Layout:** trilho de ícones à esquerda e barra HUD no topo com mana global.
- **Área do jogador:** é onde a proposta mais brilha: retrato com neon, barras de HP/mana/XP luminosas, cartas de magia com brilho por elemento.
- **Risco:** a mais distante do guia de marca atual (que pede contenção e evita "RPG anime colorido"); exige atualizar `BRAND.md`.

## Como cada uma serve de base para o jogador

As três reutilizam a mesma marcação semântica (`.panel`, `.metric`, `.badge`, `.elem`, `.bar`), então o tema fica só em CSS: trocar de direção não exige reescrever a estrutura das telas.
