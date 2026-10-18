import React from "react";

const statusDe = (s) => (s || "").toUpperCase();

// O LocalTime pode chegar como "18:00:00" ou como [18, 0]
const formatarHora = (v) => {
    if (!v) return "";
    if (Array.isArray(v)) {
        return `${String(v[0]).padStart(2, "0")}:${String(v[1] ?? 0).padStart(2, "0")}`;
    }
    return String(v).slice(0, 5);
};

const formatarMoeda = (v) =>
    Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatarEndereco = (endereco) => {
    if (!endereco) return "Endereço não informado";
    if (typeof endereco === "string") return endereco;
    return `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` (${endereco.complemento})` : ""} · ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`;
};

const APROVACAO = {
    APROVADO: { texto: "Aprovado", tom: "ok" },
    PENDENTE: { texto: "Em análise", tom: "warn" },
    REJEITADO: { texto: "Rejeitado", tom: "danger" },
};

export default function EspacoItem({ espaco, onAlternarStatus, onEditar }) {
    const status = statusDe(espaco.statusAprovacao);
    const aprovacao = APROVACAO[status] || { texto: espaco.statusAprovacao || "Publicado", tom: "muted" };
    const isRejeitado = status === "REJEITADO";
    const isAtivo = espaco.ativo === true || espaco.ativo === 1;

    const abre = formatarHora(espaco.horarioAbertura);
    const fecha = formatarHora(espaco.horarioFechamento);
    const viraNoite = Boolean(abre && fecha && fecha <= abre);
    const horario = fecha
        ? abre
            ? `${abre} – ${fecha}${viraNoite ? " (+1 dia)" : ""}`
            : `Fecha às ${fecha}`
        : "—";

    return (
        <article className={`lc-espaco lc-espaco--${aprovacao.tom}${isAtivo ? "" : " lc-espaco--inativo"}`}>
            <div className="lc-espaco-top">
                <h3 className="lc-espaco-titulo">{espaco.titulo}</h3>
                <div className="lc-badges">
                    <span className={`lc-badge lc-badge--${aprovacao.tom}`}>{aprovacao.texto}</span>
                    <span className={`lc-badge ${isAtivo ? "lc-badge--ok" : "lc-badge--muted"}`}>
                        {isAtivo ? "Ativo" : "Inativo"}
                    </span>
                </div>
            </div>

            <p className="lc-espaco-end">{formatarEndereco(espaco.endereco)}</p>

            <ul className="lc-fatos">
                <li className="lc-fato">
                    <span className="lc-fato-label">Capacidade</span>
                    <span className="lc-fato-valor">{espaco.capacidadePessoas} pessoas</span>
                </li>
                <li className="lc-fato">
                    <span className="lc-fato-label">Diária</span>
                    <span className="lc-fato-valor">{formatarMoeda(espaco.valorDiaria)}</span>
                </li>
                <li className="lc-fato">
                    <span className="lc-fato-label">Funcionamento</span>
                    <span className="lc-fato-valor">{horario}</span>
                </li>
            </ul>

            {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                <div className="lc-chips">
                    {espaco.caracteristicas.map((carac) => (
                        <span key={carac.id} className="lc-chip">
                            {carac.nome}
                        </span>
                    ))}
                </div>
            )}

            {isRejeitado && espaco.motivoRejeicao && (
                <p className="lc-rejeicao">
                    <strong>Motivo da rejeição:</strong> {espaco.motivoRejeicao}
                </p>
            )}

            <div className="lc-espaco-acoes">
                <button
                    type="button"
                    className={`lc-btn ${isAtivo ? "lc-btn--danger-ghost" : "lc-btn--success"}`}
                    onClick={() => onAlternarStatus(espaco.id)}
                >
                    {isAtivo ? "Desativar" : "Reativar"}
                </button>
                {onEditar && (
                    <button
                        type="button"
                        className="lc-btn lc-btn--primary"
                        onClick={() => onEditar(espaco.id)}
                    >
                        {isRejeitado ? "Editar e reenviar" : "Editar"}
                    </button>
                )}
            </div>
        </article>
    );
}
