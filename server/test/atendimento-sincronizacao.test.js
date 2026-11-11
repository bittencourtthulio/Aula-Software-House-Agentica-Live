import assert from "node:assert/strict";
import { test } from "node:test";
import { abrirBanco } from "../src/db.js";
import { rotasDeTickets } from "../src/tickets.js";
import { blocoProgresso, marcadorUpdate } from "../../automacao/progresso.mjs";

const requestId = "11111111-1111-4111-8111-111111111111";
const env = { AGENT_RUNTIME: "github-native", AGENT_DRY_RUN: "false", GITHUB_TOKEN: "teste", GITHUB_REPOSITORY: "teste/fluxo" };
const comentario = (id) => ({ user: { login: "github-actions[bot]", type: "Bot" }, created_at: "2026-11-11T12:00:00Z",
  body: marcadorUpdate(requestId, id) + "\n" + blocoProgresso({ requestId, issueNumber: 7,
    updates: [{ id, agent: "n1", internalText: "Marco real", publicText: id }] }) });
function preparar(db, opcoes) {
  const rotas = new Map();
  rotasDeTickets({ get: (p, ...h) => rotas.set(`GET ${p}`, h.at(-1)), post: (p, ...h) => rotas.set(`POST ${p}`, h.at(-1)) }, db, opcoes);
  return rotas;
}

test("abertura confirma somente mensagem do cliente, sem resposta automática atribuída ao N1", async () => {
  const db = abrirBanco();
  try {
    const rotas = preparar(db, { env: {} });
    const ticket = await rotas.get("POST /api/tickets")({ corpo: { titulo: "Pedido", descricao: "Minha solicitação" }, estado: { dono: "dono" } });
    assert.deepEqual(ticket.mensagens.map((m) => [m.autor, m.texto]), [["cliente", "Minha solicitação"]]);
  } finally { db.close(); }
});

test("atualização manual importa marcos durante andamento, pula cache, deduplica e informa falha", async () => {
  const db = abrirBanco();
  try {
    db.prepare(`INSERT INTO ticket (id, dono, titulo, descricao, request_id, issue_number, fase, criado_em)
      VALUES ('t1', 'dono', 'Pedido', 'Descrição', ?, 7, 'em_analise', '2026-11-11T10:00:00Z')`).run(requestId);
    let chamadas = 0, falhar = false;
    const comentarios = [comentario("iniciado")];
    const rotas = preparar(db, { env, rede: async () => {
      chamadas++;
      return { ok: !falhar, status: falhar ? 503 : 200, json: async () => [...comentarios] };
    } });
    const ler = (forcar = false, dono = "dono") => rotas.get("GET /api/tickets/:id")({ params: { id: "t1" }, estado: { dono },
      url: new URL(`http://localhost/api/tickets/t1${forcar ? "?atualizar=1" : ""}`) });
    assert.equal((await ler()).mensagens.length, 1);
    comentarios.push(comentario("em-revisao"));
    assert.equal((await ler()).mensagens.length, 1);
    assert.equal(chamadas, 1);
    assert.deepEqual((await ler(true)).mensagens.map((m) => m.texto), ["iniciado", "em-revisao"]);
    assert.equal((await ler(true)).mensagens.length, 2);
    falhar = true;
    const falha = await ler(true);
    assert.equal(falha.mensagens.length, 2);
    assert.match(falha.erroSincronizacao, /GitHub/);
    assert.match((await ler()).erroSincronizacao, /GitHub/);
    falhar = false;
    assert.equal((await ler(true)).erroSincronizacao, undefined);
    await assert.rejects(() => ler(true, "outro"), { status: 404 });
  } finally { db.close(); }
});
