---
id: "issue-69"
title: "Exibir total de cartões no quadro"
type: "issue"
status: "em-atendimento"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/69"
source_revision: "9e536e044e74bc314a6fa2d47e7126fa597e15630a5bc808f7c71bd368a23e87"
source_state: "open"
source_closed_at: null
updated_at: "2026-11-11"
tags: ["quadro", "cartoes", "contagem"]
paths: ["client/src/TelaQuadro.jsx","client/src/estilos.css","client/src/contagem-cartoes.js","client/test/contagem-cartoes.test.js"]
related: ["pr-70"]
---

# Exibir total de cartões no quadro

## Quando consultar
Consulte ao exibir ou alterar metadados agregados no cabeçalho do quadro e ao precisar manter o total sincronizado com mudanças nas listas.

## Contexto e causa
A issue #69 pede uma contagem agregada de cartões no cabeçalho de `TelaQuadro`, com singular, plural e zero, atualizada a partir dos dados atuais. O código anterior mostrava título e ações no cabeçalho; cada lista já exibia sua própria contagem.

## Solução e decisão
`contarCartoes` soma os arrays `cards` das listas e trata listas ausentes, listas vazias e listas sem array de cartões como zero. `formatarContagemCartoes` exibe “1 cartão” e “0 cartões”/“N cartões”. `TelaQuadro` calcula o texto ao renderizar a prop `listas`, sem estado derivado ou chamadas à API; por isso a visualização acompanha criação, exclusão e movimentação quando os dados recebidos mudam. O agrupamento do título e contador mantém as ações existentes e pode encolher no layout estreito.

## Evidências e validação
O código atual foi conferido em `client/src/TelaQuadro.jsx`, `client/src/contagem-cartoes.js`, `client/src/estilos.css` e `client/src/Lista.jsx` (a contagem por lista usa `lista.cards?.length ?? 0`). `client/test/contagem-cartoes.test.js` contém casos para listas vazias/ausentes, agregação e formatação; esses testes, lint e build não foram executados nesta tarefa.

Fonte: [Issue #69](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/69). O hash foi calculado em 2026-11-11 com `revisaoFonte("issue", objetoAPI)` e os metadados fornecidos para este snapshot (título, corpo, `open`, `closed_at: null`, `state_reason: null`). A consulta direta à API não foi possível neste ambiente; portanto, o artigo preserva esse snapshot e não afirma ter confirmado alterações posteriores.

## Limites e prevenção
A contagem considera como válidos somente arrays em `lista.cards`; formato de dados diferente não é inferido. O total depende da prop atual `listas` e não de uma consulta independente. A issue permanece `em-atendimento` no snapshot consultado; a PR relacionada permanece uma proposta, sem integração confirmada.
