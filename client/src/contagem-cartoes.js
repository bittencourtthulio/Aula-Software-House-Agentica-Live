/** Soma os cartões de todas as listas, tratando listas sem cards como vazias. */
export function contarCartoes(listas) {
  if (!Array.isArray(listas)) return 0;

  return listas.reduce(
    (total, lista) => total + (Array.isArray(lista?.cards) ? lista.cards.length : 0),
    0,
  );
}

/** Formata uma quantidade de cartões no singular ou plural, inclusive zero. */
export function formatarContagemCartoes(total) {
  return `${total} ${total === 1 ? "cartão" : "cartões"}`;
}
