# Política de autonomia

Esta política define o limite dos agentes de produto via GitHub Copilot
(`.github/agents/*.agent.md`). O contrato de comunicação de progresso está
em `COMUNICACAO.md`; relatar uma etapa não amplia a autorização para código.
A política, sozinha, não instala nem executa automação.

## O que pode fazer

- Responder dúvidas de uso com base em `PRODUTO.md` e no código atual.
- Pedir esclarecimentos quando o problema ou o resultado não estiver claro.
- Fazer pequenas mudanças na interface do quadro: texto de orientação,
  acessibilidade e correções locais de exibição ou movimentação de cartões,
  preservando contratos da API e os recursos existentes.

Um pedido de produto precisa somente de problema, resultado esperado e
arquivos prováveis. Não exige nota, pontuação ou matriz de priorização.
Exemplo: “O título do cartão é cortado; quero ler o título completo;
arquivo provável: client/src/Cartao.jsx”.

## Caminhos permitidos para mudanças

Lista fechada, limitada ao quadro de tarefas:

- `client/src/TelaQuadro.jsx`: tela e interações do quadro.
- `client/src/Lista.jsx`: listas e criação de cartões.
- `client/src/Cartao.jsx`: exibição e ações do cartão.
- `client/src/ordem.js`: ordenação de cartões na interface.

Estar na lista não autoriza uma mudança ampla. Se a correção exigir outro
arquivo ou mudar comportamento fora do quadro, encaminhe ao responsável
com o problema, o resultado esperado e os arquivos prováveis. Não execute
a parte que ultrapassa esse limite.

## O que não pode fazer

Não alterar login, sessões, credenciais, banco, atendimento, infraestrutura
ou dependências. Não ler segredos nem arquivos de ambiente. Não apagar ou
migrar dados reais, nem executar exclusões em nome de quem usa o produto.
Não publicar, fazer deploy ou mudar permissões e workflows.

Em particular, ficam fora da lista `server/`, `scripts/`, `.github/`,
`package.json`, arquivos de ambiente e bancos SQLite. Também ficam fora
`client/src/TelaAtendimento.jsx`, `client/src/atendimento.css`,
`client/src/App.jsx`, `client/src/BarraLateral.jsx`, `client/src/api.js`,
`client/src/main.jsx`, `client/src/estilos.css`, a página inicial e os
componentes compartilhados em `client/src/componentes/`: podem afetar
áreas além do quadro.

Não inventar recursos, preços ou prazos. Para dúvidas comerciais, consultar
`automacao/commercial-catalog.json`; se faltar informação, usar a pergunta
registrada e encaminhar ao responsável. O produto é 100% gratuito.

Preservar React/Node/SQLite local e a integração prevista com GitHub
Copilot. Não criar motor próprio de IA nem resposta automática no
atendimento como parte de uma mudança de produto.
