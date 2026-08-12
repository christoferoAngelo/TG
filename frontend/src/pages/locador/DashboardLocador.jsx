import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../dashboard/Dashboard.css"; // Seu CSS unificado

// Importe os novos componentes que acabamos de criar
import Header from "../../components/locador/Header";
import ResumoAnuncios from "../../components/locador/ResumoAnuncios";
import EspacoItem from "../../components/locador/EspacoItem";
import NovoEspacoModal from "../../components/locador/NovoEspacoModal";

export default function DashboardLocador() {
    const { usuarioLogado, logout } = useAuth();

    // Estados
    const [espacos, setEspacos] = useState([]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);

    // Carregar espaços
    useEffect(() => {
        if (usuarioLogado?.id) {
            setCarregando(true);
            fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setEspacos(Array.isArray(data) ? data : []))
                .catch(() => setEspacos([]))
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
            const response = await fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...dadosFormulario,
                    locadorId: usuarioLogado.id
                })
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao cadastrar o espaço.");
            }

            const novoEspaco = await response.json();
            setEspacos((prev) => [...prev, novoEspaco]);
            alert("Espaço anunciado com sucesso!");
            setModalAberto(false);
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
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

                <div className="card">
                    <h4 className="card-title card-title-spaced">Meus Espaços Cadastrados</h4>

                    {carregando ? (
                        <p className="data-line">Carregando seus anúncios...</p>
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
        </div>
    );
}