---
id: "issue-3"
title: "Contador de caracteres no novo ticket"
type: "issue"
status: "resolvido"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/3"
source_revision: "515a34404c15c08fe6017522a382cc54324117591ffbec59270524cf14576e98"
source_state: "closed"
source_closed_at: "2026-11-11T15:47:22Z"
updated_at: "2026-11-11"
tags: ["atendimento","formulario"]
paths: []
related: ["pr-4"]
---

# Contador de caracteres no novo ticket

## Quando consultar
Consulte para pedidos semelhantes e antes de responder a mesma dúvida. Veja também pr-4.

## Contexto e causa
O usuário não conseguia acompanhar quanto do limite de 5.000 caracteres havia utilizado.

## Solução e decisão
A PR #4 integrada adicionou contador dinâmico e reinicialização do formulário, preservando o limite.

## Evidências e validação
A issue foi encerrada em 2026-11-11T15:47:22Z. A PR #4 tem merge confirmado pela API; descrição, diff e comentários foram consultados nesta carga. A evidência específica está no artigo relacionado.

Fonte: [Issue #3](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/3).

## Limites e prevenção
Consulte pr-4 para implementação e evidências. Os testes históricos do contador são estáticos; não comprovam interação no navegador.
