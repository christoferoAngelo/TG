import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cliente/Dashboard.css"; // Lembre-se de adicionar o novo CSS lá no final deste arquivo!

export default function Home() {
    const navigate = useNavigate();
    
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        fetch("http://localhost:8080/api/locadores/espacos/todos")
            .then((res) => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then((data) => setEspacos(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Erro ao buscar espaços:", err))
            .finally(() => setCarregando(false));
    }, []);

    const formatarEndereco = (endereco) => {
        if (!endereco) return "Endereço não informado";
        if (typeof endereco === "string") return endereco;
        return `${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`; 
    };

    return (
        <div className="dashboard">
            <header className="header">
                <h2 className="logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                    LocaFesta
                </h2>
                <div className="user-menu">
                    <button onClick={() => navigate("/login")} className="btn btn-destaque">
                        Entrar / Cadastrar
                    </button>
                </div>
            </header>

            <main className="main">
                <div className="home-hero">
                    <h3>Encontre o espaço perfeito para o seu evento</h3>
                    <p>Explore salões, chácaras e espaços disponíveis.</p>
                </div>

                <h4 className="section-title">Espaços em Destaque</h4>

                <div className="espacos-lista">
                    {carregando ? (
                        <p className="data-line">Carregando espaços disponíveis...</p>
                    ) : espacos.length === 0 ? (
                        <p className="data-line data-line-empty" style={{ textAlign: "center", padding: "40px" }}>
                            Nenhum espaço disponível no momento.
                        </p>
                    ) : (
                        espacos.map((espaco, index) => (
                            <div key={espaco.id || index} className="espaco-card">
                                
                                {/* Lado Esquerdo: Informações do Espaço */}
                                <div className="espaco-info">
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
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}