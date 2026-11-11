// Contrato de transporte: só o coordenador consolida; somente o N1 redige publicText.
export const AGENTES = new Set(["coordenador", "n1", "comercial", "po", "banco", "desenvolvedor", "revisor"]);
const idValido = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(v);
const textoValido = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

export function validarProgresso(valor) {
  if (!valor || !/^[0-9a-f-]{36}$/i.test(valor.requestId ?? "") ||
      !Number.isSafeInteger(valor.issueNumber) || valor.issueNumber < 1 ||
      !Array.isArray(valor.updates) || valor.updates.length > 100) return null;
  const ids = new Set();
  const updates = [];
  for (const u of valor.updates) {
    if (!u || !idValido(u.id) || ids.has(u.id) || !AGENTES.has(u.agent) ||
        !textoValido(u.internalText, 5000) ||
        !(u.publicText === "" || textoValido(u.publicText, 5000))) return null;
    ids.add(u.id);
    updates.push({ id: u.id, agent: u.agent, internalText: u.internalText.trim(), publicText: u.publicText.trim() });
  }
  return { requestId: valor.requestId, issueNumber: valor.issueNumber, updates };
}

export function lerProgresso(body = "") {
  if (typeof body !== "string") return null;
  const blocos = [...body.matchAll(/```native-agents-progress\s*\n([\s\S]*?)\n```/g)];
  if (blocos.length !== 1) return null;
  try { return validarProgresso(JSON.parse(blocos[0][1])); } catch { return null; }
}

export const blocoProgresso = (valor) => `\`\`\`native-agents-progress\n${JSON.stringify(valor)}\n\`\`\``;
export const marcadorUpdate = (requestId, id) => `<!-- native-agents:update requestId=${requestId} id=${id} -->`;
