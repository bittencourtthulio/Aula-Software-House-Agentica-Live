import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

export function montarAtribuicao({ repo, issue, requestId, resultPath, pedido }) {
  return { assignees: ["copilot-swe-agent[bot]"], agent_assignment: {
    target_repo: repo, base_branch: "main", custom_agent: "coordenador",
    custom_instructions: `Issue #${issue}.\n${pedido}\nrequestId: ${requestId}\nresultPath: ${resultPath}`,
  } };
}

export async function executar(env = process.env, rede = fetch) {
  const evento = env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8")) : {};
  const repo = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? "")) throw new Error("Informe GITHUB_REPOSITORY.");
  const dryRun = env.AGENT_DRY_RUN !== "false";
  const base = `https://api.github.com/repos/${repo}`;
  const api = async (path, { method = "GET", body, atribuicao = false } = {}) => {
    const token = atribuicao ? env.COPILOT_AGENT_TOKEN : env.GITHUB_TOKEN;
    if (!token) throw new Error("Token necessário para executar fora de dry-run.");
    const response = await rede(`${base}${path}`, { method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
  // PRs referenciam a issue original; nunca criamos outra issue.
  const referencias = [...(evento.pull_request?.body ?? "").matchAll(
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/)?#?(\d+)/gi)]
    .map((m) => Number(m[1]));
  const numero = Number(env.ISSUE_NUMBER || evento.inputs?.issue_number || evento.issue?.number || referencias[0]);
  if (!Number.isSafeInteger(numero) || numero < 1) {
    console.log("Nenhuma issue de origem identificada.");
    return;
  }
  if (dryRun) {
    if (evento.issue && !evento.issue.labels?.some((l) => (l.name ?? l) === "origin:app")) return;
    const requestId = evento.issue?.body?.match(/requestId:\s*([0-9a-f-]{36})/i)?.[1] ?? randomUUID();
    console.log(JSON.stringify({ dryRun: true, issue: numero, payload: montarAtribuicao({ repo,
      issue: numero, requestId, resultPath: `automacao/resultados/${requestId}.json`,
      pedido: evento.issue?.body ?? "Reler a issue e os comentários antes de agir." }) }, null, 2));
    return;
  }
  const issue = await api(`/issues/${numero}`);
  if (issue.pull_request || !issue.labels.some((l) => l.name === "origin:app")) return;
  const comentarios = [];
  for (let page = 1; ; page++) {
    const lote = await api(`/issues/${numero}/comments?per_page=100&page=${page}`);
    comentarios.push(...lote);
    if (lote.length < 100) break;
  }
  // Só o comentário do próprio workflow pode encerrar a atribuição.
  const marcador = comentarios.find((c) => c.user?.login === "github-actions[bot]" &&
    /<!-- native-agents:assigned requestId=[0-9a-f-]{36} -->/i.test(c.body));
  if (marcador) return;
  const requestId = issue.body?.match(/requestId:\s*([0-9a-f-]{36})/i)?.[1] ?? randomUUID();
  const resultPath = `automacao/resultados/${requestId}.json`;
  const payload = montarAtribuicao({ repo, issue: numero, requestId, resultPath,
    pedido: `${issue.title}\n${issue.body ?? ""}\n\nComentários:\n${comentarios.map((c) => c.body).join("\n")}` });
  if (!issue.assignees?.some((a) => a.login === "copilot-swe-agent[bot]")) {
    await api(`/issues/${numero}/assignees`, { method: "POST", body: payload, atribuicao: true });
  }
  await api(`/issues/${numero}/comments`, { method: "POST", body: { body:
    `<!-- native-agents:assigned requestId=${requestId} -->\nResumo interno: issue #${numero} atribuída ao coordenador.\nrequestId: ${requestId}\nresultPath: ${resultPath}` } });
  // TODO: reconciliar mensagens N1 do resultPath com o backend de tickets.
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executar().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
}
