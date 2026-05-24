# Guia de Marca Onikara

## Logotipo Oficial

A fonte oficial do logotipo da Onikara é `.planning/sketches/onikara-logotipo.png`.

A marca deve funcionar como o selo institucional principal do sistema. Ela deve aparecer quando o produto precisar comunicar autoridade e confiança: portal de entrada, cabeçalhos autenticados, documentos internos, estados de carregamento, telas restritas e mensagens formais do sistema.

A leitura visual do logotipo é:

- máscara Oni simétrica;
- peso institucional em preto quase absoluto;
- carmesim profundo como ameaça e energia;
- wordmark serifado, espaçado e premium;
- autoridade sobrenatural contida, não emblema decorativo de jogo.

O logotipo não deve ser usado como papel de parede, ornamento repetido, textura de fundo de baixo contraste ou decoração casual. Ele precisa manter área de respiro e autoridade visual.

## Personalidade da Marca

Onikara deve parecer um sistema operacional real de contenção sobrenatural: secreto, organizado, premium, tático e controlado.

A marca deve comunicar:

- contenção acima de espetáculo;
- autoridade operacional acima de fantasia genérica;
- elegância sombria acima de horror caótico;
- leitura tática disciplinada acima de ruído visual;
- perigo silencioso por meio de acentos carmesim e preto institucional.

Evite tom de RPG anime colorido, horror exagerado, textura ruidosa ou estética genérica de SaaS. O resultado deve parecer uma interface autorizada de uma organização oculta que registra, monitora e responde a ameaças Oni.

## Direção de Cores

Paleta central:

- **Preto**: superfície primária, autoridade, segredo e peso institucional.
- **Carmesim**: ameaça, sangue, selos, alertas, ações destrutivas e energia Oni.
- **Dourado velho**: hierarquia, raridade, prestígio, bordas finas, medalhas, marcadores de autoridade e ênfase especial.

Grafite não é cor dominante da marca. Ele pode aparecer apenas como tom técnico ou neutro de apoio para bordas, divisórias, painéis discretos e superfícies de dados densas.

Carmesim e dourado velho raramente devem virar cor de texto longo. Eles são acentos de estado, hierarquia e significado. O texto precisa permanecer legível em superfícies escuras.

## Direção Tipográfica

Onikara usa um modelo tipográfico duplo:

- **Serifada de marca**: usar `Cinzel Decorative` ou `Cinzel SemiBold` como aproximação operacional do wordmark oficial. Usar no nome do produto, títulos especiais, telas de acesso, documentos institucionais e momentos de autoridade.
- **Sans operacional**: usar em UI densa, formulários, tabelas, filtros, menus, controles, corpo de texto e leitura repetida.

A palavra ONIKARA deve aparecer em caixa alta, com espaçamento amplo entre letras e cor preto carvão quando usada sobre fundo claro. O `A` do logotipo oficial parece customizado com losango central; portanto, a fonte pura não deve ser tratada como reprodução fiel do lettering. Quando necessário, a UI pode simular o losango central dos `A` como detalhe manual.

A serifada de marca não deve dominar controles administrativos densos. Seu papel é assinatura e hierarquia, não todos os rótulos. Caso `Trajan Pro` esteja disponível no ambiente de design, ela pode ser avaliada como alternativa de composição, mas o design system usa `Cinzel` por ser acessível via Google Fonts.

Referência tipográfica: https://fonts.google.com/specimen/Cinzel?preview.script=Latn

## Fluxo de Acesso

Os modos `/admin`, `/player` e `/master` não devem aparecer como fichas simultâneas de um mesmo painel operacional. O fluxo correto é:

1. O usuário abre o portal Onikara.
2. O usuário autentica seu ID/login.
3. O sistema lista os contextos disponíveis para aquele login.
4. O usuário escolhe qual contexto deseja acessar.
5. O sistema abre o shell isolado correspondente.

Exemplo: Miguel pode ter o personagem Akio na Campanha X e também mestrar a Campanha Y. Ao entrar, Miguel deve escolher se quer acessar Akio na Campanha X como player ou a Campanha Y como master. Cada escolha leva para uma navegação isolada, com permissões e interface próprias.

