import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { acolherAtendimento, analisarAtendimento, validarAtendimento, publicarAtendimento, retomarAtendimento } from "./atendimento.mjs";
import { lerProgresso, blocoProgresso, marcadorUpdate } from "./progresso.mjs";

export function montarAtribuicao({ repo, issue, requestId, resultPath, pedido }) {
  return { assignees: ["copilot-swe-agent[bot]"], agent_assignment: {
    target_repo: repo, base_branch: "main", custom_agent: "coordenador",
    custom_instructions: `Issue #${issue}.\n${pedido}\nrequestId: ${requestId}\nresultPath: ${resultPath}\nLeia AGENTS.md e docs/Knowledge/README.md. Inclua artigos e índice na MESMA PR da implementação e peça revisão conjunta. Não abra outra issue ou PR para curadoria. Leia docs/automacao-atendimento/COMUNICACAO.md. Sua primeira ação é invocar N1 para comunicar entendimento e próximo encaminhamento; publique esse marco via report_progress antes de delegar ao PO, banco, desenvolvimento ou outros especialistas. Não espere análise técnica ou implementação. A cada marco, preserve na descrição da PR um bloco native-agents-progress completo, com issueNumber: ${issue} e requestId recebido. Use report_progress durante o trabalho, sem esperar o resultado final.`,
  } };
}

