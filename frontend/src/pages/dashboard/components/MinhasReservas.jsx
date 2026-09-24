import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Header from "./Header";
import "../Dashboard.css"; 
const LABEL_STATUS = {
    PENDENTE: "Aguardando resposta do locador",
    APROVADA: "Aprovada",
    REJEITADA: "Rejeitada",
    CANCELADA: "Cancelada",
};

const CLASSE_BADGE = {
    PENDENTE: "badge-pendente",
    APROVADA: "badge-aprovado",
    REJEITADA: "badge-rejeitado",
    CANCELADA: "badge-cancelada",
};

function formatarData(dataEvento) {
    if (!dataEvento) return "";
    const [ano, mes, dia] = dataEvento.split("-");
    return `${dia}/${mes}/${ano}`;
}

function eventoJaAconteceu(dataEvento) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(`${dataEvento}T00:00:00`) <= hoje;
}

export default function MinhasReservas() {
    const { usuarioLogado } = useAuth();

    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [reservaAvaliando, setReservaAvaliando] = useState(null);
    const [notaSelecionada, setNotaSelecionada] = useState(0);
    const [comentario, setComentario] = useState("");
    const [enviando, setEnviando] = useState(false);

    const buscarReservas = () => {
        if (!usuarioLogado?.id) return;
        setCarregando(true);

        fetch("http://localhost:8080/api/reservas/minhas-reservas", {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar reservas");
                return res.json();
            })
            .then((data) => setReservas(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Erro ao buscar reservas:", err))
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        buscarReservas();
    }, [usuarioLogado]);

    const handleAbrirAvaliacao = (reserva) => {
        setReservaAvaliando(reserva);
        setNotaSelecionada(0);
        setComentario("");
    };

    const handleFecharAvaliacao = () => {
        setReservaAvaliando(null);
        setNotaSelecionada(0);
        setComentario("");
    };

    const handleConfirmarAvaliacao = async (e) => {
        e.preventDefault();
        if (notaSelecionada < 1) {
            alert("Escolha de 1 a 5 estrelas antes de enviar.");
            return;
        }

        setEnviando(true);
        try {
            const response = await fetch(
                `http://localhost:8080/api/reservas/${reservaAvaliando.id}/avaliar`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Usuario-Id": usuarioLogado.id,
                    },
                    body: JSON.stringify({
                        nota: notaSelecionada,
                        comentario: comentario,
                    }),
                }
            );

            if (!response.ok) {
                const erroMsg = await response.text();
                throw new Error(erroMsg || "Erro ao enviar avaliação");
            }

            handleFecharAvaliacao();
            buscarReservas();
        } catch (error) {
            console.error("Erro:", error);
            alert(`Não foi possível enviar sua avaliação: ${error.message}`);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="dashboard">
            <Header />

            <main className="main">
                <h3>Minhas Reservas</h3>
                <p>Acompanhe o status dos espaços que você solicitou e avalie os eventos já realizados.</p>

                <div className="card">
                    {carregando ? (
                        <div className="estado-info">Carregando suas reservas...</div>
                    ) : reservas.length === 0 ? (
                        <div className="estado-info">Você ainda não fez nenhuma reserva.</div>
                    ) : (
                        <div className="pedidos-lista">
                            {reservas.map((reserva) => {
                                const podeAvaliar =
                                    reserva.status === "APROVADA" &&
                                    !reserva.nota &&
                                    eventoJaAconteceu(reserva.dataEvento);

                                return (
                                    <div key={reserva.id} className="pedido-card">
                                        <div className="pedido-info">
                                            <strong className="pedido-titulo">
                                                {reserva.espaco?.titulo}
                                            </strong>
                                            <div className="pedido-meta">
                                                <span>📅 {formatarData(reserva.dataEvento)}</span>
                                                <span className="pedido-meta-dot">•</span>
                                                <span className={`badge ${CLASSE_BADGE[reserva.status] || ""}`}>
                                                    {LABEL_STATUS[reserva.status] || reserva.status}
                                                </span>
                                            </div>

                                            {reserva.nota ? (
                                                <div className="avaliacao-recebida">
                                                    <span className="estrelas-exibicao">
                                                        {"★".repeat(reserva.nota)}
                                                        {"☆".repeat(5 - reserva.nota)}
                                                    </span>
                                                    {reserva.comentarioAvaliacao && (
                                                        <p>"{reserva.comentarioAvaliacao}"</p>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        {podeAvaliar && (
                                            <div className="pedido-acoes">
                                                <button
                                                    onClick={() => handleAbrirAvaliacao(reserva)}
                                                    className="btn btn-avaliar"
                                                >
                                                    Avaliar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {reservaAvaliando && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Avaliar {reservaAvaliando.espaco?.titulo}</h3>
                        <p className="modal-desc">Como foi sua experiência nesse espaço?</p>

                        <form onSubmit={handleConfirmarAvaliacao}>
                            <div className="input-group">
                                <label>Sua nota:</label>
                                <div className="estrelas-input">
                                    {[1, 2, 3, 4, 5].map((valor) => (
                                        <button
                                            type="button"
                                            key={valor}
                                            className={`estrela-btn ${valor <= notaSelecionada ? "preenchida" : ""}`}
                                            onClick={() => setNotaSelecionada(valor)}
                                            aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Comentário (opcional):</label>
                                <textarea
                                    rows="3"
                                    placeholder="Conte como foi o evento..."
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                />
                            </div>

                            <div className="modal-acoes">
                                <button
                                    type="button"
                                    className="btn btn-cancelar"
                                    onClick={handleFecharAvaliacao}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-avaliar" disabled={enviando}>
                                    {enviando ? "Enviando..." : "Enviar Avaliação"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}