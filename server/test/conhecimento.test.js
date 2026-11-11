import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { reconciliar, revisaoFonte } from '../../automacao/conhecimento.mjs';

const repo = 'exemplo/fluxo';
const pr = { number: 12, title: 'Corrigir chat', body: 'Contexto', state: 'open',
  head: { sha: 'abc' }, merged_at: null, html_url: `https://github.com/${repo}/pull/12` };
const issue = { number: 9, title: 'Como criar quadro', body: 'Dúvida', state: 'closed',
  closed_at: '2026-11-11T12:00:00Z', state_reason: 'completed', html_url: `https://github.com/${repo}/issues/9` };

function ambiente({ prs = [pr], issues = [issue], arquivos = [{ filename: 'client/src/tela.jsx' }] } = {}) {
  const escritas = [], atribuicoes = [];
  return { escritas, atribuicoes,
    api: async (path, op) => {
      if (op) {
        escritas.push({ path, ...op });
        return { number: 30 + escritas.length, state: 'open', assignees: [], ...op.body };
      }
      if (path.startsWith('/issues?')) return issues;
      if (path.startsWith('/pulls?')) return prs;
      if (path.includes('/files?')) return arquivos;
      throw new Error(`Consulta inesperada: ${path}`);
    },
    atribuir: async (path, op) => atribuicoes.push({ path, ...op }),
  };
}

test('captura PR aberta e issue encerrada com revisão e agente de curadoria', async () => {
  const a = ambiente();
  assert.deepEqual(await reconciliar(a.api, { repo, ler: () => '', atribuir: a.atribuir }), { pendentes: 2 });
  assert.equal(a.escritas.length, 2);
  assert.equal(a.atribuicoes.length, 2);
  assert.match(a.escritas[0].body.body, /docs\/Knowledge\/pr-12.md/);
  assert.ok(a.escritas[1].body.body.includes(revisaoFonte('issue', issue)));
  assert.equal(a.atribuicoes[0].body.agent_assignment.custom_agent, 'conhecimento');
});

test('artigo na mesma revisão não gera tarefa; merge e novo commit invalidam a revisão', async () => {
  const a = ambiente({ issues: [] });
  const ler = () => `source_revision: "${revisaoFonte('pr', pr)}"`;
  await reconciliar(a.api, { repo, ler, atribuir: a.atribuir });
  assert.equal(a.escritas.length, 0);
  for (const nova of [{ ...pr, head: { sha: 'def' } }, { ...pr, state: 'closed', merged_at: '2026-11-11' }]) {
    assert.notEqual(revisaoFonte('pr', nova), revisaoFonte('pr', pr));
    const b = ambiente({ prs: [nova], issues: [] });
    await reconciliar(b.api, { repo, ler, atribuir: b.atribuir });
    assert.equal(b.escritas.length, 1);
  }
});

test('tarefa existente evita duplicação e permite retentar atribuição que falhou', async () => {
  const tarefa = { number: 30, body: `<!-- knowledge:task pr-12 ${revisaoFonte('pr', pr)} -->`, state: 'open', assignees: [] };
  const a = ambiente({ issues: [tarefa] });
  await reconciliar(a.api, { repo, ler: () => '', atribuir: a.atribuir });
  assert.equal(a.escritas.length, 0);
  assert.equal(a.atribuicoes.length, 1);
  tarefa.assignees.push({ login: 'copilot-swe-agent[bot]' });
  const b = ambiente({ issues: [tarefa] });
  await reconciliar(b.api, { repo, ler: () => '', atribuir: b.atribuir });
  assert.equal(b.atribuicoes.length, 0);
});

test('não recursa sobre PRs da base nem issues internas; reabre tarefa sem artigo', async () => {
  const tarefa = { number: 30, body: `<!-- knowledge:task pr-12 ${revisaoFonte('pr', pr)} -->`, state: 'closed', assignees: [] };
  const a = ambiente({ issues: [tarefa], arquivos: [{ filename: 'docs/Knowledge/pr-4.md' }] });
  await reconciliar(a.api, { repo, ler: () => '', atribuir: a.atribuir });
  assert.equal(a.escritas.length, 0);
  const b = ambiente({ issues: [tarefa] });
  await reconciliar(b.api, { repo, ler: () => '', atribuir: b.atribuir });
  assert.deepEqual(b.escritas.map(e => [e.path, e.method]), [['/issues/30', 'PATCH']]);
});

test('paginação inclui fontes além da primeira página', async () => {
  let pagina2 = false;
  const a = ambiente({ prs: [], issues: [] });
  const api = async (path, op) => {
    if (!op && path.startsWith('/pulls?')) {
      if (path.endsWith('page=1')) return Array.from({ length: 100 }, (_, i) => ({ ...pr, number: i + 100 }));
      pagina2 = true;
      return [pr];
    }
    return a.api(path, op);
  };
  await reconciliar(api, { repo, ler: () => '', atribuir: a.atribuir });
  assert.ok(pagina2);
  assert.equal(a.escritas.length, 101);
});

test('artigos da base têm metadados completos, seções e relações válidas', () => {
  const pasta = new URL('../../docs/Knowledge/', import.meta.url);
  const indice = readFileSync(new URL('README.md', pasta), 'utf8');
  const campos = ['id','title','type','status','source','source_revision','source_state','source_closed_at','updated_at','tags','paths','related'];
  for (const nome of readdirSync(pasta).filter(n => /^(pr|issue)-\d+\.md$/.test(n))) {
    const texto = readFileSync(new URL(nome, pasta), 'utf8');
    const front = texto.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(front, nome);
    const meta = Object.fromEntries(front[1].split('\n').map(l => {
      const i = l.indexOf(':');
      return [l.slice(0, i), JSON.parse(l.slice(i + 1))];
    }));
    for (const campo of campos) assert.ok(Object.hasOwn(meta, campo), `${nome}: ${campo}`);
    assert.equal(`${meta.id}.md`, nome);
    assert.match(meta.source_revision, /^[a-f0-9]{64}$/);
    assert.ok((meta.type === 'pr' ? ['proposta','integrado','descartado'] : ['resolvido','encerrado-sem-solucao']).includes(meta.status));
    for (const id of meta.related) assert.ok(existsSync(new URL(`${id}.md`, pasta)), id);
    for (const secao of ['Quando consultar','Contexto e causa','Solução e decisão','Evidências e validação','Limites e prevenção']) assert.ok(texto.includes(`## ${secao}`), nome);
    assert.ok(indice.includes(`](${nome})`), nome);
  }
});
