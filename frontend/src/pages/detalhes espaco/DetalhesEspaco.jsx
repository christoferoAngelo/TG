import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeaderHome from "../home/components/HeaderHome"; // Importando o Header da Home
import "./DetalhesEspaco.css"; // Nosso novo arquivo de estilos

export default function DetalhesEspaco() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [espaco, setEspaco] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
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

    // Função para caso o usuário use a barra de pesquisa do Header estando nesta tela
    const handlePesquisar = (termo) => {
        // Redireciona para a Home. 
        // Dica: Futuramente você pode passar o 'termo' via rota para a home já abrir filtrada!
        navigate("/home"); 
    };

    if (carregando) {
        return (
            <div className="detalhes-loading">
                <p>Carregando detalhes do espaço...</p>
            </div>
        );
    }

    if (!espaco) {
        return (
            <div className="detalhes-erro">
                <h2>Espaço não encontrado 😢</h2>
                <button onClick={() => navigate(-1)} className="btn-voltar">Voltar para a página anterior</button>
            </div>
        );
    }

    return (
        <div className="detalhes-page">
            {/* O Header foi adicionado aqui no topo! */}
            <HeaderHome onSearch={handlePesquisar} />

            <main className="detalhes-container">
                <button onClick={() => navigate(-1)} className="btn-voltar">
                    ← Voltar
                </button>
                
                <header className="detalhes-header">
                    <h1>{espaco.titulo}</h1>
                    <p className="endereco">
                        📍 {espaco.endereco?.bairro}, {espaco.endereco?.cidade} - {espaco.endereco?.estado}
                    </p>
                </header>

                {/* SEÇÃO DE FOTOS POR AMBIENTE */}
                <section className="detalhes-secao">
                    <h2>Conheça o espaço</h2>
                    
                    {espaco.ambientes && espaco.ambientes.length > 0 ? (
                        <div className="ambientes-lista">
                            {espaco.ambientes.map((ambiente, index) => (
                                <div key={index} className="ambiente-item">
                                    <div className="ambiente-info">
                                        <h3>{ambiente.titulo}</h3>
                                        {ambiente.descricao && <p>{ambiente.descricao}</p>}
                                    </div>

                                    {ambiente.imagensUrls && ambiente.imagensUrls.length > 0 ? (
                                        <div className="galeria-scroll">
                                            {ambiente.imagensUrls.map((imgUrl, i) => (
                                                <img 
                                                    key={i} 
                                                    src={imgUrl} 
                                                    alt={`${ambiente.titulo} - foto ${i + 1}`} 
                                                    className="img-ambiente"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="sem-fotos">Sem fotos para este cômodo.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="sem-fotos">Nenhuma foto cadastrada para este espaço.</p>
                    )}
                </section>

                {/* SEÇÃO DE INFORMAÇÕES GERAIS */}
                <section className="detalhes-secao">
                    <h2>Detalhes Gerais</h2>
                    <p className="descricao-geral">{espaco.descricao}</p>
                    
                    <div className="cards-info">
                        <div className="card-info">
                            <strong>👥 Capacidade</strong>
                            <span>Até {espaco.capacidadePessoas} pessoas</span>
                        </div>
                        <div className="card-info">
                            <strong>💰 Diária</strong>
                            <span>R$ {Number(espaco.valorDiaria).toFixed(2)}</span>
                        </div>
                        <div className="card-info">
                            <strong>🕒 Horário Limite</strong>
                            <span>{espaco.horarioFechamento || "Não informado"}</span>
                        </div>
                    </div>

                    {espaco.restricoesHorario && (
                        <div className="aviso-restricoes">
                            <strong>⚠️ Regras/Restrições:</strong> {espaco.restricoesHorario}
                        </div>
                    )}
                </section>

                {/* CARACTERÍSTICAS */}
                {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                    <section className="detalhes-secao">
                        <h2>O que o espaço oferece</h2>
                        <div className="tags-container">
                            {espaco.caracteristicas.map((c) => (
                                <span key={c.id} className="tag">{c.nome}</span>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}