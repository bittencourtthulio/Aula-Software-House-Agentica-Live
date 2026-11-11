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
Os agentes reportam marcos ao coordenador durante o trabalho. O coordenador
registra as etapas na issue e encaminha ao N1 as que forem úteis ao cliente.
O workflow reconcilia o bloco de progresso da PR nos eventos, manualmente e
a cada cinco minutos. O backend importa os textos públicos para o ticket;
a tela consulta novas mensagens a cada cinco segundos enquanto está visível,
ao retomar a aba e pelo botão Atualizar, sem duplicar avisos. O botão consulta
a issue imediatamente, ignorando o cache curto do servidor. Falhas na consulta
ao GitHub aparecem no chat, mantendo o histórico e novas tentativas automáticas.
A abertura do ticket registra somente a mensagem do cliente: respostas do N1
dependem dos textos públicos produzidos pela automação, sem confirmação pronta
atribuída ao agente. Os avisos precisam estar publicados na issue para aparecer
no chat; atrasos na publicação pelo workflow continuam sujeitos ao GitHub.
Detalhes internos ficam na issue. Falhas de rede preservam o histórico local.
Contrato e configuração: [Comunicação durante o trabalho](docs/automacao-atendimento/COMUNICACAO.md).
Formato da atribuição: [documentação oficial do GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api).
