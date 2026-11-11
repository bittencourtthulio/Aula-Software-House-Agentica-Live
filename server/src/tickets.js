import { randomUUID } from "node:crypto";
import { naoEncontrado, texto } from "./http.js";
import { transacao } from "./db.js";

const sair = (t) => ({ id: t.id, titulo: t.titulo, descricao: t.descricao,
  status: t.fase, issueNumber: t.issue_number, criadoEm: t.criado_em });
const mensagemPublica = (m) => ({ id: m.id, autor: m.autor, texto: m.texto, criadoEm: m.criado_em });

/** Relê o requestId remoto antes de criar, inclusive após uma resposta perdida. */
export async function criarIssue(db, ticket, env = process.env, rede = fetch) {
  if (env.AGENT_RUNTIME !== "github-native" || ticket.issue_number) return;
  const payload = { title: ticket.titulo, labels: ["origin:app"],
    body: `${ticket.descricao}\n\nrequestId: ${ticket.request_id}` };
  if (env.AGENT_DRY_RUN !== "false") {
    console.log("[tickets dry-run]", JSON.stringify(payload));
    return;
  }
  try {
    if (!/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? "") || !env.GITHUB_TOKEN) {
      throw new Error("Configuração GitHub ausente.");
    }
    const base = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`;
    const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
    const api = async (url, options = {}) => {
      const r = await rede(url, { ...options, headers, signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
      return r.json();
    };
    let issue;
    for (let page = 1; ; page++) {
      const lista = await api(`${base}?state=all&labels=origin%3Aapp&per_page=100&page=${page}`);
      issue = lista.find((i) => !i.pull_request && i.body?.includes(`requestId: ${ticket.request_id}`));
      if (issue || lista.length < 100) break;
    }
    issue ??= await api(base, { method: "POST", body: JSON.stringify(payload) });
    db.prepare("UPDATE ticket SET issue_number = ?, fase = ? WHERE id = ?")
      .run(issue.number, "em_analise", ticket.id);
  } catch {
    db.prepare("UPDATE ticket SET fase = 'issue_pendente' WHERE id = ?").run(ticket.id);
    console.error("[tickets] Issue pendente; nova tentativa deve reler o requestId.");
  }
}

export function rotasDeTickets(app, db) {
  const dono = ({ req, res, estado }) => {
    const cookie = (req.headers.cookie ?? "").split(";").map((c) => c.trim())
      .find((c) => c.startsWith("fluxo_dono="))?.slice(11);
    estado.dono = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookie ?? "")
      ? cookie : randomUUID();
    if (estado.dono !== cookie) res.setHeader("set-cookie",
      `fluxo_dono=${estado.dono}; HttpOnly; SameSite=Lax; Path=/`);
  };
  const buscar = (id, proprietario) => {
    const t = db.prepare("SELECT * FROM ticket WHERE id = ? AND dono = ?").get(id, proprietario);
    if (!t) throw naoEncontrado("Ticket");
    return t;
  };
  const mensagens = (id) => db.prepare("SELECT * FROM mensagem WHERE ticket_id = ? ORDER BY criado_em, rowid")
    .all(id).map(mensagemPublica);
  const adicionar = (id, autor, conteudo) => {
    const m = { id: randomUUID(), autor, texto: conteudo, criado_em: new Date().toISOString() };
    db.prepare("INSERT INTO mensagem (id, ticket_id, autor, texto, criado_em) VALUES (?, ?, ?, ?, ?)")
      .run(m.id, id, autor, conteudo, m.criado_em);
    return mensagemPublica(m);
  };
  app.get("/api/tickets", dono, ({ estado }) => db.prepare(
    "SELECT * FROM ticket WHERE dono = ? ORDER BY criado_em DESC, rowid DESC").all(estado.dono).map(sair));
  app.post("/api/tickets", dono, async ({ corpo, estado }) => {
    const titulo = texto(corpo, "titulo", { max: 120 });
    const descricao = texto(corpo, "descricao", { max: 5000 });
    const id = randomUUID();
    transacao(db, () => {
      db.prepare("INSERT INTO ticket (id, dono, titulo, descricao, request_id, fase, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, estado.dono, titulo, descricao, randomUUID(), "em_analise", new Date().toISOString());
      adicionar(id, "cliente", descricao);
      adicionar(id, "n1", "Recebemos seu ticket e já estamos analisando.");
    });
    await criarIssue(db, buscar(id, estado.dono));
    return { ...sair(buscar(id, estado.dono)), mensagens: mensagens(id) };
  });
  app.get("/api/tickets/:id", dono, ({ params, estado }) => ({
    ...sair(buscar(params.id, estado.dono)), mensagens: mensagens(params.id),
  }));
  app.post("/api/tickets/:id/mensagens", dono, ({ params, corpo, estado }) => {
    buscar(params.id, estado.dono);
    return adicionar(params.id, "cliente", texto(corpo, "texto", { max: 5000 }));
  });
}
