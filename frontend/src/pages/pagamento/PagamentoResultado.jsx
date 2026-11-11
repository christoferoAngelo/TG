import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./PagamentoPage.css";

const API = "http://localhost:8080/api/v1/pagamentos";

const TEXTOS = {
    sucesso: {
        titulo: "Pagamento confirmado",
        texto: "Recebemos a confirmação do Mercado Pago. Sua reserva está paga.",
    },
    falha: {
        titulo: "Pagamento não concluído",
        texto: "O pagamento não foi aprovado. Você pode tentar de novo em Minhas reservas.",
    },
    pendente: {
        titulo: "Pagamento em análise",
        texto: "O Mercado Pago ainda está processando. Assim que confirmar, atualizamos a reserva.",
    },
};

export default function PagamentoResultado({ tipo }) {
    const [params] = useSearchParams();
    const [aviso, setAviso] = useState("");
    const conteudo = TEXTOS[tipo] || TEXTOS.falha;

    const reservaId = useMemo(() => {
        const ref = params.get("external_reference") || params.get("reservaId");
        return ref ? String(ref) : "";
    }, [params]);

    const paymentId = params.get("payment_id") || params.get("collection_id") || "";
    const status = params.get("status") || params.get("collection_status") || "";

    useEffect(() => {
        if (tipo !== "sucesso") return undefined;
        let cancelado = false;
        (async () => {
            try {
                const corpo = {};
                if (reservaId) corpo.reservaId = reservaId;
                if (paymentId && paymentId !== "null") corpo.paymentId = paymentId;
                if (!corpo.reservaId && !corpo.paymentId) return;

                const res = await fetch(`${API}/sincronizar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(corpo),
                });
                const dados = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(dados.erro || "Não foi possível registrar o pagamento.");
                }
                if (!dados.pago && !cancelado) {
                    // Fallback: se veio pela URL de sucesso, confirma direto.
                    if (reservaId) {
                        const conf = await fetch(`${API}/confirmar`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reservaId }),
                        });
                        if (!conf.ok) {
                            const err = await conf.json().catch(() => ({}));
                            throw new Error(err.erro || dados.mensagem || "Pagamento não sincronizado.");
                        }
                    }
                }
                sessionStorage.removeItem("locafesta-mp-reserva");
            } catch (err) {
                if (!cancelado) setAviso(err.message || "Pagamento ok no Mercado Pago, mas falhou ao atualizar a reserva.");
            }
        })();
        return () => {
            cancelado = true;
        };
    }, [tipo, reservaId, paymentId]);

    return (
        <div className="pg-page">
            <div className={`pg-card pg-card--resultado pg-card--${tipo}`}>
                <h1>{conteudo.titulo}</h1>
                <p className="pg-resultado-texto">{conteudo.texto}</p>
                {(reservaId || paymentId || status) && (
                    <ul className="pg-resultado-meta">
                        {reservaId && <li>Reserva #{reservaId}</li>}
                        {paymentId && paymentId !== "null" && <li>Pagamento MP: {paymentId}</li>}
                        {status && status !== "null" && <li>Status: {status}</li>}
                    </ul>
                )}
                {aviso && <p className="pg-erro">{aviso}</p>}
                <div className="pg-resultado-acoes">
                    <Link className="pg-btn pg-btn--link" to="/minhas-reservas">
                        Ver minhas reservas
                    </Link>
                    {tipo !== "sucesso" && (
                        <Link className="pg-btn-secundario" to="/minhas-reservas">
                            Tentar de novo
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
