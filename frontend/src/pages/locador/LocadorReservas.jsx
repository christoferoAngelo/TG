import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CalendarioSolicitacoes from "../../components/locador/CalendarioSolicitacoes";
import Modal from "../../components/locador/Modal";
import PedidoLocacaoModal from "../../components/locador/PedidoLocacaoModal";
import { pedirRecargaAvisos } from "../../components/notificacao/CaixaAvisos";
import { avisoPrazoLocador, podeCancelarLocador, prazoLocador, textoCancelamento } from "../reserva/cancelamento";
import JellyRadio, { jellyTema } from "../../components/ui/JellyRadio";
import { formatarData, formatarHora, formatarMoeda, statusDe } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorLayout.css";
import "./LocadorReservas.css";

const TEXTOS_CONFIRMACAO = {
    aprovar: {
        titulo: "Confirmar este pedido?",
        descricao: (p) =>
            `Aprovar a reserva de ${p.espaco?.titulo || "este espaço"} em ${formatarData(p.dataEvento)}? O locatário poderá seguir com o pagamento.`,
        confirmar: "Confirmar aprovação",
        classe: "lc-btn lc-btn--success",
    },
    rejeitar: {
        titulo: "Recusar este pedido?",
        descricao: (p) =>
            `Recusar a reserva de ${p.espaco?.titulo || "este espaço"} em ${formatarData(p.dataEvento)}? A data será liberada e não haverá cobrança.`,
        confirmar: "Recusar pedido",
        classe: "lc-btn lc-btn--danger",
    },
    cancelar: {
        titulo: "Cancelar esta reserva?",
        descricao: (p) =>
            `Cancelar a reserva de ${p.espaco?.titulo || "este espaço"} em ${formatarData(p.dataEvento)}? O locatário receberá reembolso total e a data volta a ficar disponível.`,
        confirmar: "Confirmar cancelamento",
        classe: "lc-btn lc-btn--danger",
    },
};

const API = "http://localhost:8080/api";

const STATUS_RESERVA = {
    PENDENTE: { texto: "Pendente", tom: "warn" },
    APROVADA: { texto: "Aprovada", tom: "ok" },
    REJEITADA: { texto: "Rejeitada", tom: "danger" },
    CANCELADA: { texto: "Cancelada", tom: "muted" },
};

const FILTROS = [
    { valor: "", rotulo: "Todas" },
    { valor: "PENDENTE", rotulo: "Pendentes" },
    { valor: "APROVADA", rotulo: "Aprovadas" },
    { valor: "REJEITADA", rotulo: "Rejeitadas" },
    { valor: "CANCELADA", rotulo: "Canceladas" },
];

function dataIso(valor) {
    if (!valor) return "";
    if (Array.isArray(valor)) {
        const [a, m, d] = valor;
        return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 10);
}

