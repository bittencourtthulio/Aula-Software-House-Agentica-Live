import assert from "node:assert/strict";
import { test } from "node:test";
import { abrirBanco } from "../src/db.js";
import { criarSincronizador } from "../src/progresso-tickets.js";
import { rotasDeTickets } from "../src/tickets.js";
import { reconciliarProgresso, montarAtribuicao, executar } from "../../automacao/controlador.mjs";
import { blocoProgresso, lerProgresso, marcadorUpdate } from "../../automacao/progresso.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const requestId = "11111111-1111-4111-8111-111111111111";
const repo = "teste/fluxo";
const bot = { login: "github-actions[bot]", type: "Bot" };
const updates = [
  { id: "dev-inicio", agent: "desenvolvedor", internalText: "Iniciada correção de Cartao.jsx", publicText: "Começamos a trabalhar no ajuste solicitado." },
  { id: "teste-interno", agent: "revisor", internalText: "Comando interno: node --test", publicText: "" },
  { id: "revisao", agent: "revisor", internalText: "Revisão devolvida ao coordenador", publicText: "O ajuste está em revisão." },
];
const progresso = { requestId, issueNumber: 7, updates };
const issue = { number: 7, body: `requestId: ${requestId}`, labels: [{ name: "origin:app" }] };
const atribuicao = { id: 1, user: bot, body: `<!-- native-agents:assigned requestId=${requestId} -->` };
const pr = { number: 8, user: { login: "Copilot", type: "Bot" }, body: blocoProgresso(progresso),
  head: { repo: { full_name: repo } }, base: { ref: "main", repo: { full_name: repo } } };
const env = { AGENT_RUNTIME: "github-native", AGENT_DRY_RUN: "false", GITHUB_TOKEN: "teste", GITHUB_REPOSITORY: repo };

function bancoTicket() {
  const db = abrirBanco();
  db.prepare(`INSERT INTO ticket (id, dono, titulo, descricao, request_id, issue_number, fase, criado_em)
    VALUES ('t1', 'dono', 'Pedido', 'Descrição', ?, 7, 'em_analise', '2026-11-11T10:00:00Z')`).run(requestId);
  return db;
}
function apiComentarios(comentarios) {
  return async (path, op = {}) => {
    assert.equal(path, "/issues/7/comments");
    assert.equal(op.method, "POST");
    const comentario = { id: comentarios.length + 1, user: bot, body: op.body.body, created_at: "2026-11-11T11:00:00Z" };
    comentarios.push(comentario);
    return comentario;
  };
}

test("coordenador → issue → ticket: marcos internos preservados, só N1 público, sem repetição após reinício", async () => {
  const comentarios = [atribuicao];
  // Simula listagem remota separada para não compartilhar o array mutado pelo controlador.
  await reconciliarProgresso(apiComentarios(comentarios), issue, pr, repo, [...comentarios]);
  assert.equal(comentarios.length, 4);
  await reconciliarProgresso(apiComentarios(comentarios), issue, pr, repo, [...comentarios]);
  assert.equal(comentarios.length, 4);
  assert.ok(comentarios[2].body.includes("Comando interno"));
  const db = bancoTicket();
  try {
    let consultas = 0;
    const rede = async () => { consultas++; return { ok: true, json: async () => comentarios }; };
    const ticket = db.prepare("SELECT * FROM ticket").get();
    const sincronizar = criarSincronizador(db, env, rede);
    await Promise.all([sincronizar(ticket), sincronizar(ticket)]);
    await sincronizar(ticket);
    assert.equal(consultas, 1);
    await criarSincronizador(db, env, rede)(ticket);
    const mensagens = db.prepare("SELECT * FROM mensagem ORDER BY rowid").all();
    assert.equal(mensagens.length, 2);
    assert.deepEqual(mensagens.map((m) => m.texto), [updates[0].publicText, updates[2].publicText]);
    assert.ok(mensagens.every((m) => m.autor === "n1"));
    const rotas = new Map();
    rotasDeTickets({ get: (path, ...handlers) => rotas.set(path, handlers), post() {} }, db, { env: {} });
    const detalhe = await rotas.get("/api/tickets/:id").at(-1)({ params: { id: "t1" }, estado: { dono: "dono" } });
    assert.equal(detalhe.mensagens.length, 2);
    assert.ok(!JSON.stringify(detalhe).includes("internalText"));
    await assert.rejects(() => rotas.get("/api/tickets/:id").at(-1)({ params: { id: "t1" }, estado: { dono: "outro" } }), { status: 404 });
  } finally { db.close(); }
});

test("controlador rejeita PR de fork, outro autor, requestId divergente ou sem atribuição", async () => {
  const api = () => { throw new Error("Não deveria publicar"); };
  for (const alteracao of [
    { head: { repo: { full_name: "outro/fork" } } },
    { user: { login: "cliente", type: "User" } },
    { body: blocoProgresso({ ...progresso, requestId: "22222222-2222-4222-8222-222222222222" }) },
    { body: blocoProgresso({ ...progresso, issueNumber: 9 }) },
  ]) await reconciliarProgresso(api, issue, { ...pr, ...alteracao }, repo, [atribuicao]);
  await reconciliarProgresso(api, issue, pr, repo, []);
});

