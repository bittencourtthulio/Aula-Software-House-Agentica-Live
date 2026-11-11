// `npm run dev`: sobe a API e a interface JUNTAS, em primeiro plano, em portas livres.
// Ctrl+C encerra as duas. Nada fica em segundo plano.
import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { acharPorta } from "./portas.mjs";
import { exigirAmbiente } from "./preflight.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const ambiente = await exigirAmbiente();
if (ambiente !== 0) process.exit(ambiente);

const apiPorta = await acharPorta(Number(process.env.API_PORT ?? 3001));
const webPorta = await acharPorta(Number(process.env.WEB_PORT ?? 5173), [apiPorta]);
const env = { ...process.env, API_PORT: String(apiPorta), WEB_PORT: String(webPorta), CHOKIDAR_USEPOLLING: "true" };

const filhos = [
  { nome: "API", processo: spawn(process.execPath, ["server/src/index.js"], { cwd: raiz, env, stdio: "inherit" }) },
  { nome: "Interface", processo: spawn(process.execPath, [join(raiz, "node_modules", "vite", "bin", "vite.js")], { cwd: raiz, env, stdio: "inherit" }) },
];

let saindo = false;
// Polling apenas do código da API: não observa banco, dependências ou artefatos.
function assinaturaApi(pasta = join(raiz, "server/src")) {
  return readdirSync(pasta, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).map((entrada) => {
    const arquivo = join(pasta, entrada.name);
    if (entrada.isDirectory()) return assinaturaApi(arquivo);
    const estado = statSync(arquivo);
    return `${arquivo}:${estado.mtimeMs}:${estado.size}`;
  }).join("\n");
}
let assinatura = assinaturaApi();
const polling = setInterval(() => {
  if (saindo || filhos[0].reiniciar) return;
  let proxima;
  try { proxima = assinaturaApi(); } catch { return; }
  if (proxima === assinatura) return;
  assinatura = proxima;
  filhos[0].reiniciar = true;
  filhos[0].processo.kill("SIGTERM");
}, 1000);
function encerrar(codigo = 0) {
  if (saindo) return;
  saindo = true;
  clearInterval(polling);
  for (const f of filhos) f.processo.kill("SIGTERM");
  setTimeout(() => process.exit(codigo), 300).unref();
}
function acompanhar(f) {
  f.processo.on("exit", (codigo) => {
    if (!saindo && f.reiniciar) {
      f.reiniciar = false;
      f.processo = spawn(process.execPath, ["server/src/index.js"], { cwd: raiz, env, stdio: "inherit" });
      acompanhar(f);
      return;
    }
    if (!saindo) console.error(`\n  ${f.nome} parou (código ${codigo ?? 0}). Encerrando o restante.\n`);
    encerrar(codigo ?? 0);
  });
}
for (const f of filhos) acompanhar(f);
process.on("SIGINT", () => encerrar(0));
process.on("SIGTERM", () => encerrar(0));

console.log(`\n  Interface: http://127.0.0.1:${webPorta}\n  API:       http://127.0.0.1:${apiPorta}/api\n`);
