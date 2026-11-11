import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const tela = readFileSync(new URL("../src/TelaAtendimento.jsx", import.meta.url), "utf8");
const estilos = readFileSync(new URL("../src/atendimento.css", import.meta.url), "utf8");

test("descrição do modal Novo ticket mantém contador dinâmico acessível de 0 a 5000", () => {
  assert.ok(tela.includes('const [descricaoNova, setDescricaoNova] = useState("");'));
  assert.ok(tela.includes('maxLength={5000} required erro={errosTicket.descricao}'));
  assert.ok(tela.includes("value={descricaoNova}"));
  assert.ok(tela.includes("setDescricaoNova(e.target.value)"));
  assert.ok(tela.includes("setDescricaoNova(\"\")"));
  assert.ok(tela.includes(
    '<p className="atendimento-contador" role="status" aria-label="Caracteres utilizados na descrição" aria-live="polite" aria-atomic="true">{descricaoNova.length}/5000</p>'
  ));

  const inicioModal = tela.indexOf("{novo && <Dialogo");
  const fimModal = tela.indexOf("</Dialogo>}", inicioModal);
  const inicioContador = tela.indexOf("atendimento-contador", inicioModal);
  assert.notEqual(inicioModal, -1, "modal Novo ticket deve existir");
  assert.ok(inicioContador > inicioModal && inicioContador < fimModal, "contador deve existir somente dentro do modal");
});

test("contador usa estilo de metadado legível e alinhado à direita", () => {
  assert.match(estilos, /\.atendimento-contador\s*\{[^}]*justify-self:\s*end;[^}]*color:\s*var\(--secundario\);[^}]*font-variant-numeric:\s*tabular-nums;/);
});
