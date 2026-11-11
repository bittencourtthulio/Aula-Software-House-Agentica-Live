# Etapa 00: preparação local

Registro de 11/11/2026, limitado à cópia de trabalho existente.

## Cópia e execução

- Repositório de origem: https://github.com/bittencourtthulio/Aula-Software-House-Agentica-Live
- Cópia local: `/Volumes/ArquivoMac/orca/projects/Aula-Software-House-Agentica-Live`.
- Comando de desenvolvimento: `npm run dev`, na raiz. Ele inicia API e
  interface em primeiro plano, escolhe portas livres e imprime os endereços.
  Ctrl+C encerra ambos.
- Dependências existentes foram reutilizadas; instalação não foi necessária.
  Nenhuma dependência ou lockfile foi alterado por este card.
- `npm run build`: código de saída 0. Vite 7.3.8 processou 46 módulos e
  gerou a interface em `dist/`, em 633 ms. O EPERM anterior ao gravar
  `node_modules/.vite-temp` não ocorreu nesta execução.

## Checagem do app

Pendente. A instrução de modo rápido desta execução proíbe subir servidores
e limita a verificação ao build. Nenhum servidor foi iniciado pelo card.
A leitura de `scripts/dev.mjs` e `server/src/index.js` confirmou que a
inicialização padrão abre `server/dados/app.sqlite`. Uma futura checagem
deve usar banco descartável por `BANCO`, preservando o SQLite real.
O build aprovado não comprova o funcionamento da API ou da interface aberta.

## GitHub e Copilot

Resultado do scout comunicado pelo piloto nesta execução, sem repetição
das consultas pelo executor:

- `gh auth status` válido no worker; repositório acessível com acesso admin.
- `GET repos/bittencourtthulio/Aula-Software-House-Agentica-Live/actions/permissions`:
  `enabled=true`.
- `GET user/copilot`: HTTP 404. Isso não comprova ausência de assinatura.
- Plano pago e disponibilidade do cloud agent continuam sem verificação.
- Nenhuma configuração remota foi alterada.

O backend local Node/SQLite é independente de uma futura automação no
GitHub Actions. `COPILOT_AGENT_TOKEN` seria uma credencial dessa automação
futura; este card não cria, lê nem configura esse segredo. Actions habilitado
não comprova que o Copilot ou o cloud agent estejam disponíveis.

## Limites desta entrega

Foram lidas as instruções do repositório e os scripts de inicialização e
build. Nenhum arquivo de ambiente, credencial ou banco foi lido ou alterado.
Não foram criados agentes de produto, workflows ou configurações remotas.
