---
id: "issue-5"
title: "Ler título completo do cartão"
type: "issue"
status: "resolvido"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/5"
source_revision: "d55198793e4aa8e8655045a179c658a25f8f67d17656696c4f62f10cccf4da65"
source_state: "closed"
source_closed_at: "2026-11-11T15:21:13Z"
updated_at: "2026-11-11"
tags: ["quadro","tooltip"]
paths: []
related: ["pr-6"]
---

# Ler título completo do cartão

## Quando consultar
Consulte para pedidos semelhantes e antes de responder a mesma dúvida. Veja também pr-6.

## Contexto e causa
Títulos extensos eram truncados; foi solicitado acesso ao texto completo ao passar o mouse.

## Solução e decisão
A PR #6 integrada acrescentou title={cartao.title} ao article do cartão.

## Evidências e validação
A issue foi encerrada em 2026-11-11T15:21:13Z. A PR #6 tem merge confirmado pela API; descrição, diff e comentários foram consultados nesta carga. A evidência específica está no artigo relacionado.

Fonte: [Issue #5](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/5).

## Limites e prevenção
Consulte pr-6 antes de mudar o tooltip; a solução por hover não comprova experiência equivalente por toque ou teclado.
