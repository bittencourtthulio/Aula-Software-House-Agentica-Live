# Aula-Software-House-Agentica-Live

## Tickets e agentes nativos

`AGENT_RUNTIME` seleciona o runtime `github-native` para criar issues dos tickets.
`AGENT_DRY_RUN` mantém as operações sem rede por padrão; somente `false` habilita a API.
`GITHUB_REPOSITORY` identifica o repositório de destino.
`GITHUB_TOKEN` permite criar issues e registrar o resumo interno.
`COPILOT_AGENT_TOKEN` autoriza atribuir a issue ao Copilot no workflow.
Configure os tokens pelo ambiente/Secrets, sem gravá-los no repositório.
O cookie HttpOnly `fluxo_dono` restringe tickets ao navegador que os criou.
Falhas de criação preservam o ticket como `issue_pendente`; uma nova tentativa deve reler seu requestId.
O controlador atribui a mesma issue ao agente `coordenador`, com base em `main`.
Reconciliação das respostas N1 permanece como TODO no controlador.
Formato da atribuição: [documentação oficial do GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api).
