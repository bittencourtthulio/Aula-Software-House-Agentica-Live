# Política de autonomia — projeto de aula

Este repositório é um projeto de exemplo para uma aula, com dados de teste.
A orientação do responsável é implementar os pedidos com autonomia ampla.
Esta política orienta os agentes em `.github/agents/*.agent.md` e substitui
a antiga limitação a pequenas mudanças em quatro arquivos do quadro.

## O que pode fazer sem nova aprovação

- Alterar o sistema, implementar funcionalidades e corrigir bugs.
- Criar, alterar e reorganizar telas, rotas, navegação, cards, estilos e
  componentes compartilhados em qualquer área, inclusive atendimento.
- Alterar backend, endpoints, contratos da API, autenticação e sessões do
  aplicativo de exemplo, ajustando os consumidores afetados.
- Evoluir tabelas, colunas, relações e índices por migrações do SQLite,
  usando o agente `banco` no fluxo coordenado.
- Adicionar ou atualizar dependências, scripts, configurações, testes,
  documentação, agentes, controlador e workflows necessários ao pedido.
- Executar testes, build e servidores locais para verificar o resultado,
  usando banco descartável e dados fictícios nas verificações.

## Como definir e executar o escopo

Um pedido ou ticket de alteração no projeto já autoriza sua implementação.
O PO descreve o problema, o resultado esperado, os arquivos necessários e
critérios observáveis, sem nota, pontuação ou matriz de priorização.
`allowedFiles` registra os arquivos escolhidos para aquele pedido, incluindo
arquivos novos; não existe lista fechada de caminhos autorizados.

Se a implementação precisar de outros arquivos ou de uma mudança maior,
o coordenador atualiza `allowedFiles`, os critérios e a distribuição do
trabalho e continua. Não encaminhe ao responsável nem recuse uma mudança
apenas por envolver outra tela, CSS, componente compartilhado, backend,
banco, dependência ou configuração. Use os padrões existentes e tome
decisões técnicas razoáveis; pergunte somente quando faltar informação
essencial que o código e o contexto não permitam inferir.

Exemplo: um pedido para mudar a tela de cards pode alterar `Cartao.jsx`,
`TelaQuadro.jsx`, estilos, componentes compartilhados, API e testes,
conforme necessário para entregar o comportamento solicitado.

Valide o que mudou e registre os comandos e resultados reais. Mudanças nos
contratos da API devem atualizar os consumidores; mudanças de banco usam
migrações incrementais e verificações em banco descartável. Preserve a
arquitetura React/Vite, Node e SQLite, salvo pedido explícito de troca.

## Limites que continuam valendo

- A autonomia vale para esta cópia de aula. Não altere o original do
  professor, outros projetos, serviços de produção ou dados reais.
- Não leia nem exponha segredos ou arquivos de ambiente. A aplicação e os
  workflows podem consumir credenciais já configuradas pelos mecanismos
  existentes, sem imprimi-las nem gravá-las no repositório.
- Não apague o banco local existente nem dados do usuário para testar.
  A evolução de esquema ocorre por migrações; testes usam dados descartáveis.
- Não faça compras, contrate serviços, publique, faça deploy, altere
  permissões externas, faça merge ou feche issues sem autorização explícita
  para essas ações. A PR pode ser criada e fica aberta para revisão.
- Respeite as permissões e o sandbox do ambiente; esta política não os altera.

Para orientações sem necessidade de desenvolvimento resolvidas por N1 e
coordenador, com consulta ao PO quando necessária, está
explicitamente autorizado responder na issue original e encerrá-la após a
publicação, sem PR. Essa autorização não inclui merge, deploy ou fechamento
de pedidos de código. Se faltar informação, pergunte e mantenha a issue aberta.

Responda dúvidas com base em `PRODUTO.md` e no código atual. Não invente
ações concluídas, recursos já disponíveis, preços ou prazos. Para dúvidas
comerciais, consulte `automacao/commercial-catalog.json`; se faltar uma
condição comercial, encaminhe a pergunta ao responsável. O produto é
100% gratuito. Preserve a integração com os agentes reais do GitHub Copilot;
não a substitua por invocações simuladas ou respostas que aleguem execução.
