import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard/Dashboard.css";

export default function DashboardLocador() {
    const { usuarioLogado, logout } = useAuth();
    const navigate = useNavigate();

    // Estados
    const [espacos, setEspacos] = useState([]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);

    // Estado do formulário alinhado com EspacoDTO
    const [formEspaco, setFormEspaco] = useState({
        titulo: "",
        descricao: "",
        valorDiaria: "",
        capacidadePessoas: "",
        restricoesHorario: "",
        horarioFechamento: "",
        caracteristicas: [],
        endereco: {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: ""
        }
    });

    // Busca os espaços do locador logado
    useEffect(() => {
        if (usuarioLogado?.id) {
            setCarregando(true);
            fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => setEspacos(Array.isArray(data) ? data : []))
                .catch(() => setEspacos([]))
                .finally(() => setCarregando(false));
        }
    }, [usuarioLogado]);

    // Busca todas as características cadastradas no sistema para exibir no modal
    useEffect(() => {
        fetch("http://localhost:8080/api/caracteristicas")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setCaracteristicasDisponiveis(Array.isArray(data) ? data : []))
            .catch(() => setCaracteristicasDisponiveis([]));
    }, []);

    // Alternar seleção de características
    const handleToggleCaracteristica = (item) => {
        setFormEspaco((prev) => {
            const jaExiste = prev.caracteristicas.some((c) => c.id === item.id);
            if (jaExiste) {
                return {
                    ...prev,
                    caracteristicas: prev.caracteristicas.filter((c) => c.id !== item.id)
                };
            } else {
                return {
                    ...prev,
                    caracteristicas: [...prev.caracteristicas, item]
                };
            }
        });
    };

    // Função auxiliar para atualizar o endereço
    const handleEnderecoChange = (campo, valor) => {
        setFormEspaco((prev) => ({
            ...prev,
            endereco: {
                ...prev.endereco,
                [campo]: valor
            }
        }));
    };

    // Busca CEP via ViaCEP API
    const handleBuscarCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormEspaco((prev) => ({
                        ...prev,
                        endereco: {
                            ...prev.endereco,
                            logradouro: data.logradouro || "",
                            bairro: data.bairro || "",
                            cidade: data.localidade || "",
                            estado: data.uf || ""
                        }
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    // Cadastrar novo espaço
    const handleSalvarEspaco = async (e) => {
        e.preventDefault();
        setCarregando(true);

        try {
            const response = await fetch(`http://localhost:8080/api/locadores/${usuarioLogado.id}/espacos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formEspaco,
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

            // Reseta o formulário
            setFormEspaco({
                titulo: "",
                descricao: "",
                valorDiaria: "",
                capacidadePessoas: "",
                restricoesHorario: "",
                horarioFechamento: "",
                caracteristicas: [],
                endereco: {
                    cep: "",
                    logradouro: "",
                    numero: "",
                    complemento: "",
                    bairro: "",
                    cidade: "",
                    estado: ""
                }
            });
            setModalAberto(false);
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    // Formata o endereço
    const formatarEndereco = (endereco) => {
        if (!endereco) return "Endereço não informado";
        if (typeof endereco === "string") return endereco;
        return `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` (${endereco.complemento})` : ""} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`;
    };

    return (
        <div className="dashboard">
            <header className="header">
                <h2 className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    LocaFesta - Área do Anunciante
                </h2>
                <div className="user-menu">
                    <span>Olá, <strong>{usuarioLogado?.nome}</strong>!</span>
                    <button onClick={() => navigate("/caracteristicas")} className="btn btn-cancelar" style={{ marginRight: "10px" }}>
                        Gerenciar Características
                    </button>
                    <button onClick={() => navigate("/dashboard")} className="btn btn-cancelar" style={{ marginRight: "10px" }}>
                        Voltar ao Painel
                    </button>
                    <button onClick={logout} className="logout-btn">Sair</button>
                </div>
            </header>

            <main className="main">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h3>Painel do Locador</h3>
                        <p>Gerencie seus espaços, salões e acompanhe seus anúncios.</p>
                    </div>
                    <button onClick={() => setModalAberto(true)} className="btn btn-destaque">
                        + Novo Anúncio
                    </button>
                </div>

                {/* --- CARD 1: RESUMO RÁPIDO --- */}
                <div className="card">
                    <h4 className="card-title">Resumo dos Anúncios</h4>
                    <div className="status-grid" style={{ marginTop: "15px" }}>
                        <div className="status-item">
                            <span>Total de Espaços:</span>
                            <strong>{espacos.length}</strong>
                        </div>
                        <div className="status-item">
                            <span>Status da Conta:</span>
                            <strong style={{ color: "green" }}>Ativa</strong>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: LISTA DE ESPAÇOS --- */}
                <div className="card">
                    <h4 className="card-title card-title-spaced">Meus Espaços Cadastrados</h4>

                    {carregando ? (
                        <p className="data-line">Carregando seus anúncios...</p>
                    ) : espacos.length === 0 ? (
                        <p className="data-line data-line-empty">
                            Você ainda não possui nenhum espaço cadastrado. Clique em "+ Novo Anúncio" para começar a alugar!
                        </p>
                    ) : (
                        espacos.map((espaco, index) => (
                            <div key={espaco.id || index} style={{ marginBottom: "15px" }}>
                                <div className="perfil-row">
                                    <div>
                                        <strong className="perfil-title">{espaco.titulo}</strong>
                                        <span className="perfil-desc" style={{ display: "block", marginTop: "4px" }}>
                                            <strong>Endereço:</strong> {formatarEndereco(espaco.endereco)} <br />
                                            Capacidade: {espaco.capacidadePessoas} pessoas | Diária: R$ {espaco.valorDiaria}
                                            {espaco.horarioFechamento && <><br />Fechamento: {espaco.horarioFechamento}</>}
                                        </span>

                                        {/* Exibição das Características Cadastradas */}
                                        {espaco.caracteristicas && espaco.caracteristicas.length > 0 && (
                                            <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                {espaco.caracteristicas.map((carac) => (
                                                    <span
                                                        key={carac.id}
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            backgroundColor: "#e9ecef",
                                                            color: "#495057",
                                                            padding: "2px 8px",
                                                            borderRadius: "12px",
                                                            fontWeight: "500"
                                                        }}
                                                    >
                                                        {carac.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="badge badge-ativo">{espaco.statusAprovacao || "Publicado"}</span>
                                    </div>
                                </div>
                                {index < espacos.length - 1 && <hr className="divisor" />}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* ==================== MODAL: NOVO ESPAÇO ==================== */}
            {modalAberto && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3>Anunciar Novo Espaço</h3>
                        <p className="modal-desc">Preencha as informações do seu espaço para eventos.</p>

                        <form onSubmit={handleSalvarEspaco}>
                            <div className="input-group">
                                <label>Título do Anúncio:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Salão de Festas Recanto"
                                    value={formEspaco.titulo}
                                    onChange={(e) => setFormEspaco({ ...formEspaco, titulo: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Descrição:</label>
                                <textarea
                                    required
                                    placeholder="Ex: Espaço amplo com piscina e churrasqueira"
                                    value={formEspaco.descricao}
                                    onChange={(e) => setFormEspaco({ ...formEspaco, descricao: e.target.value })}
                                    className="input"
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-1">
                                    <label>Capacidade (Pessoas):</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="100"
                                        value={formEspaco.capacidadePessoas}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, capacidadePessoas: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>Valor Diária (R$):</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        placeholder="800.00"
                                        value={formEspaco.valorDiaria}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, valorDiaria: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-1">
                                    <label>Horário de Fechamento:</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 22:00"
                                        value={formEspaco.horarioFechamento}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, horarioFechamento: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>Restrições de Horário:</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Som alto até as 20h"
                                        value={formEspaco.restricoesHorario}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, restricoesHorario: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* --- SEÇÃO DE CARACTERÍSTICAS DO ESPAÇO --- */}
                            <hr className="divisor" style={{ margin: "15px 0" }} />
                            <h4 style={{ marginBottom: "10px", color: "#333", fontSize: "1rem" }}>Características do Espaço</h4>

                            {caracteristicasDisponiveis.length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                                    Nenhuma característica cadastrada no sistema.
                                </p>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                                    {caracteristicasDisponiveis.map((item) => {
                                        const selecionado = formEspaco.caracteristicas.some((c) => c.id === item.id);
                                        return (
                                            <label
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontSize: "0.9rem",
                                                    cursor: "pointer",
                                                    padding: "6px 10px",
                                                    border: "1px solid",
                                                    borderColor: selecionado ? "#007bff" : "#ccc",
                                                    borderRadius: "6px",
                                                    backgroundColor: selecionado ? "#e7f1ff" : "#fff"
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selecionado}
                                                    onChange={() => handleToggleCaracteristica(item)}
                                                />
                                                {item.nome}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* --- SEÇÃO DE LOCALIZAÇÃO --- */}
                            <hr className="divisor" style={{ margin: "15px 0" }} />
                            <h4 style={{ marginBottom: "10px", color: "#333", fontSize: "1rem" }}>Localização do Espaço</h4>

                            <div className="input-group">
                                <label>CEP:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="00000-000"
                                    value={formEspaco.endereco.cep}
                                    onChange={(e) => {
                                        handleEnderecoChange("cep", e.target.value);
                                        handleBuscarCep(e.target.value);
                                    }}
                                    className="input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-3">
                                    <label>Rua/Avenida:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEspaco.endereco.logradouro}
                                        onChange={(e) => handleEnderecoChange("logradouro", e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>Número:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEspaco.endereco.numero}
                                        onChange={(e) => handleEnderecoChange("numero", e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Complemento (Opcional):</label>
                                <input
                                    type="text"
                                    placeholder="Salão 2, Bloco B..."
                                    value={formEspaco.endereco.complemento}
                                    onChange={(e) => handleEnderecoChange("complemento", e.target.value)}
                                    className="input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-2">
                                    <label>Bairro:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEspaco.endereco.bairro}
                                        onChange={(e) => handleEnderecoChange("bairro", e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-2">
                                    <label>Cidade:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEspaco.endereco.cidade}
                                        onChange={(e) => handleEnderecoChange("cidade", e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>UF:</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={2}
                                        placeholder="SP"
                                        value={formEspaco.endereco.estado}
                                        onChange={(e) => handleEnderecoChange("estado", e.target.value.toUpperCase())}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: "20px" }}>
                                <button type="button" onClick={() => setModalAberto(false)} className="btn btn-cancelar">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={carregando} className="btn btn-destaque">
                                    {carregando ? "Anunciando..." : "Salvar Anúncio"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}