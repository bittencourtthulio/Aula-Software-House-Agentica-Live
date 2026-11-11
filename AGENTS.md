# Conhecimento do projeto

Antes de responder dúvidas, definir escopo, revisar ou alterar código, leia
`docs/Knowledge/README.md`, pesquise os termos e caminhos do pedido nessa pasta
com `rg` e consulte os artigos pertinentes. Registre no retorno interno os IDs
consultados, ou que a pesquisa não encontrou material aplicável. Confira o
estado atual no código: conhecimento histórico não substitui evidência atual.

Toda PR de produto criada/atualizada e toda issue encerrada deve resultar em
conhecimento curado, seguindo `docs/Knowledge/TEMPLATE.md`. O coordenador
garante a captura, os especialistas fornecem aprendizados e o revisor confere
fontes, limites e status. Inclua `docs/Knowledge/**` no escopo quando necessário.
PR aberta representa proposta; somente merge confirmado representa integração.
Issue fechada sem solução comprovada deve registrar essa limitação.

O workflow `knowledge.yml` reconcilia fontes e solicita curadoria ao agente
`conhecimento`. PRs exclusivas da base e issues internas de curadoria são
excluídas para evitar recursão. Não altere código de produto em tarefas de
curadoria, não exponha dados pessoais/segredos e não faça merge automático.
