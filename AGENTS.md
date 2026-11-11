# Conhecimento do projeto

Antes de responder dúvidas, definir escopo, revisar ou alterar código, leia
`docs/Knowledge/README.md`, pesquise os termos e caminhos do pedido nessa pasta
com `rg` e consulte os artigos pertinentes. Registre no retorno interno os IDs
consultados, ou que a pesquisa não encontrou material aplicável. Confira o
estado atual no código: conhecimento histórico não substitui evidência atual.

A curadoria faz parte da própria tarefa, nunca de uma fila posterior. Toda PR
de produto deve incluir seus artigos e o índice em `docs/Knowledge/**` no mesmo
diff, seguindo `TEMPLATE.md`. O coordenador inclui esses caminhos no escopo;
os especialistas fornecem aprendizados; o desenvolvedor/coordenador registra;
o revisor valida fontes, limites e artigos junto do código, antes da entrega.

Dúvida sem alteração de produto também inclui o aprendizado no escopo da
resolução: o N1 fornece orientação e evidências, o coordenador confere, e o
controlador publica um registro estruturado no mesmo comentário da resposta,
antes de encerrar a issue, sem criar PR. A versão na base pode ser incorporada
no próximo trabalho pertinente; não abra tarefa separada para isso.
Esclarecimento pendente não deve ser tratado como resolução.

PR aberta representa proposta; somente merge confirmado representa integração.
Issue ainda aberta usa `em-atendimento`; solução comprovada permite `resolvido`
somente após fechamento confirmado. Preserve no artigo a data/estado do
snapshot consultado. Atualize estados na própria tarefa quando ainda possível;
se a entrega já terminou, atualize no próximo trabalho pertinente, sem abrir
uma entrega exclusiva. Issue fechada sem solução comprovada registra o limite.

O workflow `knowledge.yml` é auditoria manual somente de leitura: não cria
issues, não atribui agentes e não abre PRs. PRs exclusivas da base e issues
internas antigas de curadoria são excluídas para evitar recursão. Nunca gere
conhecimento sobre a própria curadoria. Não exponha dados pessoais/segredos
nem faça merge automático por causa da curadoria.