export async function executar(env = process.env, rede = fetch, analisar = analisarAtendimento, acolher = acolherAtendimento) {
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
  let numero = Number(env.ISSUE_NUMBER || evento.inputs?.issue_number || evento.issue?.number || referencias[0]);
  const progressoEvento = lerProgresso(evento.pull_request?.body);
  if (progressoEvento) numero = progressoEvento.issueNumber;
  if ((!Number.isSafeInteger(numero) || numero < 1) && evento.schedule && !dryRun) {
    const prs = await listarPaginado(api, "/pulls?state=open&per_page=100");
    for (const pr of prs) {
      const progresso = lerProgresso(pr.body);
      if (!progresso || !prConfiavel(pr, repo)) continue;
      const origem = await api(`/issues/${progresso.issueNumber}`);
      await reconciliarProgresso(api, origem, pr, repo);
    }
    const abertas = await listarPaginado(api, "/issues?state=open&labels=origin%3Aapp&per_page=100");
    for (const origem of abertas) {
      if (!origem.pull_request) await retomarAtendimento(api, origem);
    }
    return;
  }
  if (!Number.isSafeInteger(numero) || numero < 1) {
    console.log("Nenhuma issue de origem identificada.");
    return;
  }
  if (dryRun) {
    if (evento.issue && !evento.issue.labels?.some((l) => (l.name ?? l) === "origin:app")) return;
    const requestId = evento.issue?.body?.match(/requestId:\s*([0-9a-f-]{36})/i)?.[1] ?? randomUUID();
    console.log(JSON.stringify({ dryRun: true, issue: numero, firstStep: "N1 confirma recebimento antes da análise; N1 e coordenador fazem triagem e somente code usa o payload abaixo", payload: montarAtribuicao({ repo,
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
  if (await retomarAtendimento(api, issue, comentarios)) return;
  if (issue.state === "closed") return;
  // Só o comentário do próprio workflow pode encerrar a atribuição.
  const marcador = comentarios.find((c) => c.user?.login === "github-actions[bot]" &&
    /<!-- native-agents:assigned requestId=[0-9a-f-]{36} -->/i.test(c.body));
  if (marcador) {
    // Comentários gerados pela ponte não disparam outra reconciliação.
    // PRs, agendamento e execução manual compartilham a fila pr-reconcile.
    if (!evento.pull_request && !env.ISSUE_NUMBER && !evento.inputs?.issue_number) return;
    const prs = evento.pull_request
      ? [await api(`/pulls/${evento.pull_request.number}`)]
      : await listarPaginado(api, "/pulls?state=open&per_page=100");
    for (const pr of prs) await reconciliarProgresso(api, issue, pr, repo, comentarios);
    return;
  }
  // Eventos de PR/comentários de bots nunca iniciam outra atribuição.
  if (evento.pull_request || evento.comment?.user?.type === "Bot") return;
  const requestId = issue.body?.match(/requestId:\s*([0-9a-f-]{36})/i)?.[1] ?? randomUUID();
  const recebimento = marcadorUpdate(requestId, "recebimento");
  if (!comentarios.some((c) => c.user?.login === "github-actions[bot]" && c.user?.type === "Bot" && c.body?.startsWith(recebimento))) {
    const r = validarAtendimento(await acolher({ issue, requestId }, env), requestId);
    if (!r || r.outcome !== "code" || !r.publicText) throw new Error("Acolhimento inválido; análise não iniciada.");
    const criado = await api(`/issues/${numero}/comments`, { method: "POST", body: { body:
      `${recebimento}\n${r.publicText}\n\n${blocoProgresso({ requestId, issueNumber: numero, updates: [{
        id: "recebimento", agent: "n1", internalText: "N1 confirmou recebimento; análise técnica ainda não iniciada.", publicText: r.publicText,
      }] })}` } });
    comentarios.push(criado);
  }
  // Bots e reações a comentários não reiniciam a triagem. Uma resposta humana
  // a clarification é analisada com todo o histórico, na mesma issue.
  const resultado = validarAtendimento(await analisar({ issue, comentarios, requestId }, env), requestId);
  if (!resultado) throw new Error("Triagem inválida; issue mantida aberta, sem atribuir ao agente de código.");
  if (resultado.outcome !== "code") {
    await publicarAtendimento(api, issue, resultado, comentarios);
    return;
  }
  const resultPath = `automacao/resultados/${requestId}.json`;
  const payload = montarAtribuicao({ repo, issue: numero, requestId, resultPath,
    pedido: `${issue.title}\n${issue.body ?? ""}\n\nComentários:\n${comentarios.map((c) => c.body).join("\n")}` });
  if (!issue.assignees?.some((a) => a.login === "copilot-swe-agent[bot]")) {
    await api(`/issues/${numero}/assignees`, { method: "POST", body: payload, atribuicao: true });
  }
  await api(`/issues/${numero}/comments`, { method: "POST", body: { body:
    `<!-- native-agents:assigned requestId=${requestId} -->\nResumo interno: issue #${numero} atribuída ao coordenador.\nrequestId: ${requestId}\nresultPath: ${resultPath}` } });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executar().catch((erro) => { console.error(erro.message); process.exitCode = 1; });
}

async function listarPaginado(api, path) {
  const lista = [];
  for (let page = 1; ; page++) {
    const lote = await api(`${path}&page=${page}`);
    lista.push(...lote);
    if (lote.length < 100) return lista;
  }
}

function prConfiavel(pr, repo) {
  return pr.user?.type === "Bot" && ["copilot", "copilot-swe-agent[bot]"].includes(pr.user?.login?.toLowerCase()) &&
    pr.head?.repo?.full_name === repo && pr.base?.repo?.full_name === repo && pr.base?.ref === "main";
}

export async function reconciliarProgresso(api, issue, pr, repo, comentarios) {
  const progresso = lerProgresso(pr.body);
  if (!progresso || !prConfiavel(pr, repo) || issue.pull_request ||
      !issue.labels?.some((l) => l.name === "origin:app") ||
      progresso.issueNumber !== issue.number ||
      issue.body?.match(/requestId:\s*([0-9a-f-]{36})/i)?.[1] !== progresso.requestId) return;
  comentarios ??= await listarPaginado(api, `/issues/${issue.number}/comments?per_page=100`);
  const atribuicao = `<!-- native-agents:assigned requestId=${progresso.requestId} -->`;
  if (!comentarios.some((c) => c.user?.login === "github-actions[bot]" && c.body?.includes(atribuicao))) return;
  for (const update of progresso.updates) {
    const marcador = marcadorUpdate(progresso.requestId, update.id);
    const existente = comentarios.find((c) => c.user?.login === "github-actions[bot]" && c.body?.startsWith(marcador));
    // Um marco publicado é imutável; correções e novos avisos recebem um novo ID.
    if (existente) continue;
    const body = `${marcador}\n**${update.agent}** — ${update.internalText}\n\n${blocoProgresso({ ...progresso, updates: [update] })}`;
    const criado = await api(`/issues/${issue.number}/comments`, { method: "POST", body: { body } });
    comentarios.push(criado);
  }
}
