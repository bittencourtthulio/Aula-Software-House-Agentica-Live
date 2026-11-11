---
id: "pr-6"
title: "Título completo do cartão por tooltip nativo"
type: "pr"
status: "integrado"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/6"
source_revision: "d503e34ddbd241f41ffb410e7e52ad829ba5a4fba1c149871a03ac79a15b96ef"
source_state: "closed"
source_closed_at: "2026-11-11T15:21:11Z"
updated_at: "2026-11-11"
tags: ["quadro","cartao","tooltip"]
paths: ["client/src/Cartao.jsx"]
related: ["issue-5"]
---

# Título completo do cartão por tooltip nativo

## Quando consultar
Consulte quando títulos longos aparecem truncados ou ao mudar o componente Cartao.

## Contexto e causa
O título longo fica cortado na visualização compacta do quadro. A demanda foi permitir leitura ao passar o mouse.

## Solução e decisão
O article de Cartao recebe title={cartao.title}, usando o tooltip nativo do navegador. A alteração mantém as interações de edição, menu e arrastar já existentes.

## Evidências e validação
O diff da PR tem uma linha adicionada em client/src/Cartao.jsx: o atributo title no article. A descrição não registra execução de testes; não há resultado de validação automatizada a atribuir a essa PR.

Fonte: [PR #6](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/6).

## Limites e prevenção
Tooltip nativo atende ao hover solicitado. Não pressupõe acesso equivalente por toque ou teclado; uma futura exigência de acessibilidade deve avaliar alternativa explícita sem prejudicar edição e movimentação.
