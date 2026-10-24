import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../dashboard/Dashboard.css"; // tokens e controle segmentado (Lista / Calendário)
import "./DashboardLocador.css";

import EspacoItem from "../../components/locador/EspacoItem";
import CalendarioSolicitacoes from "../../components/locador/CalendarioSolicitacoes";
import ModalCriarLocador from "../../components/locador/ModalCriarLocador";
import { pedirRecargaAvisos } from "../../components/notificacao/CaixaAvisos";
import { avisoPrazoLocador, podeCancelarLocador, prazoLocador, textoCancelamento } from "../reserva/cancelamento";
import RelatorioLocador from "./RelatorioLocador";

// ⚠️ Ajuste para as rotas que você registrou para a página NovoEspaco
const ROTA_NOVO_ESPACO = "/locador/espacos/novo";
const rotaEditarEspaco = (espacoId) => `/locador/espacos/${espacoId}/editar`;
const ROTA_PERFIL = "/perfil"; // onde ficam os cadastros de locatário e de locador
const ROTA_HOME = "/home";

const API = "http://localhost:8080/api";

const STATUS_RESERVA = {
    PENDENTE: { texto: "Pendente", tom: "warn" },
    APROVADA: { texto: "Aprovada", tom: "ok" },
    REJEITADA: { texto: "Rejeitada", tom: "danger" },
    CANCELADA: { texto: "Cancelada", tom: "muted" },
};

const statusDe = (s) => (s || "").toUpperCase();

