# Fluxo

O Fluxo organiza tarefas em quadros, listas e cartões. O produto é 100%
gratuito, conforme confirmação do responsável nesta execução (11/11/2026).

## Como usar

1. Na página inicial (`/`), clique em “Abrir meus quadros” (`/quadro`).
2. Use “Criar quadro” na lateral e informe um título.
3. Abra o quadro e use “Adicionar lista” para criar suas etapas.
4. Em uma lista, use “Adicionar cartão” e informe a tarefa.
5. Clique no título do cartão para editar título e descrição. Termine em
   “Salvar alterações”.
6. Arraste um cartão para ordenar ou mudar de lista. Também é possível usar
   o menu do cartão, em “Mover para”, escolhendo uma lista do quadro.

Quadros e listas podem ser renomeados. Os menus permitem excluir cartões
e listas; o quadro também tem ação de exclusão. A confirmação avisa que
excluir um quadro apaga suas listas e cartões, e excluir uma lista apaga
seus cartões. Essas exclusões não podem ser desfeitas pela interface.

Atendimento: os tickets ficam no servidor e criam uma issue no GitHub.

## Execução local e limites

O projeto usa React/Vite, API Node e SQLite local. Requer Node 22.13 ou
superior. Com dependências instaladas, `npm run dev` inicia interface e API
e informa os endereços disponíveis; Ctrl+C encerra ambos.
Quadros ficam no SQLite, por padrão em `server/dados/app.sqlite`.
As rotas do quadro não exigem login; existem rotas de autenticação na API.
Isso não comprova isolamento de dados entre usuários.

Fontes: `package.json`, `client/src/main.jsx`, `client/src/Landing.jsx`,
`client/src/App.jsx`, `client/src/BarraLateral.jsx`, `client/src/Lista.jsx`,
`client/src/Cartao.jsx`, `client/src/TelaQuadro.jsx`,
`client/src/TelaAtendimento.jsx`, `server/src/quadros.js`,
`server/src/app.js`, `server/src/index.js` e `scripts/dev.mjs`.

## Pendências

`AGENTS.md` e `.github/agents` estavam ausentes nesta cópia na leitura.
A integração com GitHub Copilot via `.github/agents/*.agent.md` permanece
pendente; esta etapa não cria agentes nem um motor próprio de IA.
Condições comerciais ainda desconhecidas estão no catálogo
`automacao/commercial-catalog.json`.
