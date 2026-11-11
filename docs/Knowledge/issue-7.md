---
id: "issue-7"
title: "Cards ultrapassando a sidebar de tickets"
type: "issue"
status: "resolvido"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/7"
source_revision: "b1430b3893515c8684c5df420308630fba91c14fe0213ea23332d73d1a539b8f"
source_state: "closed"
source_closed_at: "2026-11-11T15:46:38Z"
updated_at: "2026-11-11"
tags: ["atendimento","sidebar","css"]
paths: []
related: ["pr-8"]
---

# Cards ultrapassando a sidebar de tickets

## Quando consultar
Consulte para pedidos semelhantes e antes de responder a mesma dúvida. Veja também pr-8.

## Contexto e causa
Os cards da lista excediam a largura disponível, ocultando parte do conteúdo.

## Solução e decisão
A PR #8 integrada ajustou Grid e encolhimento dos itens. O PO esclareceu na issue que reticências no texto são permitidas; o card precisa caber na lateral.

## Evidências e validação
A issue foi encerrada em 2026-11-11T15:46:38Z. A PR #8 tem merge confirmado pela API; descrição, diff e comentários foram consultados nesta carga. A evidência específica está no artigo relacionado.

Fonte: [Issue #7](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/7).

## Limites e prevenção
Consulte pr-8. A revisão histórica não executou build por falta de Vite nem conferência visual; não transforme testes estáticos em evidência visual.
