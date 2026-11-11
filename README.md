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
Antes de atribuir, o controlador chama N1 e coordenador pelo Copilot CLI em
modo de leitura. Dúvidas de uso resolvidas recebem resposta na issue e são
encerradas sem PR; esclarecimentos mantêm a issue aberta. Pedidos de código
seguem para atribuição ao `coordenador`, com base em `main`.
No Actions, configure também `COPILOT_CLI_TOKEN` (Copilot Requests de leitura
em PAT fino ou OAuth compatível e licença Copilot ativa). Sem ele, a triagem
fica bloqueada e nenhuma PR é solicitada. Veja o contrato de comunicação.
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

## Conhecimento dos agentes

A base versionada fica em [`docs/Knowledge`](docs/Knowledge/README.md), com
artigos de PRs e issues, frontmatter, fontes e limites de validação. Os agentes
consultam a base antes de trabalhar. O workflow `Knowledge` solicita curadoria
das fontes novas ou atualizadas ao agente `conhecimento`, por PR para revisão.
