import assert from "node:assert/strict";
import { test } from "node:test";
import { contarCartoes, formatarContagemCartoes } from "../src/contagem-cartoes.js";

test("conta zero quando não há listas ou elas não têm cartões", () => {
  assert.equal(contarCartoes([]), 0);
  assert.equal(contarCartoes(undefined), 0);
  assert.equal(contarCartoes([{ cards: [] }, {}, null]), 0);
});

test("soma cartões de todas as listas", () => {
  const listas = [
    { cards: [{ id: "c1" }, { id: "c2" }] },
    { cards: [{ id: "c3" }] },
    { cards: [] },
    { cards: null },
  ];

  assert.equal(contarCartoes(listas), 3);
});

test("a contagem usa os dados atuais depois de criar, excluir ou mover cartões", () => {
  const antes = [{ cards: [{ id: "c1" }] }, { cards: [] }];
  const depois = [{ cards: [] }, { cards: [{ id: "c1" }, { id: "c2" }] }];

  assert.equal(contarCartoes(antes), 1);
  assert.equal(contarCartoes(depois), 2);
  assert.equal(contarCartoes([{ cards: [] }, { cards: [] }]), 0);
});

test("formata zero, singular e plural", () => {
  assert.equal(formatarContagemCartoes(0), "0 cartões");
  assert.equal(formatarContagemCartoes(1), "1 cartão");
  assert.equal(formatarContagemCartoes(4), "4 cartões");
});
