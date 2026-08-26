import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeaderHome from "../home/components/HeaderHome"; // Importando o Header da Home
import "./DetalhesEspaco.css"; // Nosso novo arquivo de estilos



import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho do seu AuthContext

export default function DetalhesEspaco() {
    const { id } = useParams();
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();
    
    const [espaco, setEspaco] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Função para caso o usuário use a barra de pesquisa...
    const handlePesquisar = (termo) => {
        navigate("/home"); 
    };

    const [modalAberto, setModalAberto] = useState(false);
    // Dados do formulário de reserva
    const [dataEvento, setDataEvento] = useState('');
    const [observacao, setObservacao] = useState('');
    const [enviando, setEnviando] = useState(false);


    const handleSolicitarReserva = () => {
    // Abre o modal na própria página
    setModalAberto(true);
    };

    const handleAbrirModal = () => {
        setModalAberto(true);
    };

    const handleFecharModal = () => {
        setModalAberto(false);
        setDataEvento('');
        setObservacao('');
    };

    const handleConfirmarReserva = async (e) => {
        e.preventDefault();
        setEnviando(true);

        try {
            const response = await fetch('http://localhost:8080/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Usuario-Id': usuarioLogado.id
                },
                body: JSON.stringify({
                    espacoId: id,
                    dataEvento: dataEvento,
                    observacao: observacao,
                    valorTotal: espaco.valorDiaria                })
            });

            if (!response.ok) {
                const erroMsg = await response.text();
                throw new Error(erroMsg || "Erro ao solicitar reserva");
            }

            alert("Solicitação enviada com sucesso! O locador responderá em breve.");
            handleFecharModal();
        } catch (error) {
            console.error("Erro:", error);
            alert(`Falha ao reservar: ${error.message}`);
        } finally {
            setEnviando(false);
        }
    };

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

                    {/* NOVO BOTÃO DE RESERVA AQUI */}
                    <button onClick={handleSolicitarReserva} className="btn-reservar">
                        📅 Solicitar Reserva
                    </button>
                    
                    {/* MODAL DE RESERVA */}
                    {modalAberto && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Reservar {espaco?.titulo}</h2>
                                
                                <form onSubmit={handleConfirmarReserva}>
                                    <div className="form-group">
                                        <label>Data do Evento:</label>
                                        <input 
                                            type="date" 
                                            required 
                                            value={dataEvento}
                                            onChange={(e) => setDataEvento(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Observações / Tipo de Evento:</label>
                                        <textarea 
                                            rows="3"
                                            placeholder="Ex: Aniversário para 50 pessoas..."
                                            value={observacao}
                                            onChange={(e) => setObservacao(e.target.value)}
                                        />
                                    </div>

                                    <div className="modal-acoes">
                                        <button type="button" className="btn-cancelar" onClick={handleFecharModal}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn-confirmar" disabled={enviando}>
                                            {enviando ? "Enviando..." : "Confirmar Solicitação"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

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