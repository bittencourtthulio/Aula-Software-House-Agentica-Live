---
id: "pr-4"
title: "Contador de caracteres na descrição do ticket"
type: "pr"
status: "integrado"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/4"
source_revision: "4f604a3865c421aca294d9a865d8b2ed2d8917547f98d12d8f9dca148aa5eb01"
source_state: "closed"
source_closed_at: "2026-11-11T15:47:19Z"
updated_at: "2026-11-11"
tags: ["atendimento","formulario","acessibilidade"]
paths: ["automacao/resultados/c7ebf2e5-d7fb-46b2-afc6-e79bfd8a1700.json","client/src/TelaAtendimento.jsx","client/src/atendimento.css","client/test/atendimento.test.js"]
related: ["issue-3"]
---

# Contador de caracteres na descrição do ticket

## Quando consultar
Consulte ao alterar o formulário Novo ticket, o limite da descrição ou anúncios acessíveis.

## Contexto e causa
O campo aceitava 5.000 caracteres, mas não informava o consumo. A mudança é de interface; não altera banco nem contrato da API.

## Solução e decisão
Controlar a descrição em descricaoNova, renderizar descricaoNova.length/5000 e preservar maxLength={5000}. Limpar o estado ao abrir, cancelar, fechar e concluir o formulário. O contador usa role=status, aria-live=polite e números tabulares no CSS.

## Evidências e validação
O diff adiciona o estado e o contador em client/src/TelaAtendimento.jsx, estilo em atendimento.css e client/test/atendimento.test.js. A descrição da PR relata 27 testes e build aprovados em cópia isolada. Os testes novos inspecionam código, sem simular digitação.

Fonte: [PR #4](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/4).

## Limites e prevenção
A revisão histórica distinguiu implementação de entrega humana e apontou limitações na atualização remota dos marcos. Não confunda teste estático com teste de interação ou build com deploy. Ao evoluir o formulário, confira limpeza do estado em todos os caminhos.
