import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CalendarioSolicitacoes from "../../components/locador/CalendarioSolicitacoes";
import PedidoLocacaoModal from "../../components/locador/PedidoLocacaoModal";
import { pedirRecargaAvisos } from "../../components/notificacao/CaixaAvisos";
import { avisoPrazoLocador, podeCancelarLocador, prazoLocador, textoCancelamento } from "../reserva/cancelamento";
import JellyRadio, { jellyTema } from "../../components/ui/JellyRadio";
import { formatarData, formatarHora, formatarMoeda, statusDe } from "./formatadores";
import "./DashboardLocador.css";
import "./LocadorLayout.css";
import "./LocadorReservas.css";

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
    const [visualizacao, setVisualizacao] = useState("lista");
    const [confirmandoId, setConfirmandoId] = useState(null);
    const [pedidoAberto, setPedidoAberto] = useState(null);
    const [cancelandoId, setCancelandoId] = useState(null);
    const [erroCancelar, setErroCancelar] = useState("");

    const carregar = () => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);
        fetch(`${API}/reservas/minhas-solicitacoes`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                const lista = Array.isArray(data) ? data : [];
                lista.sort(compararReservas);
                setSolicitacoes(lista);
                if (typeof setPendentesNav === "function") {
                    setPendentesNav(lista.filter((r) => statusDe(r.status) === "PENDENTE").length);
                }
            })
            .catch(() => setSolicitacoes([]))
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

    const handleAprovar = async (reservaId) => {
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/aprovar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });
            if (!response.ok) throw new Error("Falha ao aprovar reserva.");
            atualizarLocal(reservaId, { status: "APROVADA" });
            if (typeof setPendentesNav === "function") {
                setPendentesNav((n) => Math.max(0, (Number(n) || 0) - 1));
            }
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    const handleRejeitar = async (reservaId) => {
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/rejeitar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });
            if (!response.ok) throw new Error("Falha ao rejeitar reserva.");
            atualizarLocal(reservaId, { status: "REJEITADA" });
            if (typeof setPendentesNav === "function") {
                setPendentesNav((n) => Math.max(0, (Number(n) || 0) - 1));
            }
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    const handleCancelar = async (reservaId) => {
        setCancelandoId(reservaId);
        setErroCancelar("");
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/cancelar-locador`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });
            if (!response.ok) {
                const texto = await response.text();
                throw new Error(texto || "Não foi possível cancelar esta reserva.");
            }
            const atualizada = await response.json();
            atualizarLocal(reservaId, atualizada);
            setConfirmandoId(null);
            pedirRecargaAvisos();
        } catch (err) {
            setErroCancelar(err.message);
        } finally {
            setCancelandoId(null);
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
                    <p className="lc-vazio">Carregando pedidos…</p>
                ) : filtradas.length === 0 ? (
                    <p className="lc-vazio">
                        {filtroStatus
                            ? "Nenhuma reserva com este status."
                            : "Você ainda não recebeu nenhum pedido de locação."}
                    </p>
                ) : visualizacao === "calendario" ? (
                    <div className="lc-calendario">
                        <CalendarioSolicitacoes
                            solicitacoes={filtradas}
                            onAprovar={handleAprovar}
                            onRejeitar={handleRejeitar}
                            onCancelar={(id) => {
                                setErroCancelar("");
                                setConfirmandoId(id);
                                setVisualizacao("lista");
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
                                                        {statusDe(req.status) === "PENDENTE" && confirmandoId !== req.id && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--success"
                                                                    onClick={() => handleAprovar(req.id)}
                                                                >
                                                                    Aprovar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--danger-ghost"
                                                                    onClick={() => handleRejeitar(req.id)}
                                                                >
                                                                    Recusar
                                                                </button>
                                                            </>
                                                        )}
                                                        {podeCancelarLocador(req) && confirmandoId !== req.id && (
                                                            <button
                                                                type="button"
                                                                className="lc-btn lc-btn--danger-ghost"
                                                                onClick={() => {
                                                                    setErroCancelar("");
                                                                    setConfirmandoId(req.id);
                                                                }}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                        {statusDe(req.status) !== "PENDENTE" && !podeCancelarLocador(req) && confirmandoId !== req.id && (
                                                            <span className="lc-reservas-sem-acao">—</span>
                                                        )}
                                                    </div>
                                                    {confirmandoId === req.id && (
                                                        <div className="lc-cancela" role="alertdialog" aria-labelledby={`cancela-titulo-${req.id}`}>
                                                            <p id={`cancela-titulo-${req.id}`}>
                                                                <strong>Confirmar cancelamento?</strong>{" "}
                                                                O locatário receberá reembolso total e a data volta a ficar disponível.
                                                                Prazo restante: {prazoLocador(req)} dia(s) antes do evento.
                                                            </p>
                                                            {erroCancelar && <p className="lc-pedido-erro">{erroCancelar}</p>}
                                                            <div className="lc-pedido-acoes">
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--danger"
                                                                    disabled={cancelandoId === req.id}
                                                                    onClick={() => handleCancelar(req.id)}
                                                                >
                                                                    {cancelandoId === req.id ? "Cancelando…" : "Confirmar"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="lc-btn lc-btn--ghost"
                                                                    disabled={cancelandoId === req.id}
                                                                    onClick={() => {
                                                                        setConfirmandoId(null);
                                                                        setErroCancelar("");
                                                                    }}
                                                                >
                                                                    Voltar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
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
                                                    <button type="button" className="lc-btn lc-btn--success" onClick={() => handleAprovar(req.id)}>
                                                        Aprovar
                                                    </button>
                                                    <button type="button" className="lc-btn lc-btn--danger-ghost" onClick={() => handleRejeitar(req.id)}>
                                                        Recusar
                                                    </button>
                                                </>
                                            )}
                                            {podeCancelarLocador(req) && (
                                                <button
                                                    type="button"
                                                    className="lc-btn lc-btn--danger-ghost"
                                                    onClick={() => {
                                                        setErroCancelar("");
                                                        setConfirmandoId(req.id);
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                        {confirmandoId === req.id && (
                                            <div className="lc-cancela" role="alertdialog">
                                                <p>
                                                    <strong>Confirmar cancelamento?</strong>{" "}
                                                    O locatário receberá reembolso total e a data volta a ficar disponível.
                                                </p>
                                                {erroCancelar && <p className="lc-pedido-erro">{erroCancelar}</p>}
                                                <div className="lc-pedido-acoes">
                                                    <button
                                                        type="button"
                                                        className="lc-btn lc-btn--danger"
                                                        disabled={cancelandoId === req.id}
                                                        onClick={() => handleCancelar(req.id)}
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="lc-btn lc-btn--ghost"
                                                        onClick={() => {
                                                            setConfirmandoId(null);
                                                            setErroCancelar("");
                                                        }}
                                                    >
                                                        Voltar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                    setPedidoAberto(null);
                    handleAprovar(id);
                }}
                onRejeitar={(id) => {
                    setPedidoAberto(null);
                    handleRejeitar(id);
                }}
            />
        </div>
    );
}
