import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function revisaoFonte(tipo, fonte) {
  const dados = tipo === 'pr'
    ? [fonte.title, fonte.body, fonte.state, fonte.head.sha, fonte.merged_at]
    : [fonte.title, fonte.body, fonte.state, fonte.closed_at, fonte.state_reason];
  return createHash('sha256').update(JSON.stringify(dados)).digest('hex');
}

export function interna(fonte) {
  return fonte.body?.includes('<!-- knowledge:task ') ?? false;
}

export async function reconciliar(api, { repo, ler = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '', atribuir } = {}) {
  async function listar(path) {
    const itens = [];
    for (let page = 1; ; page++) {
      const lote = await api(`${path}&page=${page}`);
      itens.push(...lote);
      if (lote.length < 100) return itens;
    }
  }
  const issues = await listar('/issues?state=all&per_page=100');
  const prs = await listar('/pulls?state=all&per_page=100');
  let pendentes = 0;
  for (const [tipo, fontes] of [['pr', prs], ['issue', issues.filter(i => !i.pull_request && i.state === 'closed' && !interna(i))]]) {
    for (const fonte of fontes) {
      if (tipo === 'pr') {
        const arquivos = await listar(`/pulls/${fonte.number}/files?per_page=100`);
        if (arquivos.length && arquivos.every(f => f.filename.startsWith('docs/Knowledge/'))) continue;
      }
      const revisao = revisaoFonte(tipo, fonte);
      const artigo = `docs/Knowledge/${tipo}-${fonte.number}.md`;
      if (ler(artigo).includes(`source_revision: "${revisao}"`)) continue;
      const marcador = `<!-- knowledge:task ${tipo}-${fonte.number} ${revisao} -->`;
      let tarefa = issues.find(i => !i.pull_request && i.body?.startsWith(marcador));
      if (!tarefa) {
        tarefa = await api('/issues', { method: 'POST', body: {
          title: `[Knowledge] Curar ${tipo} #${fonte.number}`,
          body: `${marcador}\n\nCurar a fonte ${fonte.html_url} em \`${artigo}\`.\nTipo: ${tipo}\nNúmero: ${fonte.number}\nsource_revision: "${revisao}"\n\nSiga AGENTS.md, docs/Knowledge/README.md e TEMPLATE.md. Leia diff, comentários e evidências; registre status real, limites e referências. Atualize o índice. Só altere docs/Knowledge/** e abra PR para revisão.`,
        } });
        issues.push(tarefa);
      }
      // Uma tarefa encerrada sem artigo é reaberta; falhas de atribuição são
      // tentadas novamente na próxima reconciliação, sem duplicar a issue.
      if (tarefa.state === 'closed') await api(`/issues/${tarefa.number}`, { method: 'PATCH', body: { state: 'open' } });
      if (!tarefa.assignees?.some(a => a.login === 'copilot-swe-agent[bot]')) {
        await atribuir(`/issues/${tarefa.number}/assignees`, { method: 'POST', body: {
          assignees: ['copilot-swe-agent[bot]'],
          agent_assignment: { target_repo: repo, base_branch: 'main', custom_agent: 'conhecimento',
            custom_instructions: `Execute a curadoria descrita na issue #${tarefa.number}. Leia docs/Knowledge/README.md. Escopo exclusivo: docs/Knowledge/**.` },
        } });
      }
      pendentes++;
    }
  }
  return { pendentes };
}

async function executar() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) throw new Error('GITHUB_REPOSITORY inválido.');
  // Falhe antes de criar tarefas se a credencial de curadoria estiver ausente.
  if (!process.env.COPILOT_AGENT_TOKEN || !process.env.GITHUB_TOKEN) throw new Error('Configure GITHUB_TOKEN e COPILOT_AGENT_TOKEN para a curadoria.');
  const cliente = token => async (path, { method = 'GET', body } = {}) => {
    const resposta = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
    });
    if (!resposta.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${resposta.status}`);
    return resposta.json();
  };
  console.log(await reconciliar(cliente(process.env.GITHUB_TOKEN), { repo, atribuir: cliente(process.env.COPILOT_AGENT_TOKEN) }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executar().catch(erro => { console.error(erro.message); process.exitCode = 1; });
}
