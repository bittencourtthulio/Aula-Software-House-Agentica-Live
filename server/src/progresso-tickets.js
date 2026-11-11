import { randomUUID } from "node:crypto";
import { lerProgresso, marcadorUpdate } from "../../automacao/progresso.mjs";
import { transacao } from "./db.js";

// Pull autenticado: funciona inclusive quando o app roda só no computador do usuário.
export function criarSincronizador(db, env = process.env, rede = fetch) {
  const consultas = new Map();
  return async (ticket) => {
    if (env.AGENT_RUNTIME !== "github-native" || env.AGENT_DRY_RUN !== "false" ||
        !ticket.issue_number || !env.GITHUB_TOKEN ||
        !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? "")) return;
    const anterior = consultas.get(ticket.id);
    if (anterior?.pendente) return anterior.pendente;
    if (anterior && Date.now() - anterior.em < 10000) return;
    const estado = { em: Date.now(), pendente: null };
    consultas.set(ticket.id, estado);
    // Cache curto e limitado; a deduplicação durável está no SQLite.
    for (const [id, v] of consultas) if (!v.pendente && Date.now() - v.em > 60000) consultas.delete(id);
    estado.pendente = (async () => {
      try {
        const updates = [];
        const signal = AbortSignal.timeout(15000);
        for (let page = 1; ; page++) {
          const resposta = await rede(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/${ticket.issue_number}/comments?per_page=100&page=${page}`, {
            headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28" }, signal,
          });
          if (!resposta.ok) throw new Error(`GitHub HTTP ${resposta.status}`);
          const comentarios = await resposta.json();
          for (const comentario of comentarios) {
            if (comentario.user?.login !== "github-actions[bot]" || comentario.user?.type !== "Bot") continue;
            const progresso = lerProgresso(comentario.body);
            if (!progresso || progresso.requestId !== ticket.request_id || progresso.issueNumber !== ticket.issue_number ||
                progresso.updates.length !== 1) continue;
            const update = progresso.updates[0];
            if (!update.publicText || !comentario.body.startsWith(marcadorUpdate(ticket.request_id, update.id)) ||
                !Number.isFinite(Date.parse(comentario.created_at))) continue;
            updates.push({ ...update, criadoEm: comentario.created_at });
          }
          if (comentarios.length < 100) break;
        }
        transacao(db, () => {
          const inserir = db.prepare(`INSERT INTO mensagem (id, ticket_id, autor, texto, externo_id, criado_em)
            VALUES (?, ?, 'n1', ?, ?, ?) ON CONFLICT(externo_id) DO NOTHING`);
          for (const u of updates) inserir.run(randomUUID(), ticket.id, u.publicText,
            `native-agents:${ticket.request_id}:${u.id}`, u.criadoEm);
        });
      } catch {
        // Uma indisponibilidade remota não impede ler/enviar mensagens locais.
        console.error("[tickets] Não foi possível sincronizar progresso; nova tentativa na próxima consulta.");
      } finally { estado.pendente = null; }
    })();
    return estado.pendente;
  };
}
