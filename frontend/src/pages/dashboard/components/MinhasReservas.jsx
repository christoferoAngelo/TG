import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import Modal from "../../../components/locador/Modal";
import { pedirRecargaAvisos } from "../../../components/notificacao/CaixaAvisos";
import { podeCancelarLocatario, textoCancelamento } from "../../reserva/cancelamento";
import "./MinhasReservas.css";
import JellyRadio, { jellyTema } from "../../../components/ui/JellyRadio";
import PeekRating from "../../../components/bits/PeekRating";

const API = "http://localhost:8080/api";

const STATUS = {
    PENDENTE: { rotulo: "Aguardando", classe: "mr-badge--pendente" },
    APROVADA: { rotulo: "Confirmada", classe: "mr-badge--ok" },
    REJEITADA: { rotulo: "Recusada", classe: "mr-badge--nao" },
    CANCELADA: { rotulo: "Cancelada", classe: "mr-badge--off" },
};

const FILTROS = [
    { id: "todas", rotulo: "Todas" },
    { id: "proximas", rotulo: "Próximas" },
    { id: "aguardando", rotulo: "Aguardando" },
    { id: "avaliar", rotulo: "Para avaliar" },
    { id: "encerradas", rotulo: "Encerradas" },
];

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SEMANAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const moeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function hhmm(hora) {
    if (!hora) return "";
    if (Array.isArray(hora)) {
        return `${String(hora[0]).padStart(2, "0")}:${String(hora[1] ?? 0).padStart(2, "0")}`;
    }
    return String(hora).slice(0, 5);
}

function partesData(iso) {
    const [ano, mes, dia] = String(iso).split("-").map(Number);
    return { ano, mes, dia, data: new Date(ano, mes - 1, dia) };
}

function instante(iso, hora) {
    const { ano, mes, dia } = partesData(iso);
    const texto = hhmm(hora) || "00:00";
    const [h, m] = texto.split(":").map(Number);
    return new Date(ano, mes - 1, dia, h || 0, m || 0, 0, 0);
}

function eventoEncerrado(reserva) {
    if (!reserva?.dataEvento) return false;
    return instante(reserva.dataEvento, reserva.horaFim) <= new Date();
}

function quando(iso) {
    const { data } = partesData(iso);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.round((data - hoje) / 86400000);
    if (dias === 0) return "Hoje";
    if (dias === 1) return "Amanhã";
    if (dias === -1) return "Ontem";
    if (dias > 1) return `Em ${dias} dias`;
    return `Há ${Math.abs(dias)} dias`;
}

function horario(reserva) {
    const inicio = hhmm(reserva.horaInicio);
    const fim = hhmm(reserva.horaFim);
    if (inicio && fim) return `${inicio} às ${fim}`;
    return "Dia inteiro";
}

function podeAvaliar(reserva) {
    return reserva.status === "APROVADA" && !reserva.nota && eventoEncerrado(reserva);
}

function passaFiltro(reserva, filtro) {
    if (filtro === "proximas") {
        return (reserva.status === "PENDENTE" || reserva.status === "APROVADA") && !eventoEncerrado(reserva);
    }
    if (filtro === "aguardando") return reserva.status === "PENDENTE";
    if (filtro === "avaliar") return podeAvaliar(reserva);
    if (filtro === "encerradas") {
        return reserva.status === "REJEITADA"
            || reserva.status === "CANCELADA"
            || (reserva.status === "APROVADA" && eventoEncerrado(reserva));
    }
    return true;
}

function ordenar(lista) {
    return [...lista].sort((a, b) => {
        const aFutura = !eventoEncerrado(a);
        const bFutura = !eventoEncerrado(b);
        if (aFutura !== bFutura) return aFutura ? -1 : 1;
        const porData = String(a.dataEvento).localeCompare(String(b.dataEvento));
        return aFutura ? porData : -porData;
    });
}

function textoVazio(filtro, buscando) {
    if (buscando) return "Nenhuma reserva com esse nome.";
    if (filtro === "proximas") return "Você não tem reservas daqui para frente.";
    if (filtro === "aguardando") return "Nenhum pedido esperando resposta do locador.";
    if (filtro === "avaliar") return "Nenhum evento pendente de avaliação.";
    if (filtro === "encerradas") return "Nenhuma reserva encerrada.";
    return "Você ainda não fez nenhuma reserva.";
}

