import { useCallback, useEffect, useRef, useState } from "react";
import { Botao } from "./componentes/Botao.jsx";
import { Campo } from "./componentes/Campo.jsx";
import { Dialogo } from "./componentes/Dialogo.jsx";
import { Icone } from "./componentes/Icone.jsx";
import { abrirTicket as apiAbrirTicket, enviarMensagem, lerTicket, listarTickets } from "./api.js";
import "./atendimento.css";
import { acompanharTicket } from "./acompanhar-ticket.js";

const data = (valor) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
const rotuloAutor = (autor) => (autor === "n1" ? "N1" : "Você");

export function TelaAtendimento() {
  const [tickets, setTickets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [novo, setNovo] = useState(false);
  const [descricaoNova, setDescricaoNova] = useState("");
  const [rascunhos, setRascunhos] = useState({});
  const [erro, setErro] = useState("");
  const [validacao, setValidacao] = useState("");
  const [errosTicket, setErrosTicket] = useState({});
  const [anuncio, setAnuncio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [avisoSincronizacao, setAvisoSincronizacao] = useState("");
  const acompanhamento = useRef(null);
  const fim = useRef(null);
  const compositor = useRef(null);
  const ticket = detalhe && detalhe.id === selecionado ? detalhe : null;
  const mensagens = ticket?.mensagens ?? [];
  const texto = rascunhos[selecionado] ?? "";

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    setErroLista("");
    try {
      const lista = await listarTickets();
      setTickets(lista);
      setSelecionado((atual) => atual ?? lista[0]?.id ?? null);
    } catch (e) {
      setErroLista(e.message || "Não foi possível carregar seus tickets.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarLista(); }, [carregarLista]);

  useEffect(() => {
    if (!selecionado) { setDetalhe(null); return undefined; }
    setAvisoSincronizacao("");
    const controle = acompanharTicket({
      ler: (forcar) => lerTicket(selecionado, forcar),
      aoCarregar: setAtualizando,
      aoLer: (lido) => {
        // Um envio local pode terminar enquanto a leitura ainda está em trânsito.
        setDetalhe((atual) => {
          const ids = new Set(lido.mensagens.map((m) => m.id));
          const locais = atual?.id === lido.id ? atual.mensagens.filter((m) => !ids.has(m.id)) : [];
          return { ...lido, mensagens: [...lido.mensagens, ...locais]
            .sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm)) };
        });
        setErro("");
        setAvisoSincronizacao(lido.erroSincronizacao || "");
      },
      aoErro: (e) => setAvisoSincronizacao(e.message || "Não foi possível atualizar as mensagens. Tentaremos novamente automaticamente."),
    });
    acompanhamento.current = controle;
    return () => { controle.parar(); acompanhamento.current = null; };
  }, [selecionado]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [selecionado, mensagens.length]);

  useEffect(() => {
    const campo = compositor.current;
    if (!campo) return;
    campo.style.height = "auto";
    campo.style.height = `${Math.min(campo.scrollHeight, 220)}px`;
  }, [texto, ticket?.id]);

  async function abrirTicket(e) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const campos = new FormData(formulario);
    const titulo = String(campos.get("titulo") ?? "").trim();
    const descricao = String(campos.get("descricao") ?? "").trim();
    const erros = {
      titulo: titulo ? "" : "Escreva um título para identificar o ticket.",
      descricao: descricao ? "" : "Descreva sua solicitação para abrir o ticket.",
    };
    setErrosTicket(erros);
    if (erros.titulo || erros.descricao) {
      formulario.elements.namedItem(erros.titulo ? "titulo" : "descricao")?.focus();
      return;
    }
    setEnviando(true);
    try {
      const criado = await apiAbrirTicket(titulo, descricao);
      setTickets((anteriores) => [criado, ...anteriores]);
      setDetalhe(criado);
      setSelecionado(criado.id);
      setNovo(false);
      setDescricaoNova("");
      setValidacao("");
      setErro("");
      setAnuncio("Ticket aberto. Descrição registrada como primeira mensagem.");
    } catch (err) {
      setErro(err.message || "Não foi possível abrir o ticket. Seu texto foi mantido, tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    if (!ticket || enviando) return;
    if (!texto.trim()) { setValidacao("Escreva uma mensagem antes de enviar."); return; }
    setEnviando(true);
    try {
      const mensagem = await enviarMensagem(ticket.id, texto.trim());
      setDetalhe((atual) => (atual && atual.id === ticket.id && !atual.mensagens.some((m) => m.id === mensagem.id)
        ? { ...atual, mensagens: [...atual.mensagens, mensagem] } : atual));
      setRascunhos((anteriores) => ({ ...anteriores, [ticket.id]: "" }));
      setValidacao("");
      setErro("");
      setAnuncio("Mensagem enviada no ticket.");
      compositor.current?.focus();
    } catch (err) {
      setErro(err.message || "Não foi possível enviar a mensagem. Seu texto foi mantido, tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const abrirNovo = () => { setNovo(true); setDescricaoNova(""); setValidacao(""); setErro(""); };
  const fecharNovo = () => { setNovo(false); setDescricaoNova(""); setValidacao(""); setErrosTicket({}); setErro(""); };
  const bloqueado = Boolean(erroLista);

  if (carregando) {
    return <section className="atendimento" aria-label="Atendimento"><p className="atendimento-lista-vazia" role="status">Carregando tickets…</p></section>;
  }
  if (erroLista) {
    return <section className="atendimento" aria-label="Atendimento">
      <div className="atendimento-conversa">
        <p className="atendimento-erro" role="alert">{erroLista}</p>
        <Botao variante="primario" onClick={carregarLista}>Tentar de novo</Botao>
      </div>
    </section>;
  }

  return (
    <section className="atendimento" aria-label="Atendimento">
      <aside className="atendimento-tickets" aria-label="Tickets">
        <div className="atendimento-lista-topo">
          <h1>Atendimento</h1>
          <Botao variante="primario" icone="mais" disabled={bloqueado} onClick={abrirNovo}>Novo ticket</Botao>
        </div>
        <p className="atendimento-local">Tickets salvos no servidor.</p>
        {tickets.length ? <ul className="atendimento-lista">
          {tickets.map((t) => <li key={t.id}>
            <button type="button" className="atendimento-ticket" aria-current={selecionado === t.id ? "true" : undefined}
              onClick={() => { setSelecionado(t.id); setValidacao(""); setErro(""); }}>
              <Icone nome="conversa" />
              <span><strong>{t.titulo}</strong><small>{t.descricao || "Sem mensagens"}</small></span>
            </button>
          </li>)}
        </ul> : <p className="atendimento-lista-vazia">Abra seu primeiro ticket</p>}
      </aside>
      <div className="atendimento-conversa">
        {erro && !novo && <p className="atendimento-erro" role="alert">{erro}</p>}
        {avisoSincronizacao && <p className="atendimento-erro" role="status">{avisoSincronizacao} <Botao disabled={atualizando} onClick={() => acompanhamento.current?.atualizar()}>Tentar de novo</Botao></p>}
        {ticket ? <>
          <header className="atendimento-cabecalho">
            <div><span className="atendimento-sobrancelha">Conversa com o N1</span><h2>{ticket.titulo}</h2></div>
            <div className="atendimento-atualizacao">
              <span className="atendimento-total">{mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}</span>
              <Botao icone="atualizar" disabled={atualizando} onClick={() => acompanhamento.current?.atualizar()}>
                {atualizando ? "Atualizando…" : "Atualizar"}
              </Botao>
              <span>Atualização automática a cada 5 s</span>
            </div>
          </header>
          <div className="atendimento-historico" role="region" aria-label={`Histórico: ${ticket.titulo}`} tabIndex={0}>
            {mensagens.length ? <ol className="atendimento-mensagens">
              {mensagens.map((m) => <li key={m.id} className={`atendimento-mensagem atendimento-mensagem--${m.autor === "n1" ? "n1" : "cliente"}`}>
                <div className="atendimento-mensagem-meta">
                  <strong className="atendimento-autor"><Icone nome={m.autor === "n1" ? "assistente" : "usuario"} tamanho={14} />{rotuloAutor(m.autor)}</strong>
                  {m.autor === "n1" && <span className="atendimento-papel">Assistente</span>}
                  <time dateTime={new Date(m.criadoEm).toISOString()}>{data(m.criadoEm)}</time>
                </div>
                <p>{m.texto}</p>
              </li>)}
            </ol> : <div className="vazio-canvas"><Icone nome="conversa" tamanho={32} /><h2>Conte o que você precisa</h2><p>Descreva sua solicitação na primeira mensagem. O histórico fica reunido neste ticket.</p></div>}
            <div ref={fim} />
          </div>
          <form className="atendimento-compositor" onSubmit={enviar}>
            <label className="atendimento-sr" htmlFor="mensagem-ticket">Mensagem</label>
            <div className="atendimento-caixa" data-invalido={validacao ? "true" : undefined}>
              <textarea id="mensagem-ticket" ref={compositor} rows={1} maxLength={5000} value={texto}
                placeholder="Mensagem para o N1…" aria-invalid={Boolean(validacao)} aria-describedby={validacao ? "atendimento-validacao atendimento-ajuda" : "atendimento-ajuda"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
                    e.preventDefault();
                    e.currentTarget.form.requestSubmit();
                  }
                }}
                onChange={(e) => { setRascunhos((anteriores) => ({ ...anteriores, [selecionado]: e.target.value })); setValidacao(""); }} />
              <div className="atendimento-envio">
                <span className="atendimento-destino"><Icone nome="assistente" tamanho={16} />N1 <span>· Assistente</span></span>
                <Botao type="submit" variante="primario" className="atendimento-enviar" icone={enviando ? "atualizar" : "seta-cima"}
                  aria-label={enviando ? "Enviando mensagem" : "Enviar mensagem"} title="Enviar mensagem" disabled={enviando || !texto.trim()} />
              </div>
            </div>
            {validacao && <p className="campo-erro" id="atendimento-validacao" role="alert">{validacao}</p>}
            <p className="atendimento-ajuda" id="atendimento-ajuda">Enter para enviar · Shift+Enter para nova linha · Até 5.000 caracteres.</p>
          </form>
        </> : selecionado ? <p className="atendimento-lista-vazia" role="status">Carregando mensagens…</p>
          : <div className="vazio-canvas"><Icone nome="conversa" tamanho={40} /><h2>Como podemos ajudar?</h2><p>Abra um ticket para registrar sua solicitação e acompanhar as mensagens em uma conversa.</p><Botao variante="primario" icone="mais" onClick={abrirNovo}>Novo ticket</Botao></div>}
        <p className="atendimento-sr" role="status">{anuncio}</p>
      </div>
      {novo && <Dialogo aberto titulo="Novo ticket" descricao="Dê um título à solicitação e descreva o que você precisa. A descrição inicia a conversa." aoFechar={fecharNovo}>
        <form className="formulario" onSubmit={abrirTicket}>
          <Campo rotulo="Título" name="titulo" placeholder="Ex.: Não consigo acessar o quadro" maxLength={120} required autoFocus erro={errosTicket.titulo}
            onChange={() => setErrosTicket((anteriores) => ({ ...anteriores, titulo: "" }))} />
          <Campo rotulo="Descrição" name="descricao" multilinha rows={5} placeholder="Conte o que aconteceu, o que você esperava e como reproduzir o problema." maxLength={5000} required erro={errosTicket.descricao}
            value={descricaoNova}
            onChange={(e) => { setDescricaoNova(e.target.value); setErrosTicket((anteriores) => ({ ...anteriores, descricao: "" })); }} />
          <p className="atendimento-contador" role="status" aria-label="Caracteres utilizados na descrição" aria-live="polite" aria-atomic="true">{descricaoNova.length}/5000</p>
          {erro && <p className="campo-erro" role="alert">{erro}</p>}
          <div className="acoes"><Botao onClick={fecharNovo}>Cancelar</Botao><Botao variante="primario" type="submit" disabled={enviando}>Abrir ticket</Botao></div>
        </form>
      </Dialogo>}
    </section>
  );
}
