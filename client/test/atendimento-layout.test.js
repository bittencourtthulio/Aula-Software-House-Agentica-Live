import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const css = await readFile(new URL("../src/atendimento.css", import.meta.url), "utf8");
const tela = await readFile(new URL("../src/TelaAtendimento.jsx", import.meta.url), "utf8");

test("itens da lista de tickets podem encolher dentro do sidebar", () => {
  assert.match(css, /\.atendimento-lista\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/);
  assert.match(css, /\.atendimento-lista li\s*\{\s*min-width:\s*0\s*;\s*\}/);
  assert.match(css, /\.atendimento-tickets\s*\{[^}]*min-width:\s*0\s*;/);
});

test("tickets continuam em faixa rolável no mobile sem ampliar o sidebar", () => {
  const mobile = css.match(/@media \(max-width: 900px\)\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(mobile, "breakpoint mobile encontrado");
  assert.match(mobile, /\.atendimento-lista\s*\{[^}]*overflow-x:\s*auto\s*;/);
  assert.match(mobile, /\.atendimento-lista li\s*\{[^}]*flex:\s*0 0 200px\s*;/);
  assert.match(mobile, /\.atendimento\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/);
});

test("a seleção do ticket permanece indicada por aria-current", () => {
  assert.match(tela, /className="atendimento-ticket"\s+aria-current=\{selecionado === t\.id \? "true" : undefined\}/);
  assert.match(css, /\.atendimento-ticket\[aria-current\]\s*\{/);
});
