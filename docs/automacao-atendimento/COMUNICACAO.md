# Comunicação durante o trabalho

Cada especialista reporta ao coordenador, que decide o que deve chegar ao cliente.
O registro interno fica na issue original, ligado ao mesmo `requestId` do ticket.
Não espere a implementação terminar para relatar progresso.

## Especialistas e coordenador

O coordenador divide trabalhos longos em marcos curtos e observáveis. Antes de
cada delegação, registra o início; ao receber o retorno, registra o resultado,
evidências, pendências ou bloqueio. Os especialistas devolvem `requestId`,
`agent`, `internalText` e evidências reais em cada marco. Não precisam escrever
mensagem ao cliente nem publicar diretamente na issue. Se a ferramenta `agent`
só devolver ao concluir a chamada, delegue um marco por chamada para permitir
que o coordenador publique entre elas.

O coordenador analisa cada retorno e registra todo marco relevante internamente.
Quando houver informação útil ao cliente (análise iniciada, entendimento do
pedido, implementação em curso, validação, pergunta ou bloqueio), invoque
realmente o N1 com o marco e as evidências. Somente o N1 escreve `publicText`.
Se o marco for apenas técnico, use `publicText: ""`: fica na issue e não no ticket.
Não envie comandos, arquivos, rastros, segredos ou decisões internas ao cliente.
Não prometa prazo, conclusão, deploy ou disponibilidade sem evidência.

## Transporte incremental

A ferramenta `report_progress` atualiza a PR do Copilot. A cada marco, o
coordenador preserva na descrição da PR exatamente um bloco visível como este,
com todos os marcos anteriores e os identificadores reais recebidos:

```native-agents-progress
{"requestId":"00000000-0000-4000-8000-000000000000","issueNumber":123,"updates":[{"id":"analise-iniciada","agent":"coordenador","internalText":"Triagem delegada ao N1.","publicText":"Estamos analisando sua solicitação para definir os próximos passos."},{"id":"revisao-1","agent":"revisor","internalText":"Verificação concluída; incluir aqui o comando e o resultado real.","publicText":""}]}
```

O exemplo ilustra o formato; não copie IDs de solicitação ou evidências.
`id` identifica um marco de forma estável (letras, números, `_` ou `-`, até 80
caracteres). `agent` identifica quem realizou o trabalho. Ambos os textos são
obrigatórios; `publicText` pode ser vazio. Até 100 marcos, 5.000 caracteres por
texto. Preserve o bloco ao usar `report_progress` e inclua a issue de origem
na descrição da PR. Não use palavras que fechem a issue automaticamente.

Não edite um marco já publicado: registre correções ou novo aviso com outro ID.
Se um marco técnico depois ganhar relevância pública, crie um novo marco com
o texto do N1. Espelhe os mesmos marcos em `resultPath`, mas esse arquivo final
não substitui o transporte incremental. Falta de ferramenta ou falha de
publicação é bloqueio; não alegue que issue ou ticket foram atualizados.

## Controlador e ticket

O workflow lê o bloco pela API, valida PR do bot Copilot no mesmo repositório,
base `main`, issue `origin:app`, `requestId` e atribuição registrada pelo
workflow. Não executa código da PR: usa o controlador de `main`. Publica um
comentário por marco na issue, sem repetir IDs. Eventos de PR (incluindo edição
da descrição), execução manual para uma issue e reconciliação a cada cinco
minutos importam os marcos. O agendamento do GitHub pode atrasar; workflows de
PR do Copilot podem exigir aprovação humana. A reconciliação periódica cobre
PRs abertas e depende do workflow já instalado na branch padrão.

O backend consulta os comentários da issue ao abrir/reler o ticket, no máximo
uma vez a cada cinco segundos por ticket. O botão Atualizar ignora esse cache,
reutilizando uma consulta já em andamento. Só aceita comentários do bot do
workflow com contrato válido, mesma issue e `requestId`. Salva exclusivamente
`publicText` como mensagem N1, usando `externo_id` para impedir duplicação até
após reinício. O conteúdo interno não é retornado pela API de tickets.
Falha no GitHub preserva as mensagens locais e permite tentar novamente.
A tela relê o ticket a cada cinco segundos enquanto está visível e ao retomar
a aba, sem consultas sobrepostas. Ao trocar de ticket ou sair da tela, o
acompanhamento é encerrado. Falhas de consulta são exibidas sem apagar o histórico.
Abrir um ticket não cria resposta pronta do N1: somente a mensagem do cliente
é gravada, e as respostas públicas chegam pela automação.

São necessários `AGENT_RUNTIME=github-native`, `AGENT_DRY_RUN=false`,
`GITHUB_REPOSITORY` e `GITHUB_TOKEN` no app; no workflow, os tokens já descritos
no README. O token do app precisa ler os comentários além de criar issues.
Sem essa configuração, nenhuma mensagem remota é importada.
