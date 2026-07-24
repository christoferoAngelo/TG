import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard/Dashboard.css";

export default function DashboardLocador() {
    const { usuarioLogado, logout } = useAuth();
    const navigate = useNavigate();

    // Estados
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);

    // Estado do formulário com o endereço estruturado como objeto
    const [formEspaco, setFormEspaco] = useState({
        nome: "",
        descricao: "",
        capacidade: "",
        precoDiaria: "",
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

    // Busca os espaços/anúncios do locador logado
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

    // Função auxiliar para atualizar os campos internos do objeto de endereço
    const handleEnderecoChange = (campo, valor) => {
        setFormEspaco((prev) => ({
            ...prev,
            endereco: {
                ...prev.endereco,
                [campo]: valor
            }
        }));
    };

    // Busca rápida do CEP via ViaCEP API
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

    // Cadastrar novo espaço/anúncio
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
            
            // Reseta o formulário mantendo a estrutura do objeto endereço
            setFormEspaco({
                nome: "",
                descricao: "",
                capacidade: "",
                precoDiaria: "",
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

    // Formata a exibição do endereço na listagem (previne erros se houver dados antigos em formato texto)
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
                    <button onClick={() => navigate("/dashboard")} className="btn btn-cancelar" style={{ marginRight: "10px" }}>
                        Voltar ao Painel
                    </button>
                    <button onClick={logout} className="logout-btn">Sair</button>
                </div>
            </header>

            <main className="main">
                <div style={{ display: "flex", justify: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
                                        <strong className="perfil-title">{espaco.nome}</strong>
                                        <span className="perfil-desc" style={{ display: "block", marginTop: "4px" }}>
                                            <strong>Endereço:</strong> {formatarEndereco(espaco.endereco)} <br />
                                            Capacidade: {espaco.capacidade} pessoas | Diária: R$ {espaco.precoDiaria}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="badge badge-ativo">Publicado</span>
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
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <h3>Anunciar Novo Espaço</h3>
                        <p className="modal-desc">Preencha as informações básicas e o endereço do seu espaço para eventos.</p>

                        <form onSubmit={handleSalvarEspaco}>
                            <div className="input-group">
                                <label>Nome do Espaço / Salão:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Salão de Festas Recanto"
                                    value={formEspaco.nome}
                                    onChange={(e) => setFormEspaco({ ...formEspaco, nome: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Descrição Rápida:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Espaço amplo com piscina e churrasqueira"
                                    value={formEspaco.descricao}
                                    onChange={(e) => setFormEspaco({ ...formEspaco, descricao: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-1">
                                    <label>Capacidade (Pessoas):</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="100"
                                        value={formEspaco.capacidade}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, capacidade: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>Preço Diária (R$):</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        placeholder="800,00"
                                        value={formEspaco.precoDiaria}
                                        onChange={(e) => setFormEspaco({ ...formEspaco, precoDiaria: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <hr className="divisor" style={{ margin: "15px 0" }} />
                            <h4 style={{ marginBottom: "10px", color: "#333", fontSize: "1rem" }}>Localização do Espaço</h4>

                            {/* CAMPOS DO OBJETO ENDEREÇO */}
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