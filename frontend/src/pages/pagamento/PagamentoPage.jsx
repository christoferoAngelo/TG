import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PagamentoPage.css";

const CHAVE_RESERVA_PENDENTE = "locafesta-mp-reserva";

function formatarValor(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return String(valor ?? "");
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PagamentoPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const reservaData = location.state || {
        reservaId: "1024",
        nomeEspaco: "Espaço de Eventos",
        valorTotal: "350.00",
    };

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const [sincronizando, setSincronizando] = useState(false);

    // Ao voltar do Mercado Pago (sem auto_return no localhost), tenta sincronizar.
    useEffect(() => {
        const pendente = sessionStorage.getItem(CHAVE_RESERVA_PENDENTE);
        if (!pendente) return undefined;
        let cancelado = false;
        (async () => {
            setSincronizando(true);
            try {
                const res = await fetch("http://localhost:8080/api/v1/pagamentos/sincronizar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reservaId: pendente }),
                });
                const dados = await res.json().catch(() => ({}));
                if (!cancelado && dados?.pago) {
                    sessionStorage.removeItem(CHAVE_RESERVA_PENDENTE);
                    navigate("/pagamento/sucesso?reservaId=" + encodeURIComponent(pendente), { replace: true });
                }
            } catch {
                /* mantém a tela de pagar */
            } finally {
                if (!cancelado) setSincronizando(false);
            }
        })();
        return () => {
            cancelado = true;
        };
    }, [navigate]);

    const handlePagar = async () => {
        setLoading(true);
        setErro(null);
        try {
            const response = await fetch("http://localhost:8080/api/v1/pagamentos/criar-preferencia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservaId: reservaData.reservaId,
                    nomeEspaco: reservaData.nomeEspaco,
                    valorTotal: reservaData.valorTotal,
                }),
            });

            if (!response.ok) {
                const texto = await response.text();
                console.error("Erro do backend:", texto);
                setErro("Não foi possível iniciar o pagamento. Tente novamente.");
                return;
            }

            const data = await response.json();
            // Preferir initPoint: sandbox_init_point está deprecated e costuma abrir /fatal/ no checkout.
            const url = data.initPoint || data.sandboxInitPoint;
            if (!url) {
                setErro("Link de pagamento não retornado pelo servidor.");
                return;
            }
            sessionStorage.setItem(CHAVE_RESERVA_PENDENTE, String(reservaData.reservaId));
            window.location.href = url;
        } catch (error) {
            console.error("Erro ao gerar preferência do Mercado Pago:", error);
            setErro("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pg-page">
            <div className="pg-card">
                <h1>Finalizar Pagamento</h1>
                <div className="pg-resumo">
                    <p>
                        <strong>Espaço:</strong> {reservaData.nomeEspaco}
                    </p>
                    <p>
                        <strong>Valor Total:</strong> {formatarValor(reservaData.valorTotal)}
                    </p>
                </div>

                {erro && <p className="pg-erro">{erro}</p>}
                {sincronizando && <p className="pg-resultado-texto">Conferindo pagamento no Mercado Pago…</p>}

                <button type="button" className="pg-btn" onClick={handlePagar} disabled={loading || sincronizando}>
                    {loading ? "Redirecionando…" : "Pagar com Mercado Pago"}
                </button>
            </div>
        </div>
    );
}
