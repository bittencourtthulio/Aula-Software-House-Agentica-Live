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
  const consultas = [];
  return { consultas, api: async (path, op) => {
    assert.equal(op, undefined, 'auditoria não pode escrever na API');
    consultas.push(path);
    if (path.startsWith('/issues?')) return issues;
    if (path.startsWith('/pulls?')) return prs;
    if (path.includes('/files?')) return arquivos;
    throw new Error(`Consulta inesperada: ${path}`);
  } };
}

test('fontes ausentes são relatadas sem criar tarefas nem atribuir agentes', async () => {
  const a = ambiente();
  const resultado = await reconciliar(a.api, { ler: () => '' });
  assert.equal(resultado.pendentes, 2);
  assert.deepEqual(resultado.pendencias.map(p => [p.artigo, p.motivo]), [
    ['docs/Knowledge/pr-12.md', 'artigo-ausente'],
    ['docs/Knowledge/issue-9.md', 'artigo-ausente'],
  ]);
});

test('snapshot igual é omitido; commit e merge divergentes só geram diagnóstico', async () => {
  const ler = () => `source_revision: "${revisaoFonte('pr', pr)}"`;
  assert.equal((await reconciliar(ambiente({ issues: [] }).api, { ler })).pendentes, 0);
  for (const nova of [{ ...pr, head: { sha: 'def' } }, { ...pr, state: 'closed', merged_at: '2026-11-11' }]) {
    const resultado = await reconciliar(ambiente({ prs: [nova], issues: [] }).api, { ler });
    assert.equal(resultado.pendencias[0].motivo, 'snapshot-divergente');
  }
});

test('não audita PRs exclusivas da base nem issues internas por marcador ou label', async () => {
  const tarefas = [
    { ...issue, body: '<!-- knowledge:task pr-12 abc -->' },
    { ...issue, body: 'Tarefa antiga', labels: [{ name: 'knowledge:task' }] },
    { ...issue, labels: ['knowledge:task'] },
  ];
  const a = ambiente({ issues: tarefas, arquivos: [{ filename: 'docs/Knowledge/pr-4.md' }] });
  assert.equal((await reconciliar(a.api, { ler: () => '' })).pendentes, 0);
});

test('PR com produto e artigo continua auditável; issue aberta não é resolução', async () => {
  const a = ambiente({ issues: [{ ...issue, state: 'open' }], arquivos: [
    { filename: 'docs/Knowledge/pr-12.md' }, { filename: 'client/src/tela.jsx' },
  ] });
  assert.equal((await reconciliar(a.api, { ler: () => '' })).pendentes, 1);
});

test('paginação inclui fontes além da primeira página sem escrever', async () => {
  let pagina2 = false;
  const a = ambiente({ prs: [], issues: [] });
  const api = async (path, op) => {
    assert.equal(op, undefined);
    if (path.startsWith('/pulls?')) {
      if (path.endsWith('page=1')) return Array.from({ length: 100 }, (_, i) => ({ ...pr, number: i + 100 }));
      pagina2 = true;
      return [pr];
    }
    return a.api(path, op);
  };
  assert.equal((await reconciliar(api, { ler: () => '' })).pendentes, 101);
  assert.ok(pagina2);
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
    assert.ok((meta.type === 'pr' ? ['proposta','integrado','descartado'] : ['em-atendimento','resolvido','encerrado-sem-solucao']).includes(meta.status));
    for (const id of meta.related) assert.ok(existsSync(new URL(`${id}.md`, pasta)), id);
    for (const secao of ['Quando consultar','Contexto e causa','Solução e decisão','Evidências e validação','Limites e prevenção']) assert.ok(texto.includes(`## ${secao}`), nome);
    assert.ok(indice.includes(`](${nome})`), nome);
  }
});
