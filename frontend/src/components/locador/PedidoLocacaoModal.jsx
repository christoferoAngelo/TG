import { useEffect } from "react";
import "./Modal.css";
import "../../pages/locador/DashboardLocador.css";

function hora(valor) {
    if (!valor) return "";
    if (Array.isArray(valor)) {
        return `${String(valor[0]).padStart(2, "0")}:${String(valor[1] ?? 0).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 5);
}

function dataTexto(valor) {
    if (!valor) return "—";
    if (Array.isArray(valor)) {
        const [ano, mes, dia] = valor;
        return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : String(valor);
}

function moeda(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS = {
    PENDENTE: { texto: "Pendente", tom: "warn" },
    APROVADA: { texto: "Aprovada", tom: "ok" },
    REJEITADA: { texto: "Rejeitada", tom: "danger" },
    CANCELADA: { texto: "Cancelada", tom: "muted" },
};

export default function PedidoLocacaoModal({ pedido, onFechar, onAprovar, onRejeitar }) {
    useEffect(() => {
        if (!pedido) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") onFechar?.();
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [pedido, onFechar]);

    if (!pedido) return null;

    const inicio = hora(pedido.horaInicio);
    const fim = hora(pedido.horaFim);
    const horario = inicio && fim ? `${inicio}–${fim}` : "Dia inteiro";
    const statusKey = (pedido.status || "").toUpperCase();
    const st = STATUS[statusKey] || { texto: pedido.status || "—", tom: "muted" };
    const pendente = statusKey === "PENDENTE";
    const obs = pedido.observacao?.trim();

    return (
        <div className="mdl-overlay" onClick={onFechar} role="presentation">
            <div
                className="mdl mdl--sm lc-pedido-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lc-pedido-titulo"
                onClick={(evento) => evento.stopPropagation()}
            >
                <header className="mdl-cab">
                    <div>
                        <p className="lc-pedido-meta">Pedido #{pedido.id}</p>
                        <h2 id="lc-pedido-titulo">{pedido.espaco?.titulo || "Pedido de locação"}</h2>
                        <span className={`lc-badge lc-badge--${st.tom}`}>{st.texto}</span>
                    </div>
                    <button type="button" className="mdl-fechar" onClick={onFechar} aria-label="Fechar">
                        ×
                    </button>
                </header>

                <div className="mdl-corpo">
                    <dl className="lc-pedido-grid" aria-label="Detalhes do pedido">
                        <div className="lc-pedido-item">
                            <dt>Locatário</dt>
                            <dd>{pedido.locatarioNome || "Não informado"}</dd>
                        </div>
                        <div className="lc-pedido-item lc-pedido-item--valor">
                            <dt>Valor</dt>
                            <dd>{moeda(pedido.valorTotal)}</dd>
                        </div>
                        <div className="lc-pedido-item">
                            <dt>Data</dt>
                            <dd>{dataTexto(pedido.dataEvento)}</dd>
                        </div>
                        <div className="lc-pedido-item">
                            <dt>Horário</dt>
                            <dd>{horario}</dd>
                        </div>
                    </dl>

                    <section className="lc-pedido-bloco" aria-labelledby="lc-pedido-obs-titulo">
                        <h3 id="lc-pedido-obs-titulo">Observações</h3>
                        <p className={`lc-pedido-obs${obs ? "" : " is-vazio"}`}>
                            {obs || "O locatário não deixou observações."}
                        </p>
                    </section>
                </div>

                <footer className="mdl-rodape lc-pedido-rodape">
                    <button type="button" className="lc-btn lc-btn--ghost" onClick={onFechar}>
                        Fechar
                    </button>
                    {pendente && (
                        <>
                            <button
                                type="button"
                                className="lc-btn lc-btn--danger-ghost"
                                onClick={() => onRejeitar(pedido.id)}
                            >
                                Rejeitar
                            </button>
                            <button
                                type="button"
                                className="lc-btn lc-btn--success"
                                onClick={() => onAprovar(pedido.id)}
                            >
                                Aprovar
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
}
