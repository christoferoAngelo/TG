import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
    const { usuarioLogado, logout, atualizarUsuario } = useAuth();

    // Estados dos Modais e Carregamento
    const [modalAberto, setModalAberto] = useState(null);
    const [carregando, setCarregando] = useState(false);

    // --- NOVOS ESTADOS PARA OS PERFIS ---
    const [perfilLocador, setPerfilLocador] = useState(null);
    const [perfilLocatario, setPerfilLocatario] = useState(null);

    // Consulta na API se o usuário já tem conta de Locador ou Locatário criada
    useEffect(() => {
        if (usuarioLogado?.id) {
            // Busca Perfil de Locador
            fetch(`http://localhost:8080/api/locadores/usuario/${usuarioLogado.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setPerfilLocador(data))
                .catch(() => setPerfilLocador(null));

            // Busca Perfil de Locatário (ajuste a URL para a sua rota de locatários)
            fetch(`http://localhost:8080/api/locatarios/usuario/${usuarioLogado.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setPerfilLocatario(data))
                .catch(() => setPerfilLocatario(null));
        }
    }, [usuarioLogado]);

    // Estados dos Formulários
    const [formLocador, setFormLocador] = useState({ documento: "", nomeFantasia: "" });
    const [formLocatario, setFormLocatario] = useState({ 
    cpf: "", 
    telefone: usuarioLogado?.telefone || "" 
    });
    const [formEndereco, setFormEndereco] = useState({
        cep: usuarioLogado?.endereco?.cep || "",
        logradouro: usuarioLogado?.endereco?.logradouro || "",
        numero: usuarioLogado?.endereco?.numero || "",
        complemento: usuarioLogado?.endereco?.complemento || "",
        bairro: usuarioLogado?.endereco?.bairro || "",
        cidade: usuarioLogado?.endereco?.cidade || "",
        estado: usuarioLogado?.endereco?.estado || ""
    });

    // 1º REGRA: AGORA CHECA SE REALMENTE EXISTE UMA CONTA DE LOCADOR OU LOCATÁRIO
    const temDocumento = Boolean(perfilLocador || perfilLocatario);
    
    const temTelefone = Boolean(usuarioLogado?.telefone && usuarioLogado.telefone.trim() !== "");
    const temEndereco = Boolean(usuarioLogado?.endereco && usuarioLogado.endereco.cep);

    const contaCompleta = temDocumento && temTelefone && temEndereco;
    // --- MÉTODOS DE AÇÃO DO BACKEND ---

    // Cadastrar / Virar Locatário
    const handleSalvarLocatario = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            // 1. Salva ou atualiza o telefone do usuário na entidade Usuario
            if (formLocatario.telefone !== usuarioLogado?.telefone) {
                await fetch(`http://localhost:8080/api/users/${usuarioLogado.id}/telefone`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ telefone: formLocatario.telefone })
                });
            }

            // 2. Cria o perfil de Locatário (CPF)
            const response = await fetch("http://localhost:8080/api/locatarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documento: formLocatario.cpf,
                    usuarioId: usuarioLogado.id
                })
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao cadastrar perfil de locatário.");
            }

            const novoPerfil = await response.json();
            setPerfilLocatario(novoPerfil); // Atualiza o perfil na tela imediatamente

            // 3. Exibe a mensagem de sucesso solicitada
            alert("Conta de locatário criada com sucesso!");
            
            setModalAberto(null);
            if (atualizarUsuario) await atualizarUsuario(); // Atualiza o contexto do usuário
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    // Cadastrar / Virar Locador (Opção 2)
    const handleSalvarLocador = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            const response = await fetch("http://localhost:8080/api/locadores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documento: formLocador.documento,
                    nomeFantasia: formLocador.nomeFantasia,
                    usuarioId: usuarioLogado.id
                })
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao cadastrar perfil de locador.");
            }

            alert("Perfil de Locador criado com sucesso!");
            setModalAberto(null);
            if (atualizarUsuario) await atualizarUsuario(); // Recarrega os dados do usuário no contexto
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    // Cadastrar Endereço (Opção 3)
    const handleSalvarEndereco = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            // Supondo um endpoint para salvar ou atualizar endereço do usuário
            const response = await fetch(`http://localhost:8080/api/users/${usuarioLogado.id}/endereco`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formEndereco)
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Erro ao salvar endereço.");
            }

            alert("Endereço salvo com sucesso!");
            setModalAberto(null);
            if (atualizarUsuario) await atualizarUsuario();
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    // Busca rápida do CEP via ViaCEP API (Opcional, mas melhora muito a UX)
    const handleBuscarCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormEndereco(prev => ({
                        ...prev,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    return (
        <div className="dashboard">
            <header className="header">
                <h2 className="logo">LocaFesta</h2>
                <div className="user-menu">
                    <span>Olá, <strong>{usuarioLogado?.nome}</strong>!</span>
                    <button onClick={logout} className="logout-btn">Sair</button>
                </div>
            </header>

            <main className="main">
                <h3>Painel do Cliente</h3>
                <p>Seja bem-vindo ao seu painel de locações de espaços para eventos.</p>

                {/* --- CARD 1: STATUS DE VERIFICAÇÃO DA CONTA --- */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">Status do Cadastro</h4>
                        <span className={contaCompleta ? "badge badge-sucesso" : "badge badge-aviso"}>
                            {contaCompleta ? "✓ Conta Verificada" : "⚠ Conta Incompleta"}
                        </span>
                    </div>

                    <div className="status-grid">
                        <div className="status-item">
                            <span>Identificação (CPF/CNPJ):</span>
                            <strong>{temDocumento ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                        <div className="status-item">
                            <span>Telefone de Contato:</span>
                            <strong>{temTelefone ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                        <div className="status-item">
                            <span>Endereço Residencial:</span>
                            <strong>{temEndereco ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: STATUS DE PERFIS E ANÚNCIOS --- */}
                <div className="card">
                    <h4 className="card-title card-title-spaced">Meus Perfis na Plataforma:</h4>

                    {/* Perfil de Locatário */}
                    <div className="perfil-row">
                        <div>
                            <strong className="perfil-title">Perfil de Locatário (Alugar Espaços)</strong>
                            <span className="perfil-desc">
                                {usuarioLogado?.isLocatario ? "Você já pode alugar salões para suas festas." : "Necessário para poder alugar salões."}
                            </span>
                        </div>
                        <div>
                            {usuarioLogado?.isLocatario ? (
                                <span className="badge badge-ativo">Ativo</span>
                            ) : (
                                <button onClick={() => setModalAberto('locatario')} className="btn btn-acao">
                                    Completar Cadastro (CPF)
                                </button>
                            )}
                        </div>
                    </div>

                    <hr className="divisor" />

                    {/* Perfil de Locador */}
                    <div className="perfil-row">
                        <div>
                            <strong className="perfil-title">Perfil de Locador (Anunciar Festas)</strong>
                            <span className="perfil-desc">
                                {usuarioLogado?.isLocador ? "Você é um anunciante parceiro do LocaFesta!" : "Ganhe dinheiro alugando seu espaço ou salão."}
                            </span>
                        </div>
                        <div>
                            {usuarioLogado?.isLocador ? (
                                <span className="badge badge-locador">Anunciante Ativo</span>
                            ) : (
                                <button onClick={() => setModalAberto('locador')} className="btn btn-destaque">
                                    Quero Anunciar Meu Espaço
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CARD 3: DADOS PESSOAIS E ENDEREÇO --- */}
                <div className="card">
                    <div className="card-header card-header-spaced">
                        <h4 className="card-title">Seus Dados Cadastrais:</h4>
                        <button onClick={() => setModalAberto('endereco')} className="btn-link">
                            {temEndereco ? "Editar Endereço" : "+ Adicionar Endereço"}
                        </button>
                    </div>

                    <p className="data-line"><strong>ID Interno:</strong> {usuarioLogado?.id}</p>
                    <p className="data-line"><strong>E-mail:</strong> {usuarioLogado?.email}</p>
                    <p className="data-line"><strong>Telefone:</strong> {usuarioLogado?.telefone || "Não informado"}</p>
                    
                    <hr className="divisor" />
                    
                    <strong className="section-subtitle">Endereço Principal:</strong>
                    {temEndereco ? (
                        <p className="data-line">
                            {usuarioLogado.endereco.logradouro}, Nº {usuarioLogado.endereco.numero} 
                            {usuarioLogado.endereco.complemento ? ` (${usuarioLogado.endereco.complemento})` : ""} - 
                            {usuarioLogado.endereco.bairro}, {usuarioLogado.endereco.cidade}/{usuarioLogado.endereco.estado} - CEP: {usuarioLogado.endereco.cep}
                        </p>
                    ) : (
                        <p className="data-line data-line-empty">
                            Nenhum endereço residencial cadastrado.
                        </p>
                    )}
                </div>
            </main>

            {/* ==================== MODAIS ==================== */}

            {/* MODAL 1: CADASTRAR LOCADOR */}
            {modalAberto === 'locador' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Tornar-se um Anunciante (Locador)</h3>
                        <p className="modal-desc">Informe os dados para disponibilizar seus espaços para locação.</p>

                        <form onSubmit={handleSalvarLocador}>
                            <div className="input-group">
                                <label>CPF ou CNPJ do Anunciante:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                                    value={formLocador.documento}
                                    onChange={(e) => setFormLocador({ ...formLocador, documento: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Nome Fantasia / Nome do Espaço:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Espaço Festa & Cia"
                                    value={formLocador.nomeFantasia}
                                    onChange={(e) => setFormLocador({ ...formLocador, nomeFantasia: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setModalAberto(null)} className="btn btn-cancelar">Cancelar</button>
                                <button type="submit" disabled={carregando} className="btn btn-destaque">
                                    {carregando ? "Salvando..." : "Confirmar e Anunciar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: CADASTRAR ENDEREÇO */}
            {modalAberto === 'endereco' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Endereço Residencial</h3>
                        <p className="modal-desc">Seu endereço é utilizado para indicar opções de festa mais próximas.</p>

                        <form onSubmit={handleSalvarEndereco}>
                            <div className="input-group">
                                <label>CEP:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="00000-000"
                                    value={formEndereco.cep}
                                    onChange={(e) => {
                                        setFormEndereco({ ...formEndereco, cep: e.target.value });
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
                                        value={formEndereco.logradouro}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, logradouro: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-1">
                                    <label>Número:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.numero}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Complemento (Opcional):</label>
                                <input
                                    type="text"
                                    placeholder="Apto, Bloco..."
                                    value={formEndereco.complemento}
                                    onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group flex-2">
                                    <label>Bairro:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.bairro}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, bairro: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group flex-2">
                                    <label>Cidade:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.cidade}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, cidade: e.target.value })}
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
                                        value={formEndereco.estado}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, estado: e.target.value.toUpperCase() })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setModalAberto(null)} className="btn btn-cancelar">Cancelar</button>
                                <button type="submit" disabled={carregando} className="btn btn-destaque">
                                    {carregando ? "Guardando..." : "Salvar Endereço"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: CADASTRAR LOCATÁRIO */}
            {modalAberto === 'locatario' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Completar Cadastro de Locatário</h3>
                        <p className="modal-desc">Informe seu CPF e telefone de contato para poder alugar espaços e salões na plataforma.</p>

                        <form onSubmit={handleSalvarLocatario}>
                            <div className="input-group">
                                <label>CPF:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="000.000.000-00"
                                    value={formLocatario.cpf}
                                    onChange={(e) => setFormLocatario({ ...formLocatario, cpf: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Telefone / WhatsApp:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="(00) 00000-0000"
                                    value={formLocatario.telefone}
                                    onChange={(e) => setFormLocatario({ ...formLocatario, telefone: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setModalAberto(null)} className="btn btn-cancelar">Cancelar</button>
                                <button type="submit" disabled={carregando} className="btn btn-destaque">
                                    {carregando ? "Salvando..." : "Concluir Cadastro"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}