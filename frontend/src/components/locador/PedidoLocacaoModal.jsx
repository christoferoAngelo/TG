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

export default function PedidoLocacaoModal({ pedido, onFechar, onAprovar, onRejeitar }) {
    if (!pedido) return null;
    const inicio = hora(pedido.horaInicio);
    const fim = hora(pedido.horaFim);
    const horario = inicio && fim ? `${inicio} às ${fim}` : "Dia inteiro";
    const pendente = (pedido.status || "").toUpperCase() === "PENDENTE";

    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div
                className="modal-content lc-pedido-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lc-pedido-titulo"
                onClick={(evento) => evento.stopPropagation()}
            >
                <h3 id="lc-pedido-titulo">{pedido.espaco?.titulo || "Pedido de locação"}</h3>
                <p className="modal-desc">Pedido #{pedido.id}</p>
                <dl className="lc-pedido-ficha">
                    <div>
                        <dt>Locatário</dt>
                        <dd>{pedido.locatarioNome || "Não informado"}</dd>
                    </div>
                    <div>
                        <dt>Data</dt>
                        <dd>{dataTexto(pedido.dataEvento)}</dd>
                    </div>
                    <div>
                        <dt>Horário</dt>
                        <dd>{horario}</dd>
                    </div>
                    <div>
                        <dt>Valor</dt>
                        <dd>{moeda(pedido.valorTotal)}</dd>
                    </div>
                    <div>
                        <dt>Situação</dt>
                        <dd>{pedido.status || "—"}</dd>
                    </div>
                </dl>
                <h4>Observações</h4>
                <p className="lc-pedido-obs">{pedido.observacao?.trim() || "O locatário não deixou observações."}</p>
                <div className="adm-modal-acoes">
                    <button type="button" className="btn btn-cancelar" onClick={onFechar}>Fechar</button>
                    {pendente && (
                        <>
                            <button type="button" className="btn btn-reject" onClick={() => onRejeitar(pedido.id)}>
                                Rejeitar
                            </button>
                            <button type="button" className="btn btn-approve" onClick={() => onAprovar(pedido.id)}>
                                Aprovar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