export default function MinhasReservas() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroLista, setErroLista] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [busca, setBusca] = useState("");

    const [avaliando, setAvaliando] = useState(null);
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState("");
    const [erroNota, setErroNota] = useState("");
    const [enviando, setEnviando] = useState(false);

    const [confirmandoId, setConfirmandoId] = useState(null);
    const [cancelandoId, setCancelandoId] = useState(null);
    const [erroCancelar, setErroCancelar] = useState("");

    const buscarReservas = (silencioso = false) => {
        if (!usuarioLogado?.id) {
            setCarregando(false);
            return;
        }
        if (!silencioso) setCarregando(true);
        setErroLista("");
        fetch(`${API}/reservas/minhas-reservas`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Não foi possível carregar suas reservas.");
                return res.json();
            })
            .then((data) => setReservas(Array.isArray(data) ? data : []))
            .catch((err) => setErroLista(err.message))
            .finally(() => {
                if (!silencioso) setCarregando(false);
            });
    };

    useEffect(() => {
        buscarReservas();
    }, [usuarioLogado?.id]);

    const termo = busca.trim().toLowerCase();
    const comBusca = useMemo(() => {
        if (!termo) return reservas;
        return reservas.filter((reserva) =>
            (reserva.espaco?.titulo || "").toLowerCase().includes(termo)
        );
    }, [reservas, termo]);

    const contagens = useMemo(() => {
        const totais = { todas: comBusca.length };
        FILTROS.forEach((item) => {
            if (item.id === "todas") return;
            totais[item.id] = comBusca.filter((reserva) => passaFiltro(reserva, item.id)).length;
        });
        return totais;
    }, [comBusca]);

    const visiveis = useMemo(
        () => ordenar(comBusca.filter((reserva) => passaFiltro(reserva, filtro))),
        [comBusca, filtro]
    );

    const proximaId = useMemo(() => {
        const futura = ordenar(reservas).find(
            (reserva) => (reserva.status === "PENDENTE" || reserva.status === "APROVADA") && !eventoEncerrado(reserva)
        );
        return futura?.id ?? null;
    }, [reservas]);

    const abrirAvaliacao = (reserva) => {
        setAvaliando(reserva);
        setNota(0);
        setComentario("");
        setErroNota("");
    };

    const fecharAvaliacao = () => {
        if (enviando) return;
        setAvaliando(null);
    };

    const enviarAvaliacao = async (e) => {
        e.preventDefault();
        if (nota < 1) {
            setErroNota("Escolha de 1 a 5 estrelas.");
            return;
        }
        setEnviando(true);
        setErroNota("");
        try {
            const response = await fetch(`${API}/reservas/${avaliando.id}/avaliar`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Usuario-Id": usuarioLogado.id,
                },
                body: JSON.stringify({ nota, comentario: comentario.trim() }),
            });
            if (!response.ok) {
                throw new Error((await response.text()) || "Não foi possível enviar a avaliação.");
            }
            setAvaliando(null);
            buscarReservas(true);
        } catch (error) {
            setErroNota(error.message);
        } finally {
            setEnviando(false);
        }
    };

    const cancelarReserva = async (reserva) => {
        setCancelandoId(reserva.id);
        setErroCancelar("");
        try {
            const response = await fetch(`${API}/reservas/${reserva.id}/cancelar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });
            if (!response.ok) {
                const texto = await response.text();
                throw new Error(
                    response.status === 404
                        ? "O cancelamento ainda não está ativo. Reinicie a API e tente de novo."
                        : (texto || "Não foi possível cancelar esta reserva.")
                );
            }
            setConfirmandoId(null);
            pedirRecargaAvisos();
            buscarReservas(true);
        } catch (error) {
            setErroCancelar(error.message);
        } finally {
            setCancelandoId(null);
        }
    };

    return (
        <div className="mr-page">
            <header className="mr-topo">
                <div>
                    <h1>Minhas reservas</h1>
                    <p>Acompanhe pedidos, datas confirmadas e o que ainda falta avaliar.</p>
                </div>
            </header>

            <section className="mr-resumo" aria-label="Resumo">
                <button type="button" className={filtro === "proximas" ? "mr-resumo-item mr-resumo-item--ativo" : "mr-resumo-item"} onClick={() => setFiltro("proximas")}>
                    <strong>{carregando ? "–" : reservas.filter((r) => passaFiltro(r, "proximas")).length}</strong>
                    <span>Próximas</span>
                </button>
                <button type="button" className={filtro === "aguardando" ? "mr-resumo-item mr-resumo-item--ativo" : "mr-resumo-item"} onClick={() => setFiltro("aguardando")}>
                    <strong>{carregando ? "–" : reservas.filter((r) => r.status === "PENDENTE").length}</strong>
                    <span>Aguardando o locador</span>
                </button>
                <button type="button" className={filtro === "avaliar" ? "mr-resumo-item mr-resumo-item--ativo" : "mr-resumo-item"} onClick={() => setFiltro("avaliar")}>
                    <strong>{carregando ? "–" : reservas.filter((r) => podeAvaliar(r)).length}</strong>
                    <span>Para avaliar</span>
                </button>
            </section>

            <div className="mr-ferramentas">
                <label className="mr-busca">
                    <span className="mr-sr">Buscar reserva</span>
                    <input
                        type="search"
                        value={busca}
                        placeholder="Buscar pelo nome do espaço"
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </label>
                <JellyRadio
                    className="mr-filtros"
                    ariaLabel="Filtrar reservas"
                    size="sm"
                    items={FILTROS.map((item) => ({
                        value: item.id,
                        label: (
                            <>
                                {item.rotulo}
                                <span>{carregando ? "" : contagens[item.id] ?? 0}</span>
                            </>
                        ),
                    }))}
                    value={filtro}
                    onChange={setFiltro}
                    {...jellyTema}
                />
            </div>

            {carregando && (
                <div className="mr-lista" aria-hidden="true">
                    {[0, 1, 2].map((item) => (
                        <div className="mr-card mr-card--skeleton" key={item}>
                            <div className="mr-skel mr-skel--data" />
                            <div className="mr-skel-col">
                                <div className="mr-skel mr-skel--titulo" />
                                <div className="mr-skel mr-skel--linha" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!carregando && erroLista && (
                <div className="mr-vazio">
                    <h2>Não deu para carregar</h2>
                    <p>{erroLista}</p>
                    <button type="button" className="mr-btn mr-btn--primario" onClick={buscarReservas}>
                        Tentar de novo
                    </button>
                </div>
            )}

            {!carregando && !erroLista && visiveis.length === 0 && (
                <div className="mr-vazio">
                    <h2>{reservas.length === 0 ? "Nenhuma reserva ainda" : "Nada neste filtro"}</h2>
                    <p>{textoVazio(filtro, Boolean(termo))}</p>
                    {reservas.length === 0 && (
                        <button type="button" className="mr-btn mr-btn--primario" onClick={() => navigate("/home")}>
                            Explorar espaços
                        </button>
                    )}
                </div>
            )}

            {!carregando && !erroLista && visiveis.length > 0 && (
                <ul className="mr-lista">
                    {visiveis.map((reserva) => {
                        const partes = partesData(reserva.dataEvento);
                        const status = STATUS[reserva.status] || { rotulo: reserva.status, classe: "mr-badge--off" };
                        const confirmar = confirmandoId === reserva.id;
                        return (
                            <li key={reserva.id}>
                                <article className={`mr-card${reserva.id === proximaId ? " mr-card--proxima" : ""}`}>
                                    <div className="mr-data" aria-hidden="true">
                                        <span>{MESES[partes.mes - 1]}</span>
                                        <strong>{partes.dia}</strong>
                                        <span>{SEMANAS[partes.data.getDay()]}</span>
                                    </div>
                                    <div className="mr-corpo">
                                        <div className="mr-linha">
                                            <h2>{reserva.espaco?.titulo || "Espaço"}</h2>
                                            <span className={`mr-badge ${status.classe}`}>{status.rotulo}</span>
                                            {reserva.pagamentoLiberado && reserva.status === "APROVADA" && (
                                                <span className="mr-pagamento">Pagamento liberado</span>
                                            )}
                                        </div>
                                        {reserva.id === proximaId && <p className="mr-proxima">Próxima reserva</p>}
                                        <p className="mr-meta">
                                            <span>{quando(reserva.dataEvento)}</span>
                                            <span>{horario(reserva)}</span>
                                            {reserva.valorTotal != null && <span>{moeda(reserva.valorTotal)}</span>}
                                        </p>
                                        {reserva.status === "PENDENTE" && (
                                            <p className="mr-nota-status">O locador ainda precisa aceitar este pedido.</p>
                                        )}
                                        {reserva.status === "REJEITADA" && (
                                            <p className="mr-nota-status">O locador não aceitou este pedido.</p>
                                        )}
                                        {reserva.status === "CANCELADA" && (
                                            <div className="mr-motivo">
                                                <strong>Motivo do cancelamento</strong>
                                                <p>{textoCancelamento(reserva)}</p>
                                            </div>
                                        )}
                                        {reserva.nota ? (
                                            <p className="mr-avaliacao">
                                                <span aria-label={`Nota ${reserva.nota} de 5`}>
                                                    {"★".repeat(reserva.nota)}
                                                    <span className="mr-estrelas-vazias">{"★".repeat(5 - reserva.nota)}</span>
                                                </span>
                                                {reserva.comentarioAvaliacao && <em>“{reserva.comentarioAvaliacao}”</em>}
                                            </p>
                                        ) : null}

                                        {confirmar ? (
                                            <div className="mr-confirma">
                                                <p>
                                                    {reserva.status === "APROVADA"
                                                        ? "Cancelar esta reserva confirmada? Não há reembolso automático. A data volta a ficar disponível para novas reservas."
                                                        : "Cancelar este pedido? Ele ainda não foi confirmado, então não há cobrança. A data volta a ficar disponível."}
                                                </p>
                                                {erroCancelar && <p className="mr-erro">{erroCancelar}</p>}
                                                <div className="mr-acoes">
                                                    <button
                                                        type="button"
                                                        className="mr-btn mr-btn--perigo"
                                                        disabled={cancelandoId === reserva.id}
                                                        onClick={() => cancelarReserva(reserva)}
                                                    >
                                                        {cancelandoId === reserva.id ? "Cancelando…" : "Confirmar cancelamento"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mr-btn mr-btn--secundario"
                                                        disabled={cancelandoId === reserva.id}
                                                        onClick={() => {
                                                            setConfirmandoId(null);
                                                            setErroCancelar("");
                                                        }}
                                                    >
                                                        Voltar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mr-acoes">
                                                <button
                                                    type="button"
                                                    className="mr-btn mr-btn--secundario"
                                                    onClick={() => navigate(`/espaco/${reserva.espaco?.id}`)}
                                                >
                                                    Ver espaço
                                                </button>
                                                {podeAvaliar(reserva) && (
                                                    <button
                                                        type="button"
                                                        className="mr-btn mr-btn--primario"
                                                        onClick={() => abrirAvaliacao(reserva)}
                                                    >
                                                        Avaliar
                                                    </button>
                                                )}
                                                {podeCancelarLocatario(reserva) && (
                                                    <button
                                                        type="button"
                                                        className="mr-btn mr-btn--perigo"
                                                        onClick={() => {
                                                            setConfirmandoId(reserva.id);
                                                            setErroCancelar("");
                                                        }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            </li>
                        );
                    })}
                </ul>
            )}

            {avaliando && (
                <Modal
                    titulo={`Avaliar ${avaliando.espaco?.titulo || "o espaço"}`}
                    subtitulo="Sua nota aparece na página do espaço."
                    onClose={fecharAvaliacao}
                    bloqueado={enviando}
                    tamanho="sm"
                    rodape={(
                        <>
                            <button type="button" className="mdl-btn mdl-btn--ghost" onClick={fecharAvaliacao} disabled={enviando}>
                                Cancelar
                            </button>
                            <button type="submit" form="mr-avaliar" className="mdl-btn mdl-btn--primario" disabled={enviando}>
                                {enviando ? "Enviando…" : "Enviar avaliação"}
                            </button>
                        </>
                    )}
                >
                    <form id="mr-avaliar" className="mr-form" onSubmit={enviarAvaliacao}>
                        <div className={`mdl-campo${erroNota ? " mdl-campo--erro" : ""}`}>
                            <span className="mr-rotulo">Sua nota</span>
                            <PeekRating
                                value={nota}
                                onChange={(valor) => {
                                    setNota(valor);
                                    setErroNota("");
                                }}
                                count={5}
                                allowClear={false}
                                activeColor="#FECB5A"
                                idleColor="#EDDAB0"
                                tipColor="#130501"
                                tipTextColor="#FEFBE6"
                                ariaLabel="Nota de 1 a 5"
                                labels={["Ruim", "Regular", "Boa", "Muito boa", "Excelente"]}
                            />
                            {erroNota && <small className="mdl-erro">{erroNota}</small>}
                        </div>
                        <div className="mdl-campo">
                            <label htmlFor="mr-comentario">
                                Comentário <span className="mdl-opcional">(opcional)</span>
                            </label>
                            <textarea
                                id="mr-comentario"
                                className="mdl-input"
                                rows={4}
                                maxLength={500}
                                placeholder="Conte como foi o evento"
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
