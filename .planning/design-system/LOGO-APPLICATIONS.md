# Aplicação e Redesenho do Logotipo Onikara

## Problema Atual

O arquivo oficial disponível em `.planning/design-system/assets/onikara-logotipo.png` possui fundo branco. Ele é a referência visual canônica da marca, mas não é adequado como asset final para aplicação direta em fundos escuros, carmesim, dourado velho ou superfícies com textura.

## Direção de Redesenho

O redesenho deve preservar:

- máscara Oni simétrica;
- preto carvão como massa principal;
- carmesim profundo nos acentos internos;
- wordmark em caixa alta;
- espaçamento amplo entre letras;
- losango no centro dos `A`;
- sensação premium, ritualística e institucional.

## Tipografia

Fonte operacional recomendada para recomposição do lettering:

- `Cinzel Decorative` para títulos de alto impacto;
- `Cinzel SemiBold` para variações mais sóbrias;
- `Trajan Pro` apenas como alternativa de design caso esteja licenciada/disponível.

O lettering oficial não deve ser tratado como fonte pura. O `A` com losango central indica customização manual.

## Assets Necessários

| Asset | Finalidade |
|-------|------------|
| `onikara-logotipo-transparente.png` | Versão principal sem fundo. |
| `onikara-logotipo-claro.png` | Aplicação em fundo escuro. |
| `onikara-logotipo-escuro.png` | Aplicação em fundo claro. |
| `onikara-symbol-transparente.png` | Símbolo isolado sem fundo. |
| `favicon.png` | Navegador e superfícies pequenas. |
| `app-icon.png` | Launcher/app e superfícies maiores. |

## Exemplos de Aplicação

O preview `.planning/design-system/preview.html` demonstra:

- o PNG atual em fundo claro, onde o fundo branco não quebra a composição;
- o PNG atual em fundo escuro, como exemplo do problema a ser corrigido;
- uma proposta tipográfica de wordmark com Cinzel Decorative, caixa alta, espaçamento aberto e losangos nos `A`.

## Regra de Uso

Até que uma versão transparente seja produzida, o PNG com fundo branco deve ser usado apenas como referência de marca ou em fundos claros controlados. Produto final, login, header escuro e shells `/admin`, `/player` e `/master` devem usar assets sem fundo branco.
