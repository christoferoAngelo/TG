import React from "react";

export default function EspacoItem({ espaco, onAlternarStatus, isUltimo }) {
    const isRejeitado = espaco.statusAprovacao && espaco.statusAprovacao.toUpperCase() === 'REJEITADO';
    const isPendente = espaco.statusAprovacao && espaco.statusAprovacao.toUpperCase() === 'PENDENTE';
    const isAtivo = espaco.ativo === true || espaco.ativo === 1;

    const classBadgeAprovacao = isRejeitado ? "badge-rejeitado" : isPendente ? "badge-pendente" : "badge-aprovado";
    const classBadgeAtivo = isAtivo ? "badge-info" : "badge-inativo";
    const classBotaoAtivar = isAtivo ? "btn-status-desativar" : "btn-status-reativar";

    const formatarEndereco = (endereco) => {
        if (!endereco) return "Endereço não informado";
        if (typeof endereco === "string") return endereco;
        return `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` (${endereco.complemento})` : ""} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`;
    };

    return (
        <div className="espaco-item-container mt-15">
            <div className="perfil-row">
                <div>
                    <strong className="perfil-title">{espaco.titulo}</strong>
                    <span className="perfil-desc mt-10" style={{ display: "block" }}>
                        <strong>Endereço:</strong> {formatarEndereco(espaco.endereco)} <br />
                        Capacidade: {espaco.capacidadePessoas} pessoas | Diária: R$ {espaco.valorDiaria}
                        {espaco.horarioFechamento && <><br />Fechamento: {espaco.horarioFechamento}</>}
                    </span>

                    {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                        <div className="header-actions mt-10 flex-wrap">
                            {espaco.caracteristicas.map((carac) => (
                                <span key={carac.id} className="badge-caracteristica">
                                    {carac.nome}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="espaco-actions">
                    <span className={`badge ${classBadgeAprovacao}`}>
                        {espaco.statusAprovacao || "Publicado"}
                    </span>
                    <span className={`badge ${classBadgeAtivo}`}>
                        {isAtivo ? "Ativo" : "Inativo"}
                    </span>
                    <button 
                        onClick={() => onAlternarStatus(espaco.id)}
                        className={`btn ${classBotaoAtivar}`}
                    >
                        {isAtivo ? "Desativar" : "Reativar"}
                    </button>
                </div>
            </div>

            {isRejeitado && espaco.motivoRejeicao && (
                <div className="rejeicao-box">
                    <strong>Motivo da Rejeição:</strong> {espaco.motivoRejeicao}
                </div>
            )}

            {!isUltimo && <hr className="divisor mt-15" />}
        </div>
    );
}