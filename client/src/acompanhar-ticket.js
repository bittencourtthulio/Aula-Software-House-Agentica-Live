// Uma consulta por vez; respostas de uma conversa fechada nunca alteram a tela.
export function acompanharTicket({ ler, aoLer, aoErro, aoCarregar,
  documento = document, janela = window, intervalo = 5000 }) {
  let ativo = true;
  let pendente = null;
  const atualizar = (forcar = false) => {
    if (!ativo) return Promise.resolve();
    if (pendente) return pendente;
    aoCarregar(true);
    pendente = Promise.resolve().then(() => ler(forcar)).then(
      (ticket) => { if (ativo) aoLer(ticket); },
      (erro) => { if (ativo) aoErro(erro); },
    ).finally(() => {
      pendente = null;
      if (ativo) aoCarregar(false);
    });
    return pendente;
  };
  const retomar = () => { if (documento.visibilityState !== "hidden") atualizar(); };
  const timer = janela.setInterval(retomar, intervalo);
  documento.addEventListener("visibilitychange", retomar);
  janela.addEventListener("focus", retomar);
  atualizar();
  return {
    atualizar: () => atualizar(true),
    parar() {
      ativo = false;
      janela.clearInterval(timer);
      documento.removeEventListener("visibilitychange", retomar);
      janela.removeEventListener("focus", retomar);
    },
  };
}