function horaIso(valor) {
    if (!valor) return "00:00";
    if (Array.isArray(valor)) {
        return `${String(valor[0]).padStart(2, "0")}:${String(valor[1] ?? 0).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 5);
}

function hojeIsoLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pendentes → futuros (próximo primeiro) → passados (mais recente primeiro). */
function compararReservas(a, b) {
    const pa = statusDe(a.status) === "PENDENTE" ? 0 : 1;
    const pb = statusDe(b.status) === "PENDENTE" ? 0 : 1;
    if (pa !== pb) return pa - pb;

    const da = `${dataIso(a.dataEvento)}T${horaIso(a.horaInicio)}`;
    const db = `${dataIso(b.dataEvento)}T${horaIso(b.horaInicio)}`;
    const hoje = `${hojeIsoLocal()}T00:00`;
    const aPassado = da < hoje;
    const bPassado = db < hoje;
    if (aPassado !== bPassado) return aPassado ? 1 : -1;
    if (!aPassado) return da.localeCompare(db);
    return db.localeCompare(da);
}

function faixaHorario(req) {
    const ini = formatarHora(req.horaInicio);
    const fim = formatarHora(req.horaFim);
    if (ini && fim) return `${ini}–${fim}`;
    return ini || fim || "—";
}

export default function LocadorReservas() {
    const { usuarioLogado } = useAuth();
    const outlet = useOutletContext() || {};
    const setPendentesNav = outlet.setPendentes;
    const [searchParams, setSearchParams] = useSearchParams();
    const filtroStatus = (searchParams.get("status") || "").toUpperCase();

    const [solicitacoes, setSolicitacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [visualizacao, setVisualizacao] = useState("lista");
    const [confirmacao, setConfirmacao] = useState(null);
    const [pedidoAberto, setPedidoAberto] = useState(null);
    const [processando, setProcessando] = useState(false);
    const [erroConfirmacao, setErroConfirmacao] = useState("");

    const carregar = () => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);
        setErro("");
        fetch(`${API}/reservas/minhas-solicitacoes`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error((await res.text()) || "Não foi possível carregar as reservas.");
                }
                return res.json();
            })
            .then((data) => {
                const lista = Array.isArray(data) ? data : [];
                lista.sort(compararReservas);
                setSolicitacoes(lista);
                if (typeof setPendentesNav === "function") {
                    setPendentesNav(lista.filter((r) => statusDe(r.status) === "PENDENTE").length);
                }
            })
            .catch((e) => {
                setSolicitacoes([]);
                setErro(e.message || "Não foi possível carregar as reservas.");
            })
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        carregar();
    }, [usuarioLogado?.id]);

    const contagens = useMemo(() => {
        const base = { "": solicitacoes.length, PENDENTE: 0, APROVADA: 0, REJEITADA: 0, CANCELADA: 0 };
        for (const r of solicitacoes) {
            const s = statusDe(r.status);
            if (s in base) base[s] += 1;
        }
        return base;
    }, [solicitacoes]);

    const filtradas = useMemo(() => {
        const lista = !filtroStatus
            ? solicitacoes
            : solicitacoes.filter((r) => statusDe(r.status) === filtroStatus);
        return [...lista].sort(compararReservas);
    }, [solicitacoes, filtroStatus]);

    const setFiltro = (valor) => {
        if (!valor) setSearchParams({});
        else setSearchParams({ status: valor });
    };

    const atualizarLocal = (reservaId, patch) => {
        setSolicitacoes((prev) =>
            [...prev.map((req) => (req.id === reservaId ? { ...req, ...patch } : req))].sort(compararReservas)
        );
    };

    const pedirConfirmacao = (acao, pedidoOuId) => {
        const pedido =
            pedidoOuId && typeof pedidoOuId === "object"
                ? pedidoOuId
                : solicitacoes.find((req) => req.id === pedidoOuId);
        if (!pedido || !TEXTOS_CONFIRMACAO[acao]) return;
        setErroConfirmacao("");
        setConfirmacao({ acao, pedido });
    };

    const fecharConfirmacao = () => {
        if (processando) return;
        setConfirmacao(null);
        setErroConfirmacao("");
    };

    const executarConfirmacao = async () => {
        if (!confirmacao || !usuarioLogado?.id) return;
        const { acao, pedido } = confirmacao;
        const reservaId = pedido.id;
        setProcessando(true);
        setErroConfirmacao("");
        try {
            if (acao === "aprovar") {
                const response = await fetch(`${API}/reservas/${reservaId}/aprovar`, {
                    method: "PATCH",
                    headers: { "Usuario-Id": usuarioLogado.id },
                });
                if (!response.ok) throw new Error((await response.text()) || "Falha ao aprovar reserva.");
                atualizarLocal(reservaId, { status: "APROVADA" });
                if (typeof setPendentesNav === "function") {
                    setPendentesNav((n) => Math.max(0, (Number(n) || 0) - 1));
                }
            } else if (acao === "rejeitar") {
                const response = await fetch(`${API}/reservas/${reservaId}/rejeitar`, {
                    method: "PATCH",
                    headers: { "Usuario-Id": usuarioLogado.id },
                });
                if (!response.ok) throw new Error((await response.text()) || "Falha ao rejeitar reserva.");
                atualizarLocal(reservaId, { status: "REJEITADA" });
                if (typeof setPendentesNav === "function") {
                    setPendentesNav((n) => Math.max(0, (Number(n) || 0) - 1));
                }
            } else if (acao === "cancelar") {
                const response = await fetch(`${API}/reservas/${reservaId}/cancelar-locador`, {
                    method: "PATCH",
                    headers: { "Usuario-Id": usuarioLogado.id },
                });
                if (!response.ok) {
                    throw new Error((await response.text()) || "Não foi possível cancelar esta reserva.");
                }
                const atualizada = await response.json();
                atualizarLocal(reservaId, atualizada);
                pedirRecargaAvisos();
            }
            setConfirmacao(null);
        } catch (err) {
            setErroConfirmacao(err.message || "Não foi possível concluir a ação.");
        } finally {
            setProcessando(false);
        }
    };

    return (
        <div className="lc-secao">
            <header className="lc-topo">
                <div>
                    <h1 className="lc-titulo">Reservas</h1>
                    <p className="lc-subtitulo">Pedidos recebidos nos seus espaços.</p>
                </div>
                <JellyRadio
                    ariaLabel="Visualização dos pedidos"
                    size="sm"
                    items={[
                        { value: "lista", label: "Lista" },
                        { value: "calendario", label: "Calendário" },
                    ]}
                    value={visualizacao}
                    onChange={setVisualizacao}
                    {...jellyTema}
                />
            </header>

            <div className="lc-filtros" role="tablist" aria-label="Filtrar por status">
                {FILTROS.map((f) => (
                    <button
                        key={f.valor || "todas"}
                        type="button"
                        role="tab"
                        aria-selected={filtroStatus === f.valor}
                        className={`lc-filtro${filtroStatus === f.valor ? " is-ativo" : ""}`}
                        onClick={() => setFiltro(f.valor)}
                    >
                        {f.rotulo}
                        <span className="lc-filtro-count">{contagens[f.valor] ?? 0}</span>
                    </button>
                ))}
            </div>

            <section className="lc-card lc-reservas-card">
                {carregando ? (
                    <p className="lc-vazio" aria-busy="true">
                        Carregando pedidos…
                    </p>
                ) : erro ? (
                    <div className="lc-estado-erro" role="alert">
                        <p>{erro}</p>
                        <button type="button" className="lc-btn lc-btn--primary" onClick={carregar}>
                            Tentar novamente
                        </button>
                    </div>
                ) : filtradas.length === 0 ? (
                    <div className="lc-vazio-ilustrado" aria-label="Sem reservas">
                        <h2>
                            {filtroStatus
                                ? "Nenhuma reserva com este status"
                                : "Nenhum pedido de locação ainda"}
                        </h2>
                        <p>
                            {filtroStatus
                                ? "Tente outro filtro ou limpe a seleção para ver todas."
                                : "Quando alguém solicitar um dos seus espaços, o pedido aparece aqui."}
                        </p>
                    </div>
                ) : visualizacao === "calendario" ? (
                    <div className="lc-calendario">
                        <CalendarioSolicitacoes
                            solicitacoes={filtradas}
                            onAprovar={(id) => pedirConfirmacao("aprovar", id)}
                            onRejeitar={(id) => pedirConfirmacao("rejeitar", id)}
                            onCancelar={(id) => {
                                pedirConfirmacao("cancelar", id);
                            }}
                            onVer={(pedido) => setPedidoAberto(pedido)}
                        />
                    </div>
                ) : (
                    <>
                        <div className="lc-reservas-table-wrap">
                            <table className="lc-reservas-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Espaço</th>
                                        <th scope="col">Data e horário</th>
                                        <th scope="col">Locatário</th>
                                        <th scope="col">Valor</th>
                                        <th scope="col">Situação</th>
                                        <th scope="col">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtradas.map((req) => {
                                        const st = STATUS_RESERVA[statusDe(req.status)] || {
                                            texto: req.status || "—",
                                            tom: "muted",
                                        };
                                        return (
                                            <tr key={req.id} className={statusDe(req.status) === "PENDENTE" ? "is-pendente" : undefined}>
                                                <td data-label="Espaço">
                                                    <strong className="lc-reservas-espaco">{req.espaco?.titulo || "Espaço"}</strong>
                                                    <button type="button" className="lc-pedido-ver" onClick={() => setPedidoAberto(req)}>
                                                        Ver detalhes
                                                    </button>
                                                </td>
                                                <td data-label="Data e horário">
                                                    <span className="lc-reservas-data">{formatarData(req.dataEvento)}</span>
                                                    <span className="lc-reservas-hora">{faixaHorario(req)}</span>
                                                </td>
                                                <td data-label="Locatário">{req.locatarioNome || "—"}</td>
                                                <td data-label="Valor">{formatarMoeda(req.valorTotal)}</td>
                                                <td data-label="Situação">
                                                    <span className={`lc-badge lc-badge--${st.tom}`}>{st.texto}</span>
                                                </td>
                                                <td data-label="Ações">
                                                    <div className="lc-reservas-acoes">
                                                        {statusDe(req.status) === "PENDENTE" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--success"
                                                                    onClick={() => pedirConfirmacao("aprovar", req)}
                                                                >
                                                                    Aprovar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--danger-ghost"
                                                                    onClick={() => pedirConfirmacao("rejeitar", req)}
                                                                >
                                                                    Recusar
                                                                </button>
                                                            </>
                                                        )}
                                                        {podeCancelarLocador(req) && (
                                                            <button
                                                                type="button"
                                                                className="lc-btn lc-btn--danger-ghost"
                                                                onClick={() => pedirConfirmacao("cancelar", req)}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                        {statusDe(req.status) !== "PENDENTE" && !podeCancelarLocador(req) && (
                                                            <span className="lc-reservas-sem-acao">—</span>
                                                        )}
                                                    </div>
                                                    {textoCancelamento(req) && (
                                                        <p className="lc-pedido-aviso">{textoCancelamento(req)}</p>
                                                    )}
                                                    {avisoPrazoLocador(req) && (
                                                        <p className="lc-pedido-aviso">{avisoPrazoLocador(req)}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <ul className="lc-reservas-cards" aria-label="Lista de reservas">
                            {filtradas.map((req) => {
                                const st = STATUS_RESERVA[statusDe(req.status)] || {
                                    texto: req.status || "—",
                                    tom: "muted",
                                };
                                return (
                                    <li key={`card-${req.id}`} className={`lc-reserva-card${statusDe(req.status) === "PENDENTE" ? " is-pendente" : ""}`}>
                                        <div className="lc-reserva-card-topo">
                                            <strong>{req.espaco?.titulo || "Espaço"}</strong>
                                            <span className={`lc-badge lc-badge--${st.tom}`}>{st.texto}</span>
                                        </div>
                                        <dl className="lc-reserva-card-meta">
                                            <div>
                                                <dt>Data e horário</dt>
                                                <dd>
                                                    {formatarData(req.dataEvento)} · {faixaHorario(req)}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Locatário</dt>
                                                <dd>{req.locatarioNome || "—"}</dd>
                                            </div>
                                            <div>
                                                <dt>Valor</dt>
                                                <dd>{formatarMoeda(req.valorTotal)}</dd>
                                            </div>
                                        </dl>
                                        <div className="lc-reservas-acoes">
                                            <button type="button" className="lc-btn lc-btn--ghost" onClick={() => setPedidoAberto(req)}>
                                                Detalhes
                                            </button>
                                            {statusDe(req.status) === "PENDENTE" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="lc-btn lc-btn--success"
                                                        onClick={() => pedirConfirmacao("aprovar", req)}
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="lc-btn lc-btn--danger-ghost"
                                                        onClick={() => pedirConfirmacao("rejeitar", req)}
                                                    >
                                                        Recusar
                                                    </button>
                                                </>
                                            )}
                                            {podeCancelarLocador(req) && (
                                                <button
                                                    type="button"
                                                    className="lc-btn lc-btn--danger-ghost"
                                                    onClick={() => pedirConfirmacao("cancelar", req)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </section>

            <PedidoLocacaoModal
                pedido={pedidoAberto}
                onFechar={() => setPedidoAberto(null)}
                onAprovar={(id) => {
                    const pedido = pedidoAberto?.id === id ? pedidoAberto : solicitacoes.find((req) => req.id === id);
                    setPedidoAberto(null);
                    pedirConfirmacao("aprovar", pedido || id);
                }}
                onRejeitar={(id) => {
                    const pedido = pedidoAberto?.id === id ? pedidoAberto : solicitacoes.find((req) => req.id === id);
                    setPedidoAberto(null);
                    pedirConfirmacao("rejeitar", pedido || id);
                }}
            />

            {confirmacao && (
                <Modal
                    titulo={TEXTOS_CONFIRMACAO[confirmacao.acao].titulo}
                    onClose={fecharConfirmacao}
                    bloqueado={processando}
                    tamanho="sm"
                    rodape={(
                        <>
                            <button
                                type="button"
                                className="lc-btn lc-btn--ghost"
                                onClick={fecharConfirmacao}
                                disabled={processando}
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                className={TEXTOS_CONFIRMACAO[confirmacao.acao].classe}
                                onClick={executarConfirmacao}
                                disabled={processando}
                            >
                                {processando ? "Aguarde…" : TEXTOS_CONFIRMACAO[confirmacao.acao].confirmar}
                            </button>
                        </>
                    )}
                >
                    <p className="lc-confirmacao-desc">
                        {TEXTOS_CONFIRMACAO[confirmacao.acao].descricao(confirmacao.pedido)}
                        {confirmacao.acao === "cancelar" && podeCancelarLocador(confirmacao.pedido) && (
                            <> Prazo restante: {prazoLocador(confirmacao.pedido)} dia(s) antes do evento.</>
                        )}
                    </p>
                    {erroConfirmacao && <p className="lc-pedido-erro">{erroConfirmacao}</p>}
                </Modal>
            )}
        </div>
    );
}
