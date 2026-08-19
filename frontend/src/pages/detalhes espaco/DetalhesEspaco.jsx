import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DetalhesEspaco() {
    const { id } = useParams(); // Pega o ID da URL (ex: /espaco/12)
    const navigate = useNavigate();
    
    const [espaco, setEspaco] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // ATENÇÃO: Ajuste a URL abaixo para o endpoint correto do seu backend 
        // que busca um único espaço pelo ID!
        fetch(`http://localhost:8080/api/locadores/espacos/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar o espaço");
                return res.json();
            })
            .then((data) => {
                setEspaco(data);
                setCarregando(false);
            })
            .catch((err) => {
                console.error("Erro:", err);
                setCarregando(false);
            });
    }, [id]);

    if (carregando) {
        return (
            <div style={{ textAlign: "center", padding: "50px", fontSize: "1.2rem" }}>
                Carregando detalhes do espaço...
            </div>
        );
    }

    if (!espaco) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>Espaço não encontrado 😢</h2>
                <button onClick={() => navigate(-1)} className="btn">Voltar</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
            
            {/* Cabeçalho de Navegação e Título */}
            <button onClick={() => navigate(-1)} style={{ marginBottom: "20px", cursor: "pointer", padding: "8px 16px", borderRadius: "4px", border: "1px solid #ccc", background: "#f9f9f9" }}>
                ← Voltar
            </button>
            
            <h1 style={{ fontSize: "2rem", marginBottom: "5px" }}>{espaco.titulo}</h1>
            <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: "30px" }}>
                📍 {espaco.endereco?.bairro}, {espaco.endereco?.cidade} - {espaco.endereco?.estado}
            </p>

            {/* SEÇÃO DE FOTOS POR AMBIENTE */}
            <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Conheça o espaço</h2>
            
            {espaco.ambientes && espaco.ambientes.length > 0 ? (
                <div style={{ marginTop: "20px" }}>
                    {espaco.ambientes.map((ambiente, index) => (
                        <div key={index} style={{ marginBottom: "40px" }}>
                            
                            <h3 style={{ fontSize: "1.3rem", marginBottom: "5px", color: "#333" }}>
                                {ambiente.titulo}
                            </h3>
                            {ambiente.descricao && (
                                <p style={{ color: "#666", marginBottom: "15px", fontSize: "0.95rem" }}>
                                    {ambiente.descricao}
                                </p>
                            )}

                            {/* Galeria com Scroll Horizontal */}
                            {ambiente.imagensUrls && ambiente.imagensUrls.length > 0 ? (
                                <div style={{ display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "10px" }}>
                                    {ambiente.imagensUrls.map((imgUrl, i) => (
                                        <img 
                                            key={i} 
                                            src={imgUrl} 
                                            alt={`${ambiente.titulo} - foto ${i + 1}`} 
                                            style={{ 
                                                width: "300px", 
                                                height: "200px", 
                                                objectFit: "cover", 
                                                borderRadius: "10px",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                flexShrink: 0 // Evita que a imagem encolha
                                            }} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: "#999", fontStyle: "italic" }}>Sem fotos para este cômodo.</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p>Nenhuma foto cadastrada para este espaço.</p>
            )}

            {/* SEÇÃO DE INFORMAÇÕES GERAIS */}
            <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginTop: "40px" }}>Detalhes Gerais</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.6", marginTop: "15px" }}>{espaco.descricao}</p>
            
            <div style={{ display: "flex", gap: "40px", marginTop: "30px", backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
                <div>
                    <strong>Capacidade:</strong> Até {espaco.capacidadePessoas} pessoas
                </div>
                <div>
                    <strong>Diária:</strong> R$ {Number(espaco.valorDiaria).toFixed(2)}
                </div>
                <div>
                    <strong>Horário Limite:</strong> {espaco.horarioFechamento || "Não informado"}
                </div>
            </div>

            {espaco.restricoesHorario && (
                <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "5px" }}>
                    <strong>Regras/Restrições:</strong> {espaco.restricoesHorario}
                </div>
            )}

            {/* Características */}
            {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                <div style={{ marginTop: "30px" }}>
                    <h3>O que o espaço oferece</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "15px" }}>
                        {espaco.caracteristicas.map((c) => (
                            <span key={c.id} style={{ background: "#e9ecef", padding: "8px 15px", borderRadius: "20px", fontSize: "0.9rem" }}>
                                {c.nome}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
        </div>
    );
}