---
id: "pr-8"
title: "Conter cards na largura da sidebar de tickets"
type: "pr"
status: "integrado"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/8"
source_revision: "808f880609b3a06692c88e21fe86822292c3b73f64062ca75815404a88b06f29"
source_state: "closed"
source_closed_at: "2026-11-11T15:46:37Z"
updated_at: "2026-11-11"
tags: ["atendimento","css","sidebar","responsividade"]
paths: ["automacao/resultados/9db11820-545e-4aa7-b399-059bbfd4c9db.json","client/src/atendimento.css","client/test/atendimento-layout.test.js"]
related: ["issue-7"]
---

# Conter cards na largura da sidebar de tickets

## Quando consultar
Consulte ao corrigir overflow, dimensionamento intrínseco de Grid ou seleção de tickets em telas menores.

## Contexto e causa
Os cards ultrapassavam a área disponível da lateral. A correção atua no dimensionamento da grade e no encolhimento dos itens; o sintoma não exigiu mudar API ou banco.

## Solução e decisão
Usar grid-template-columns: minmax(0, 1fr) na lista e min-width: 0 nos itens para respeitar a largura interna. Preservar a faixa rolável em mobile e a indicação aria-current do ticket selecionado.

## Evidências e validação
O diff altera client/src/atendimento.css e adiciona client/test/atendimento-layout.test.js. Comentários da issue #7 relatam 28 testes aprovados, build indisponível por ausência de Vite e nenhuma conferência visual. O PO esclareceu que reticências em textos longos são aceitáveis.

Fonte: [PR #8](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/pull/8).

## Limites e prevenção
Card fora da sidebar e texto truncado são critérios diferentes. Os testes são estáticos e não comprovam layout real. Regressões devem ser verificadas com títulos longos, viewport móvel e seleção ativa.
