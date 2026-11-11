import { useEffect, useRef, useState } from "react";
import { Botao } from "./componentes/Botao.jsx";
import { Campo } from "./componentes/Campo.jsx";
import { Dialogo } from "./componentes/Dialogo.jsx";
import { Icone } from "./componentes/Icone.jsx";
import "./atendimento.css";

const CHAVE = "fluxo.atendimento.v1";
const data = (valor) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));

function lerTickets() {
  try {
    const tickets = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    if (!Array.isArray(tickets) || !tickets.every((t) =>
      typeof t.id === "string" && (typeof t.titulo === "string" || typeof t.assunto === "string") &&
      Array.isArray(t.mensagens) && t.mensagens.every((m) => typeof m.id === "string" &&
        typeof m.texto === "string" && Number.isFinite(m.data)))) throw new Error();
    return { tickets: tickets.map((t) => ({
      ...t,
      titulo: t.titulo ?? t.assunto,
      descricao: typeof t.descricao === "string" ? t.descricao : (t.mensagens[0]?.texto ?? ""),
    })), erro: "" };
  } catch {
    return { tickets: [], erro: "Não foi possível ler os tickets deste navegador. Verifique o armazenamento do navegador e recarregue a página para tentar novamente." };
  }
}

export function TelaAtendimento() {
  const [inicial] = useState(lerTickets);
  const [tickets, setTickets] = useState(inicial.tickets);
  const [selecionado, setSelecionado] = useState(inicial.tickets[0]?.id ?? null);
  const [novo, setNovo] = useState(false);
  const [rascunhos, setRascunhos] = useState({});
  const [erro, setErro] = useState(inicial.erro);
  const [validacao, setValidacao] = useState("");
  const [errosTicket, setErrosTicket] = useState({});
  const [anuncio, setAnuncio] = useState("");
  const fim = useRef(null);
  const compositor = useRef(null);
  const ticket = tickets.find((t) => t.id === selecionado);
  const texto = rascunhos[selecionado] ?? "";

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [selecionado, ticket?.mensagens.length]);

  function salvar(proximos) {
    if (inicial.erro) return false;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximos));
      setTickets(proximos);
      setErro("");
      return true;
    } catch {
      setErro("Não foi possível salvar. Libere espaço ou permita o armazenamento neste navegador e tente novamente. Seu texto foi mantido.");
      return false;
    }
  }

  function abrirTicket(e) {
    e.preventDefault();
    const campos = new FormData(e.currentTarget);
    const titulo = String(campos.get("titulo") ?? "").trim();
    const descricao = String(campos.get("descricao") ?? "").trim();
    const erros = {
      titulo: titulo ? "" : "Escreva um título para identificar o ticket.",
      descricao: descricao ? "" : "Descreva sua solicitação para abrir o ticket.",
    };
    setErrosTicket(erros);
    if (erros.titulo || erros.descricao) {
      e.currentTarget.elements.namedItem(erros.titulo ? "titulo" : "descricao")?.focus();
      return;
    }
    const criado = {
      id: crypto.randomUUID(), titulo, assunto: titulo, descricao,
      mensagens: [{ id: crypto.randomUUID(), texto: descricao, data: Date.now() }],
    };
    if (!salvar([criado, ...tickets])) return;
    setSelecionado(criado.id);
    setNovo(false);
    setValidacao("");
    setAnuncio("Ticket aberto. Descrição salva como primeira mensagem.");
  }

  function enviar(e) {
    e.preventDefault();
    if (!ticket) return;
    if (!texto.trim()) { setValidacao("Escreva uma mensagem antes de enviar."); return; }
    const atualizado = { ...ticket, mensagens: [...ticket.mensagens, { id: crypto.randomUUID(), texto: texto.trim(), data: Date.now() }] };
    if (!salvar([atualizado, ...tickets.filter((t) => t.id !== ticket.id)])) return;
    setRascunhos((anteriores) => ({ ...anteriores, [selecionado]: "" }));
    setValidacao("");
    setAnuncio("Mensagem salva no ticket.");
    compositor.current?.focus();
  }

  return (
    <section className="atendimento" aria-label="Atendimento">
      <aside className="atendimento-tickets" aria-label="Tickets">
        <div className="atendimento-lista-topo">
          <h1>Atendimento</h1>
          <Botao variante="primario" icone="mais" disabled={Boolean(inicial.erro)} onClick={() => { setNovo(true); setValidacao(""); }}>Novo ticket</Botao>
        </div>
        <p className="atendimento-local">Tickets salvos apenas neste navegador.</p>
        {tickets.length ? <ul className="atendimento-lista">
          {tickets.map((t) => <li key={t.id}>
            <button type="button" className="atendimento-ticket" aria-current={selecionado === t.id ? "true" : undefined}
              onClick={() => { setSelecionado(t.id); setValidacao(""); }}>
              <Icone nome="conversa" />
              <span><strong>{t.titulo}</strong><small>{t.mensagens.at(-1)?.texto ?? "Sem mensagens"}</small></span>
            </button>
          </li>)}
        </ul> : <p className="atendimento-lista-vazia">Seus tickets aparecerão aqui. Abra um ticket para começar.</p>}
      </aside>
      <div className="atendimento-conversa">
        {erro && <p className="atendimento-erro" role="alert">{erro}</p>}
        {ticket ? <>
          <header className="atendimento-cabecalho"><h2>{ticket.titulo}</h2><span>{ticket.mensagens.length} {ticket.mensagens.length === 1 ? "mensagem" : "mensagens"}</span></header>
          <div className="atendimento-historico" role="region" aria-label={`Histórico: ${ticket.titulo}`} tabIndex={0}>
            {ticket.mensagens.length ? <ol className="atendimento-mensagens">
              {ticket.mensagens.map((m) => <li key={m.id} className="atendimento-mensagem">
                <div><strong>Você</strong><time dateTime={new Date(m.data).toISOString()}>{data(m.data)}</time></div>
                <p>{m.texto}</p>
              </li>)}
            </ol> : <div className="vazio-canvas"><Icone nome="conversa" tamanho={32} /><h2>Conte o que você precisa</h2><p>Descreva sua solicitação na primeira mensagem. O histórico fica reunido neste ticket.</p></div>}
            <div ref={fim} />
          </div>
          <form className="atendimento-compositor" onSubmit={enviar}>
            <label htmlFor="mensagem-ticket">Mensagem</label>
            <textarea id="mensagem-ticket" ref={compositor} className="campo-entrada" rows={3} maxLength={5000} value={texto}
              placeholder="Escreva sua mensagem…" aria-invalid={Boolean(validacao)} aria-describedby={validacao ? "atendimento-validacao" : "atendimento-ajuda"}
              onChange={(e) => { setRascunhos((anteriores) => ({ ...anteriores, [selecionado]: e.target.value })); setValidacao(""); }} />
            {validacao && <p className="campo-erro" id="atendimento-validacao" role="alert">{validacao}</p>}
            <div className="atendimento-envio"><small id="atendimento-ajuda">Até 5.000 caracteres. Sem respostas automáticas.</small><Botao type="submit" variante="primario" icone="mover" disabled={Boolean(inicial.erro)}>Enviar mensagem</Botao></div>
          </form>
        </> : <div className="vazio-canvas"><Icone nome="conversa" tamanho={40} /><h2>Como podemos ajudar?</h2><p>Abra um ticket para registrar sua solicitação e acompanhar as mensagens em uma conversa.</p><Botao variante="primario" icone="mais" disabled={Boolean(inicial.erro)} onClick={() => { setNovo(true); setValidacao(""); }}>Novo ticket</Botao></div>}
        <p className="atendimento-sr" role="status">{anuncio}</p>
      </div>
      {novo && <Dialogo aberto titulo="Novo ticket" descricao="Dê um título à solicitação e descreva o que você precisa. A descrição inicia a conversa." aoFechar={() => { setNovo(false); setValidacao(""); setErrosTicket({}); }}>
        <form className="formulario" onSubmit={abrirTicket}>
          <Campo rotulo="Título" name="titulo" placeholder="Ex.: Não consigo acessar o quadro" maxLength={120} required autoFocus erro={errosTicket.titulo}
            onChange={() => setErrosTicket((anteriores) => ({ ...anteriores, titulo: "" }))} />
          <Campo rotulo="Descrição" name="descricao" multilinha rows={5} placeholder="Conte o que aconteceu, o que você esperava e como reproduzir o problema." maxLength={5000} required erro={errosTicket.descricao}
            onChange={() => setErrosTicket((anteriores) => ({ ...anteriores, descricao: "" }))} />
          {erro && <p className="campo-erro" role="alert">{erro}</p>}
          <div className="acoes"><Botao onClick={() => { setNovo(false); setValidacao(""); }}>Cancelar</Botao><Botao variante="primario" type="submit">Abrir ticket</Botao></div>
        </form>
      </Dialogo>}
    </section>
  );
}
