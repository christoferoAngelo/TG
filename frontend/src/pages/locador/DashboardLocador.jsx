import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../dashboard/Dashboard.css"; // Seu CSS unificado

// Importe os novos componentes que acabamos de criar
import Header from "../../components/locador/Header";
import ResumoAnuncios from "../../components/locador/ResumoAnuncios";
import EspacoItem from "../../components/locador/EspacoItem";
import NovoEspacoModal from "../../components/locador/NovoEspacoModal";
import DocumentacaoEspacoModal from "../../components/documento/DocumentacaoEspacoModal";
import CalendarioSolicitacoes from "../../components/locador/CalendarioSolicitacoes";

// As classes de badge já existentes no Dashboard.css usam sufixos em
// português no masculino (aprovado/rejeitado), enquanto o status vem no
// feminino (APROVADA/REJEITADA) — este mapa faz a ponte entre os dois.
const BADGE_POR_STATUS = {
    PENDENTE: "badge-pendente",
    APROVADA: "badge-aprovado",
    REJEITADA: "badge-rejeitado",
};

export default function DashboardLocador() {
    const { usuarioLogado, logout } = useAuth();

    // Estados
    const [espacos, setEspacos] = useState([]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [espacoCriado, setEspacoCriado] = useState(null);
    const [modalDocumentacaoAberto, setModalDocumentacaoAberto] = useState(false);
    // Armazena os pedidos de locação
    const [solicitacoes, setSolicitacoes] = useState([]);
    // Controla se os pedidos aparecem como lista ou como calendário
    const [visualizacaoPedidos, setVisualizacaoPedidos] = useState("lista"); // "lista" | "calendario"

    // Carregar espaços
    // Carregar espaços E solicitações
    useEffect(() => {
        if (usuarioLogado?.id) {
            setCarregando(true);
            
            // Busca Espaços
            fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setEspacos(Array.isArray(data) ? data : []))
                .catch(() => setEspacos([]));

            // Busca Solicitações de Reserva
            fetch("http://localhost:8080/api/reservas/minhas-solicitacoes", {
                headers: { "Usuario-Id": usuarioLogado.id } // Passando o ID no Header conforme seu controller
            })
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setSolicitacoes(Array.isArray(data) ? data : []))
                .catch((err) => console.error("Erro ao buscar solicitações:", err))
                .finally(() => setCarregando(false));
        }
    }, [usuarioLogado]);

    // Carregar características
    useEffect(() => {
        fetch("http://localhost:8080/api/caracteristicas")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setCaracteristicasDisponiveis(Array.isArray(data) ? data : []))
            .catch(() => setCaracteristicasDisponiveis([]));
    }, []);

    // Função de Alternar Status
    const handleAlternarStatus = async (espacoId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos/${espacoId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao atualizar o status do espaço.");
            }

            // Otimistic UI update
            setEspacos(prevEspacos => 
                prevEspacos.map(esp => {
                    if (esp.id === espacoId) {
                        const estaAtivo = esp.ativo === true || esp.ativo === 1;
                        return { ...esp, ativo: !estaAtivo };
                    }
                    return esp;
                })
            );
        } catch (err) {
            console.error(err);
            alert("Erro: " + err.message);
        }
    };

    // Função que recebe os dados prontos do Modal e manda para a API
    const handleSalvarEspaco = async (dadosFormulario) => {
        setCarregando(true);

        try {
            const response = await fetch(
                `http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...dadosFormulario,
                        locadorId: usuarioLogado.id
                    })
                }
            );

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(
                    erro || "Falha ao cadastrar o espaço."
                );
            }

            const novoEspaco = await response.json();

            setEspacos((prev) => [
                ...prev,
                novoEspaco
            ]);

            setModalAberto(false);

            setEspacoCriado(novoEspaco);
            setModalDocumentacaoAberto(true);

            alert(
                "Espaço criado! Agora vamos adicionar a documentação."
            );

        } catch (err) {

            alert("Erro: " + err.message);

        } finally {

            setCarregando(false);
        }
    };

    // NOVAS FUNÇÕES: Aprovar e Rejeitar
    const handleAprovarReserva = async (reservaId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/reservas/${reservaId}/aprovar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id }
            });

            if (!response.ok) throw new Error("Falha ao aprovar reserva.");

            setSolicitacoes(prev => prev.map(req => 
                req.id === reservaId ? { ...req, status: "APROVADA" } : req
            ));
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    const handleRejeitarReserva = async (reservaId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/reservas/${reservaId}/rejeitar`, {
                method: "PATCH",
                headers: { "Usuario-Id": usuarioLogado.id }
            });

            if (!response.ok) throw new Error("Falha ao rejeitar reserva.");

            setSolicitacoes(prev => prev.map(req => 
                req.id === reservaId ? { ...req, status: "REJEITADA" } : req
            ));
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    return (
        <div className="dashboard">
            <Header usuarioLogado={usuarioLogado} logout={logout} />

            <main className="main">
                <div className="main-header">
                    <div>
                        <h3>Painel do Locador</h3>
                        <p>Gerencie seus espaços, salões e acompanhe seus anúncios.</p>
                    </div>
                    <button onClick={() => setModalAberto(true)} className="btn btn-destaque">
                        + Novo Anúncio
                    </button>
                </div>

                <ResumoAnuncios totalEspacos={espacos.length} />

                {/* Pedidos de Locação */}
                <div className="card">
                    <div className="card-header card-header-spaced">
                        <h4 className="card-title">Pedidos de Locação</h4>

                        <div className="segmented-control">
                            <button
                                type="button"
                                className={visualizacaoPedidos === "lista" ? "ativo" : ""}
                                onClick={() => setVisualizacaoPedidos("lista")}
                            >
                                Lista
                            </button>
                            <button
                                type="button"
                                className={visualizacaoPedidos === "calendario" ? "ativo" : ""}
                                onClick={() => setVisualizacaoPedidos("calendario")}
                            >
                                Calendário
                            </button>
                        </div>
                    </div>

                    {solicitacoes.length === 0 && !carregando ? (
                        <p className="data-line data-line-empty">Você ainda não recebeu nenhum pedido de locação.</p>
                    ) : visualizacaoPedidos === "calendario" ? (
                        <CalendarioSolicitacoes
                            solicitacoes={solicitacoes}
                            onAprovar={handleAprovarReserva}
                            onRejeitar={handleRejeitarReserva}
                        />
                    ) : (
                        <div className="pedidos-lista">
                            {solicitacoes.map(req => (
                                <div key={req.id} className="pedido-card">
                                    <div className="pedido-info">
                                        <strong className="pedido-titulo">{req.espaco.titulo}</strong>
                                        <div className="pedido-meta">
                                            <span>{new Date(req.dataEvento).toLocaleDateString('pt-BR')}</span>
                                            <span className="pedido-meta-dot">•</span>
                                            <span>R$ {req.valorTotal.toFixed(2)}</span>
                                        </div>
                                        <span className={`badge ${BADGE_POR_STATUS[req.status] || ""}`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    {req.status === "PENDENTE" && (
                                        <div className="pedido-acoes">
                                            <button className="btn btn-aprovar" onClick={() => handleAprovarReserva(req.id)}>
                                                Aprovar
                                            </button>
                                            <button className="btn btn-rejeitar" onClick={() => handleRejeitarReserva(req.id)}>
                                                Rejeitar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h4 className="card-title card-title-spaced">Meus Espaços Cadastrados</h4>

                    {carregando ? (
                        <p className="estado-info">Carregando seus anúncios...</p>
                    ) : espacos.length === 0 ? (
                        <p className="data-line data-line-empty">
                            Você ainda não possui nenhum espaço cadastrado. Clique em "+ Novo Anúncio" para começar a alugar!
                        </p>
                    ) : (
                        <div className="espacos-lista">
                            {espacos.map((espaco, index) => (
                                <EspacoItem 
                                    key={espaco.id || index}
                                    espaco={espaco}
                                    onAlternarStatus={handleAlternarStatus}
                                    isUltimo={index === espacos.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {modalAberto && (
                <NovoEspacoModal 
                    onClose={() => setModalAberto(false)}
                    onSalvar={handleSalvarEspaco}
                    carregando={carregando}
                    caracteristicasDisponiveis={caracteristicasDisponiveis}
                />
            )}

            {modalDocumentacaoAberto && espacoCriado && (
    <DocumentacaoEspacoModal
        espaco={espacoCriado}
        onClose={() => {
            setModalDocumentacaoAberto(false);
            setEspacoCriado(null);
        }}
        onConcluir={() => {
            setModalDocumentacaoAberto(false);
            setEspacoCriado(null);
        }}
    />
)}
        </div>
    );
}