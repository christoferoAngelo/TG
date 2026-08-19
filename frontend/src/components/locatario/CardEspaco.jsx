import React from "react";
import { useNavigate } from "react-router-dom";

export function CardEspaco({ espaco }) {
    const navigate = useNavigate();

    const formatarEndereco = (endereco) => {
        if (!endereco) return "Endereço não informado";
        if (typeof endereco === "string") return endereco;
        return `${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`; 
    };

    // Lógica para pegar a PRIMEIRA foto do PRIMEIRO ambiente que tiver imagens cadastradas
    let urlCapa = null;
    if (espaco.ambientes && espaco.ambientes.length > 0) {
        for (const ambiente of espaco.ambientes) {
            if (ambiente.imagensUrls && ambiente.imagensUrls.length > 0) {
                urlCapa = ambiente.imagensUrls[0];
                break; // Achou uma foto, para de procurar
            }
        }
    }

    return (
        <div className="espaco-card" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            
            {/* NOVO: Seção da Imagem de Capa */}
            <div className="espaco-imagem-capa" style={{ width: "250px", flexShrink: 0 }}>
                {urlCapa ? (
                    <img 
                        src={urlCapa} 
                        alt={`Capa do espaço ${espaco.titulo}`} 
                        style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "200px", backgroundColor: "#e9ecef", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", color: "#6c757d", fontSize: "0.9rem" }}>
                        Sem foto
                    </div>
                )}
            </div>

            {/* Lado Esquerdo: Informações do Espaço */}
            <div className="espaco-info" style={{ flex: 1 }}>
                <h4 className="espaco-titulo">{espaco.titulo}</h4>
                <p className="espaco-descricao">{espaco.descricao}</p>
                
                <div className="espaco-detalhes">
                    <p><strong>Local:</strong> {formatarEndereco(espaco.endereco)}</p>
                    <p><strong>Capacidade:</strong> até {espaco.capacidadePessoas} pessoas</p>
                    {espaco.restricoesHorario && (
                        <p className="aviso-restricao">
                            <strong>Aviso:</strong> {espaco.restricoesHorario}
                        </p>
                    )}
                </div>

                {/* Características / Tags */}
                {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                    <div className="espaco-tags">
                        {espaco.caracteristicas.map((carac) => (
                            <span key={carac.id} className="tag-caracteristica">
                                {carac.nome}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Lado Direito: Preço e Botão */}
            <div className="espaco-acao">
                <div className="espaco-preco-box">
                    <span className="preco-label">Diária a partir de</span>
                    <strong className="preco-valor">
                        R$ {Number(espaco.valorDiaria).toFixed(2)}
                    </strong>
                </div>
                <button 
                    className="btn btn-destaque btn-block" 
                    onClick={() => navigate(`/espaco/${espaco.id}`)}
                >
                    Ver Detalhes
                </button>
            </div>
        </div>
    );
}