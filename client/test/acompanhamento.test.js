import assert from "node:assert/strict";
import { test } from "node:test";
import { acompanharTicket } from "../src/acompanhar-ticket.js";

function ambiente(opcoes = {}) {
  const documento = new EventTarget();
  documento.visibilityState = "visible";
  const janela = new EventTarget();
  let tick, removido = false;
  janela.setInterval = (fn, ms) => { tick = fn; assert.equal(ms, 5000); return 1; };
  janela.clearInterval = () => { removido = true; };
  const lidos = [], erros = [], carregando = [], chamadas = [];
  const controle = acompanharTicket({ documento, janela,
    ler: async (forcar) => { chamadas.push(forcar); return { mensagens: [chamadas.length] }; },
    aoLer: (t) => lidos.push(t), aoErro: (e) => erros.push(e), aoCarregar: (v) => carregando.push(v), ...opcoes });
  return { documento, janela, controle, lidos, erros, carregando, chamadas,
    tick: () => tick(), removido: () => removido };
}
const concluir = () => new Promise((resolve) => setImmediate(resolve));

test("busca ao abrir, a cada ciclo visível, ao voltar à aba e manualmente", async () => {
  const a = ambiente();
  await concluir();
  a.tick(); await concluir();
  assert.equal(a.lidos.length, 2);
  a.documento.visibilityState = "hidden";
  a.tick(); await concluir();
  assert.equal(a.lidos.length, 2);
  a.documento.visibilityState = "visible";
  a.documento.dispatchEvent(new Event("visibilitychange")); await concluir();
  a.janela.dispatchEvent(new Event("focus")); await concluir();
  await a.controle.atualizar();
  assert.deepEqual(a.chamadas, [false, false, false, false, true]);
  a.controle.parar();
  a.tick(); a.janela.dispatchEvent(new Event("focus"));
  await a.controle.atualizar();
  assert.equal(a.chamadas.length, 5);
  assert.equal(a.removido(), true);
});

test("consulta lenta não se sobrepõe e resposta após fechar não altera a conversa", async () => {
  let resolver, chamadas = 0;
  const a = ambiente({ ler: () => { chamadas++; return new Promise((r) => { resolver = r; }); } });
  await concluir();
  a.tick(); const pendente = a.controle.atualizar();
  assert.equal(chamadas, 1);
  a.controle.parar(); resolver({ mensagens: ["tardio"] }); await pendente;
  assert.deepEqual(a.lidos, []);
});

test("falha libera próxima tentativa automática sem encerrar acompanhamento", async () => {
  let falhar = true;
  const a = ambiente({ ler: async () => { if (falhar) throw new Error("offline"); return { mensagens: [1] }; } });
  await concluir();
  assert.equal(a.erros.length, 1);
  falhar = false; a.tick(); await concluir();
  assert.equal(a.lidos.length, 1);
  assert.deepEqual(a.carregando, [true, false, true, false]);
  a.controle.parar();
});