// Evita o bug do fuso: new Date("2026-10-20") vira dia 19 no Brasil
const formatarData = (valor) => {
    if (!valor) return "—";
    if (Array.isArray(valor)) {
        const [a, m, d] = valor;
        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
};

const formatarMoeda = (v) =>
    Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Stat({ label, valor, dica, alerta }) {
    return (
        <div className={`lc-stat${alerta ? " lc-stat--alerta" : ""}`}>
            <span className="lc-stat-label">{label}</span>
            <strong className="lc-stat-valor">{valor}</strong>
            {dica && <span className="lc-stat-dica">{dica}</span>}
        </div>
    );
}

export default function DashboardLocador() {
    const { usuarioLogado, carregando: carregandoAuth, atualizarUsuario } = useAuth();
    const navigate = useNavigate();

    // Só quem tem conta de locador usa este painel
    const ehLocador = Boolean(usuarioLogado?.isLocador || usuarioLogado?.locador);
    // Pré-requisito para virar locador
    const ehLocatario = Boolean(usuarioLogado?.isLocatario || usuarioLogado?.locatario);

    // Estados
    const [espacos, setEspacos] = useState([]);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [carregandoEspacos, setCarregandoEspacos] = useState(false);
    const [carregandoPedidos, setCarregandoPedidos] = useState(false);
    // Modal de criação da conta de locador (só para quem já é locatário)
    const [modalLocadorAberto, setModalLocadorAberto] = useState(false);
    // Controla se os pedidos aparecem como lista ou como calendário
    const [visualizacaoPedidos, setVisualizacaoPedidos] = useState("lista"); // "lista" | "calendario"
    const [confirmandoId, setConfirmandoId] = useState(null);
    const [cancelandoId, setCancelandoId] = useState(null);
    const [erroCancelar, setErroCancelar] = useState("");

    // Carregar espaços E solicitações
    useEffect(() => {
        if (!usuarioLogado?.id || !ehLocador) return;

        setCarregandoEspacos(true);
        setCarregandoPedidos(true);

        fetch(`${API}/locadores/${usuarioLogado.id}/espacos`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setEspacos(Array.isArray(data) ? data : []))
            .catch(() => setEspacos([]))
            .finally(() => setCarregandoEspacos(false));

        fetch(`${API}/reservas/minhas-solicitacoes`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                const lista = Array.isArray(data) ? data : [];
                lista.sort((a, b) => Number(a.id) - Number(b.id));
                setSolicitacoes(lista);
            })
            .catch((err) => console.error("Erro ao buscar solicitações:", err))
            .finally(() => setCarregandoPedidos(false));
    }, [usuarioLogado, ehLocador]);

    // Abre a tela de edição do espaço
    const handleEditarEspaco = (espacoId) => navigate(rotaEditarEspaco(espacoId));

    // Alternar Ativo / Inativo
    const handleAlternarStatus = async (espacoId) => {
        try {
            const response = await fetch(`${API}/locadores/${usuarioLogado.id}/espacos/${espacoId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao atualizar o status do espaço.");
            }

            setEspacos((prev) =>
                prev.map((esp) => {
                    if (esp.id === espacoId) {
                        const estaAtivo = esp.ativo === true || esp.ativo === 1;
                        return { ...esp, ativo: !estaAtivo };
                    }
                    return esp;
                })
            );
        } catch (err) {
            console.error(err);
            alert("Erro: " + err.message);
        }
    };

    // Aprovar e Rejeitar pedidos
    const handleAprovarReserva = async (reservaId) => {
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/aprovar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });

            if (!response.ok) throw new Error("Falha ao aprovar reserva.");

            setSolicitacoes((prev) =>
                prev.map((req) => (req.id === reservaId ? { ...req, status: "APROVADA" } : req))
            );
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    const handleRejeitarReserva = async (reservaId) => {
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/rejeitar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });

            if (!response.ok) throw new Error("Falha ao rejeitar reserva.");

            setSolicitacoes((prev) =>
                prev.map((req) => (req.id === reservaId ? { ...req, status: "REJEITADA" } : req))
            );
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    const handleCancelarReserva = async (reservaId) => {
        setCancelandoId(reservaId);
        setErroCancelar("");
        try {
            const response = await fetch(`${API}/reservas/${reservaId}/cancelar-locador`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id },
            });
            if (!response.ok) {
                const texto = await response.text();
                throw new Error(
                    response.status === 404
                        ? "O cancelamento do locador ainda não está ativo. Reinicie a API e tente de novo."
                        : (texto || "Não foi possível cancelar esta reserva.")
                );
            }
            const atualizada = await response.json();
            setSolicitacoes((prev) => prev.map((req) => (req.id === reservaId ? { ...req, ...atualizada } : req)));
            setConfirmandoId(null);
            pedirRecargaAvisos();
        } catch (err) {
            setErroCancelar(err.message);
        } finally {
            setCancelandoId(null);
        }
    };

    // ---------- Proteção do painel ----------
    if (carregandoAuth) {
        return (
            <div className="dashboard lc-page">
                <main className="lc-container">
                    <p className="lc-vazio">Verificando sua conta…</p>
                </main>
            </div>
        );
    }

    // Não está logado: vai para o login
    if (!usuarioLogado) {
        return <Navigate to="/login" replace />;
    }

    // Está logado, mas ainda não é locador
    if (!ehLocador) {
        return (
            <div className="dashboard lc-page">
                <main className="lc-container">
                    <section className="lc-aviso" role="status">
                        {ehLocatario ? (
                            <>
                                <h1 className="lc-aviso-titulo">Crie sua conta de locador</h1>
                                <p className="lc-aviso-texto">
                                    Para anunciar espaços e receber pedidos de locação, você precisa de uma
                                    conta de locador. Leva só um formulário e você já pode começar a anunciar.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="lc-aviso-titulo">Complete seu cadastro primeiro</h1>
                                <p className="lc-aviso-texto">
                                    Para virar locador, você precisa antes ter uma conta de locatário, que é
                                    criada ao cadastrar seu CPF no perfil. Complete o cadastro e volte aqui.
                                </p>
                            </>
                        )}
                        <div className="lc-aviso-acoes">
                            {ehLocatario ? (
                                <button
                                    type="button"
                                    className="lc-btn lc-btn--primary lc-btn--lg"
                                    onClick={() => setModalLocadorAberto(true)}
                                >
                                    Criar conta de locador
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="lc-btn lc-btn--primary lc-btn--lg"
                                    onClick={() => navigate(ROTA_PERFIL)}
                                >
                                    Completar cadastro
                                </button>
                            )}
                            <button
                                type="button"
                                className="lc-btn lc-btn--ghost lc-btn--lg"
                                onClick={() => navigate(ROTA_HOME)}
                            >
                                Voltar para a Home
                            </button>
                        </div>
                    </section>
                </main>

                {/* Depois de criar, atualizar o usuário faz o painel aparecer no lugar do aviso */}
                {modalLocadorAberto && ehLocatario && (
                    <ModalCriarLocador
                        usuarioLogado={usuarioLogado}
                        onCriado={async () => {
                            if (atualizarUsuario) await atualizarUsuario();
                        }}
                        onClose={() => setModalLocadorAberto(false)}
                    />
                )}
            </div>
        );
    }

    // Números do resumo
    const totalAtivos = espacos.filter((e) => e.ativo === true || e.ativo === 1).length;
    const totalAprovados = espacos.filter((e) => statusDe(e.statusAprovacao) === "APROVADO").length;
    const totalEmAnalise = espacos.filter((e) => statusDe(e.statusAprovacao) === "PENDENTE").length;
    const totalRejeitados = espacos.filter((e) => statusDe(e.statusAprovacao) === "REJEITADO").length;
    const pedidosPendentes = solicitacoes.filter((r) => statusDe(r.status) === "PENDENTE").length;

    return (
        <div className="dashboard lc-page">
            <main className="lc-container">

                {/* ---------- Topo ---------- */}
                <header className="lc-topo">
                    <div>
                        <h1 className="lc-titulo">Painel do Locador</h1>
                        <p className="lc-subtitulo">Gerencie seus espaços, salões e acompanhe seus anúncios.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(ROTA_NOVO_ESPACO)}
                        className="lc-btn lc-btn--primary lc-btn--lg"
                    >
                        + Novo anúncio
                    </button>
                </header>

                {/* ---------- Resumo ---------- */}
                <section className="lc-stats" aria-label="Resumo dos anúncios">
                    <Stat label="Espaços cadastrados" valor={espacos.length} dica={`${totalAtivos} ativo(s)`} />
                    <Stat label="Aprovados" valor={totalAprovados} dica="Visíveis na busca" />
                    <Stat
                        label="Em análise"
                        valor={totalEmAnalise}
                        dica={totalRejeitados > 0 ? `${totalRejeitados} rejeitado(s)` : "Aguardando o admin"}
                    />
                    <Stat
                        label="Pedidos aguardando"
                        valor={pedidosPendentes}
                        dica="Precisam da sua resposta"
                        alerta={pedidosPendentes > 0}
                    />
                </section>

                <RelatorioLocador usuarioId={usuarioLogado.id} />

                <div className="lc-grid">

                    {/* ---------- Pedidos de locação ---------- */}
                    <section className="lc-card">
                        <div className="lc-card-cab">
                            <h2 className="lc-card-titulo">
                                Pedidos de locação
                                <span className="lc-card-contador">{solicitacoes.length}</span>
                            </h2>

                            <div className="segmented-control">
                                <button
                                    type="button"
                                    className={visualizacaoPedidos === "lista" ? "ativo" : ""}
                                    onClick={() => setVisualizacaoPedidos("lista")}
                                >
                                    Lista
                                </button>
                                <button
                                    type="button"
                                    className={visualizacaoPedidos === "calendario" ? "ativo" : ""}
                                    onClick={() => setVisualizacaoPedidos("calendario")}
                                >
                                    Calendário
                                </button>
                            </div>
                        </div>

                        {carregandoPedidos ? (
                            <p className="lc-vazio">Carregando pedidos…</p>
                        ) : solicitacoes.length === 0 ? (
                            <p className="lc-vazio">Você ainda não recebeu nenhum pedido de locação.</p>
                        ) : visualizacaoPedidos === "calendario" ? (
                            <div className="lc-calendario">
                                <CalendarioSolicitacoes
                                    solicitacoes={solicitacoes}
                                    onAprovar={handleAprovarReserva}
                                    onRejeitar={handleRejeitarReserva}
                                    onCancelar={(id) => {
                                        setErroCancelar("");
                                        setConfirmandoId(id);
                                        setVisualizacaoPedidos("lista");
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="lc-pedidos-lista">
                                {solicitacoes.map((req) => {
                                    const st = STATUS_RESERVA[statusDe(req.status)] || {
                                        texto: req.status || "—",
                                        tom: "muted",
                                    };
                                    return (
                                        <div key={req.id} className="lc-pedido">
                                            <div className="lc-pedido-info">
                                                <strong className="lc-pedido-titulo">
                                                    {req.espaco?.titulo || "Espaço"}
                                                </strong>
                                                <div className="lc-pedido-meta">
                                                    <span>{formatarData(req.dataEvento)}</span>
                                                    <span aria-hidden="true">•</span>
                                                    <span>{formatarMoeda(req.valorTotal)}</span>
                                                </div>
                                                {textoCancelamento(req) && (
                                                    <p className="lc-pedido-aviso">{textoCancelamento(req)}</p>
                                                )}
                                                {avisoPrazoLocador(req) && (
                                                    <p className="lc-pedido-aviso">{avisoPrazoLocador(req)}</p>
                                                )}
                                                {confirmandoId === req.id && (
                                                    <div className="lc-cancela">
                                                        <p>
                                                            Cancelar esta reserva confirmada? O locatário será avisado de que o reembolso é total
                                                            e a data volta a ficar disponível. O prazo é de {prazoLocador(req)} dia(s) antes do evento.
                                                        </p>
                                                        {erroCancelar && <p className="lc-pedido-erro">{erroCancelar}</p>}
                                                        <div className="lc-pedido-acoes">
                                                            <button
                                                                type="button"
                                                                className="lc-btn lc-btn--danger"
                                                                disabled={cancelandoId === req.id}
                                                                onClick={() => handleCancelarReserva(req.id)}
                                                            >
                                                                {cancelandoId === req.id ? "Cancelando…" : "Confirmar cancelamento"}
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
                                            </div>

                                            <div className="lc-pedido-lado">
                                                <span className={`lc-badge lc-badge--${st.tom}`}>{st.texto}</span>

                                                {statusDe(req.status) === "PENDENTE" && confirmandoId !== req.id && (
                                                    <div className="lc-pedido-acoes">
                                                        <button
                                                            type="button"
                                                            className="lc-btn lc-btn--success"
                                                            onClick={() => handleAprovarReserva(req.id)}
                                                        >
                                                            Aprovar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="lc-btn lc-btn--danger-ghost"
                                                            onClick={() => handleRejeitarReserva(req.id)}
                                                        >
                                                            Rejeitar
                                                        </button>
                                                    </div>
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
                                                        Cancelar reserva
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ---------- Meus espaços ---------- */}
                    <section className="lc-card">
                        <div className="lc-card-cab">
                            <h2 className="lc-card-titulo">
                                Meus espaços
                                <span className="lc-card-contador">{espacos.length}</span>
                            </h2>
                        </div>

                        {carregandoEspacos ? (
                            <p className="lc-vazio">Carregando seus anúncios…</p>
                        ) : espacos.length === 0 ? (
                            <p className="lc-vazio">
                                Você ainda não possui nenhum espaço cadastrado. Clique em "+ Novo anúncio" para começar a alugar!
                            </p>
                        ) : (
                            <div className="lc-espacos">
                                {espacos.map((espaco, index) => (
                                    <EspacoItem
                                        key={espaco.id || index}
                                        espaco={espaco}
                                        onAlternarStatus={handleAlternarStatus}
                                        onEditar={handleEditarEspaco}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
