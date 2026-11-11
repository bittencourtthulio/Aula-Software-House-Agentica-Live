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
  return (fonte.body?.includes('<!-- knowledge:task ') ?? false) ||
    (fonte.labels?.some(l => (l.name ?? l) === 'knowledge:task') ?? false);
}

// Auditoria somente de leitura. A curadoria pertence à entrega original;
// nunca atribua agentes nem crie issues/PRs a partir desta reconciliação.
export async function reconciliar(api, { ler = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '' } = {}) {
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
  const pendencias = [];
  for (const [tipo, fontes] of [['pr', prs], ['issue', issues.filter(i => !i.pull_request && i.state === 'closed' && !interna(i))]]) {
    for (const fonte of fontes) {
      if (tipo === 'pr') {
        const arquivos = await listar(`/pulls/${fonte.number}/files?per_page=100`);
        if (arquivos.length && arquivos.every(f => f.filename.startsWith('docs/Knowledge/'))) continue;
      }
      const artigo = `docs/Knowledge/${tipo}-${fonte.number}.md`;
      const texto = ler(artigo);
      if (texto.includes(`source_revision: "${revisaoFonte(tipo, fonte)}"`)) continue;
      pendencias.push({ tipo, numero: fonte.number, artigo,
        motivo: texto ? 'snapshot-divergente' : 'artigo-ausente' });
    }
  }
  return { pendentes: pendencias.length, pendencias };
}

async function executar() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) throw new Error('GITHUB_REPOSITORY inválido.');
  if (!process.env.GITHUB_TOKEN) throw new Error('Configure GITHUB_TOKEN para a auditoria de leitura.');
  const cliente = token => async path => {
    const resposta = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!resposta.ok) throw new Error(`GitHub GET ${path}: HTTP ${resposta.status}`);
    return resposta.json();
  };
  console.log(JSON.stringify(await reconciliar(cliente(process.env.GITHUB_TOKEN)), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executar().catch(erro => { console.error(erro.message); process.exitCode = 1; });
}
