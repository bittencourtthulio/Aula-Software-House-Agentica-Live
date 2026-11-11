---
id: "issue-72"
title: "Dúvida simples parada por resposta fora do contrato de triagem"
type: "issue"
status: "em-atendimento"
source: "https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/issues/72"
source_revision: "4a588258eb87c1c20ebb0c90eed546b93059fa73d012252015414099abf49465"
source_state: "open"
source_closed_at: null
updated_at: "2026-11-11"
tags: ["triagem", "n1", "coordenador", "po", "json", "quadros"]
paths: ["automacao/atendimento.mjs", "automacao/controlador.mjs", ".github/workflows/native-agents.yml", "server/test/duvidas-uso.test.js"]
related: ["pr-73", "issue-9", "pr-10", "pr-12"]
---

# Dúvida simples parada por resposta fora do contrato de triagem

## Quando consultar
Issue sem resposta, erro de JSON do CLI, dúvida que deveria ser resolvida sem PR,
ou issue manual ignorada por não possuir a label do app.

## Contexto e causa
A issue #72 pergunta como criar quadro e lançar tarefas. No snapshot da API em
11/11/2026, permanecia aberta, sem comentários ou atribuição. As execuções
43065265902 e 43065266423 falharam ao interpretar stdout com introduções
“Vou conferir…” e “Verifying…”. O controlador usava JSON.parse no stdout inteiro.
Também filtrava origin:app e o agendamento só retomava respostas já publicadas.

## Solução e decisão
A correção local proposta analisa toda issue normal antes da atribuição ao
coding agent. Coordenador decide: orientação com N1, consulta rápida ao PO
quando necessária, esclarecimento ou desenvolvimento. Apenas desenvolvimento
solicita PR. O leitor aceita introdução/cercas em torno de um objeto completo,
valida o contrato e recusa ambiguidade; há uma tentativa de reformatação.
O agendamento retoma casos sem resposta, registra bloqueios e respeita até três
tentativas automáticas por revisão humana, com intervalos de 5 e 15 minutos.
Esclarecimento aguarda cliente. PRs e antigas tarefas de curadoria são excluídas.

## Evidências e validação
Fontes: API da issue e logs das execuções
[43065265902](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/actions/runs/43065265902)
e [43065266423](https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live/actions/runs/43065266423).
A orientação funcional foi conferida em PRODUTO.md, BarraLateral.jsx,
TelaQuadro.jsx e Lista.jsx. Testes locais cobrem resolução sem PR, PO, código,
retorno do CLI, identidade de issue manual, retomada, deduplicação e bloqueios.
O artigo pr-73 registra o resultado final dos checks desta proposta.

## Limites e prevenção
Snapshot consultado: 11/11/2026, issue aberta. Código proposto não comprova
execução remota ou entrega no chat. Não fechar a issue por abrir ou integrar esta
correção: o atendimento original precisa de orientação publicada. Após três
falhas, corrigir o bloqueio e executar Native agents manualmente, ou enviar nova
mensagem/edição. Cron pode atrasar; ausência de credencial/licença continua sendo
bloqueio. Sem escrita no GitHub, o aviso depende dos logs do workflow.