## Expressão por Modo

### Admin

Admin é um painel premium minimalista: escuro, elegante, institucional e eficiente. Pode usar carmesim, dourado velho e linguagem de contenção, mas não deve virar uma central cinematográfica que prejudique CRUD, tabelas ou formulários.

Telas de admin priorizam:

- tabelas densas;
- navegação previsível;
- validação inline;
- clareza de auditoria e status;
- fluxos eficientes de configuração.

### Player

Player é um HUD de caçador registrado. Ele é mais expressivo que o admin, mas ainda deve parecer uma interface de campo emitida pelo sistema Onikara.

Telas de player enfatizam:

- identidade do personagem;
- HP e mana;
- status de missão;
- efeitos ativos;
- inventário e equipamento;
- progresso e recompensas.

### Master

Master é uma interface de regente de campanha: console operacional de narrador com direção tática. Ele é poderoso dentro da campanha, mas nunca sugere posse da plataforma.

Telas de master enfatizam:

- arquivos da campanha;
- cenas;
- mobs e entidades;
- espaços e cenários;
- preparação de encontros;
- resumos de fichas dos jogadores em modo somente leitura.

Master não deve expor controles de admin da plataforma, configurações globais, configuração de backend, governança de catálogos, gestão de permissões ou registros de auditoria administrativa.

## Regras de Uso do Logotipo

Faça:

- Use o logotipo como selo institucional.
- Preserve área de respiro ao redor da máscara e do wordmark.
- Prefira a versão colorida sobre superfícies neutras, escuras ou claras limpas.
- Use versões monocromáticas apenas quando a cor reduzir a legibilidade.
- Combine o logotipo com textos operacionais concisos.
- Produza uma versão com fundo transparente para aplicação em fundos escuros, claros, carmesim e dourado velho.

Não faça:

- Esticar, distorcer ou cortar o logotipo.
- Colocá-lo atrás de textos densos ou tabelas.
- Repeti-lo como padrão decorativo.
- Aplicar brilho, glitch, desfoque ou textura pesada.
- Usá-lo como substituto de ícones específicos de modo.
- Usar o PNG atual com fundo branco diretamente sobre superfícies escuras como se fosse o asset final.

## Aplicação do Logotipo em Fundos

O arquivo atual `.planning/design-system/assets/onikara-logotipo.png` contém fundo branco e deve ser tratado como referência oficial provisória, não como asset final de aplicação.

O design system precisa prever, no mínimo:

- `onikara-logotipo.png`: referência oficial atual.
- `onikara-logotipo-transparente.png`: versão principal com fundo transparente.
- `onikara-logotipo-claro.png`: versão para superfícies escuras.
- `onikara-logotipo-escuro.png`: versão preto carvão para fundos claros.
- `onikara-symbol-transparente.png`: símbolo isolado com fundo transparente.

Enquanto esses arquivos não forem redesenhados a partir de fonte vetorial ou recorte manual confiável, qualquer preview deve sinalizar que o fundo branco é uma limitação do asset atual.

## Faça / Não Faça

Faça:

- Mantenha o preto como base dominante.
- Use carmesim para ameaça, ação e energia Oni.
- Use dourado velho para hierarquia premium e raridade.
- Faça o admin parecer calmo e eficiente.
- Faça o player parecer imediato e legível.
- Faça o master parecer autoritativo e limitado ao escopo da campanha.

Não faça:

- Deixar grafite virar a paleta principal.
- Tratar master como admin.
- Usar carmesim ou dourado em textos longos.
- Transformar toda tela em cena dramática.
- Ocultar foco, rótulos ou estados de erro por estética.

## Fora de Escopo

O kit mínimo de marca da Fase 2 não inclui sistema completo de ornamentos rituais, biblioteca de texturas, pacote de logotipo animado, conjunto de ilustrações, pacote de arte para mapas de campanha ou ferramental completo de campanhas do master.