test("contrato recusa blocos ambíguos, IDs repetidos, agente desconhecido e payload inválido", () => {
  for (const body of [null, "", blocoProgresso(progresso).repeat(2),
    blocoProgresso({ ...progresso, updates: [updates[0], updates[0]] }),
    blocoProgresso({ ...progresso, updates: [{ ...updates[0], agent: "intruso" }] }),
    blocoProgresso({ ...progresso, updates: [{ ...updates[0], publicText: null }] }),
  ]) assert.equal(lerProgresso(body), null);
});

test("sincronizador ignora comentários falsificados e pagina antes de importar", async () => {
  const db = bancoTicket();
  try {
    const body = marcadorUpdate(requestId, updates[0].id) + "\n" + blocoProgresso({ ...progresso, updates: [updates[0]] });
    const valido = { user: bot, body, created_at: "2026-11-11T12:00:00Z" };
    const invalidos = [
      { ...valido, user: { login: "cliente", type: "User" } },
      { ...valido, body: body.replaceAll(requestId, "22222222-2222-4222-8222-222222222222") },
      { ...valido, body: body.replace('"issueNumber":7', '"issueNumber":9') },
      { ...valido, body: blocoProgresso({ ...progresso, updates: [updates[0]] }) },
    ];
    let chamadas = 0;
    const rede = async (url) => {
      chamadas++;
      return { ok: true, json: async () => url.endsWith("page=1") ? Array.from({ length: 100 }, (_, i) => invalidos[i % 4]) : [valido] };
    };
    await criarSincronizador(db, env, rede)(db.prepare("SELECT * FROM ticket").get());
    assert.equal(chamadas, 2);
    assert.equal(db.prepare("SELECT count(*) AS n FROM mensagem").get().n, 1);
  } finally { db.close(); }
});

test("dry-run não consulta rede; falha remota preserva mensagens e permite nova tentativa", async () => {
  const db = bancoTicket();
  try {
    const ticket = db.prepare("SELECT * FROM ticket").get();
    await criarSincronizador(db, { ...env, AGENT_DRY_RUN: "true" }, () => { throw new Error("rede proibida"); })(ticket);
    await criarSincronizador(db, env, async () => ({ ok: false, status: 503 }))(ticket);
    assert.equal(db.prepare("SELECT count(*) AS n FROM mensagem").get().n, 0);
    await criarSincronizador(db, env, async () => ({ ok: true, json: async () => [] }))(ticket);
  } finally { db.close(); }
});

test("eventos de edição e agendamento reconciliam mesmo após issue já atribuída", async () => {
  const pasta = mkdtempSync(join(tmpdir(), "fluxo-progresso-"));
  try {
    for (const evento of [{ pull_request: pr }, { schedule: "*/5 * * * *" }]) {
      const path = join(pasta, "evento.json");
      writeFileSync(path, JSON.stringify(evento));
      const comentarios = [atribuicao];
      const rede = async (url, op) => {
        const pathApi = url.replace(`https://api.github.com/repos/${repo}`, "");
        let dados;
        if (op.method === "POST") dados = await apiComentarios(comentarios)(pathApi, { ...op, body: JSON.parse(op.body) });
        else if (pathApi === "/issues/7") dados = issue;
        else if (pathApi.startsWith("/issues/7/comments?")) dados = [...comentarios];
        else if (pathApi === "/pulls/8") dados = pr;
        else if (pathApi.startsWith("/pulls?")) dados = [pr];
        else assert.fail(pathApi);
        return { ok: true, status: 200, json: async () => dados };
      };
      await executar({ ...env, GITHUB_EVENT_PATH: path }, rede);
      assert.equal(comentarios.length, 4);
    }
    assert.match(montarAtribuicao({ repo, issue: 7, requestId, resultPath: "resultado", pedido: "Pedido" }).agent_assignment.custom_instructions, /COMUNICACAO.md/);
  } finally { rmSync(pasta, { recursive: true }); }
});

test("falha em página posterior não importa lote parcial nem apaga histórico local", async () => {
  const db = bancoTicket();
  try {
    db.prepare("INSERT INTO mensagem (id, ticket_id, autor, texto, criado_em) VALUES ('local', 't1', 'cliente', 'Minha mensagem', '2026-11-11T10:00:00Z')").run();
    const comentario = { user: bot, body: marcadorUpdate(requestId, updates[0].id) + "\n" +
      blocoProgresso({ ...progresso, updates: [updates[0]] }), created_at: "2026-11-11T12:00:00Z" };
    const ticket = db.prepare("SELECT * FROM ticket").get();
    await criarSincronizador(db, env, async (url) => url.endsWith("page=1")
      ? { ok: true, json: async () => Array(100).fill(comentario) }
      : { ok: false, status: 503 })(ticket);
    assert.deepEqual(db.prepare("SELECT texto FROM mensagem").all().map((m) => m.texto), ["Minha mensagem"]);
    await criarSincronizador(db, env, async () => ({ ok: true, json: async () => [comentario] }))(ticket);
    assert.equal(db.prepare("SELECT count(*) AS n FROM mensagem").get().n, 2);
  } finally { db.close(); }
});
