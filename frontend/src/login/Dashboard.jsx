import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
    const [formLocatario, setFormLocatario] = useState({ cpf: "" });
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
        <div style={styles.dashboard}>
            <header style={styles.header}>
                <h2 style={styles.logo}>LocaFesta</h2>
                <div style={styles.userMenu}>
                    <span>Olá, <strong>{usuarioLogado?.nome}</strong>!</span>
                    <button onClick={logout} style={styles.logoutBtn}>Sair</button>
                </div>
            </header>

            <main style={styles.main}>
                <h3>Painel do Cliente</h3>
                <p>Seja bem-vindo ao seu painel de locações de espaços para eventos.</p>

                {/* --- CARD 1: STATUS DE VERIFICAÇÃO DA CONTA --- */}
                <div style={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, color: "#374151" }}>Status do Cadastro</h4>
                        <span style={contaCompleta ? styles.badgeSucesso : styles.badgeAviso}>
                            {contaCompleta ? "✓ Conta Verificada" : "⚠ Conta Incompleta"}
                        </span>
                    </div>

                    <div style={styles.statusGrid}>
                        <div style={styles.statusItem}>
                            <span>Identificação (CPF/CNPJ):</span>
                            <strong>{temDocumento ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                        <div style={styles.statusItem}>
                            <span>Telefone de Contato:</span>
                            <strong>{temTelefone ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                        <div style={styles.statusItem}>
                            <span>Endereço Residencial:</span>
                            <strong>{temEndereco ? " Cadastrado" : " Pendente"}</strong>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: STATUS DE PERFIS E ANÚNCIOS --- */}
                <div style={styles.card}>
                    <h4 style={{ margin: "0 0 15px 0", color: "#374151" }}>Meus Perfis na Plataforma:</h4>

                    {/* Perfil de Locatário */}
                    <div style={styles.perfilRow}>
                        <div>
                            <strong style={{ display: "block", color: "#1f2937" }}>Perfil de Locatário (Alugar Espaços)</strong>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>
                                {usuarioLogado?.isLocatario ? "Você já pode alugar salões para suas festas." : "Necessário para poder alugar salões."}
                            </span>
                        </div>
                        <div>
                            {usuarioLogado?.isLocatario ? (
                                <span style={styles.badgeAtivo}>Ativo</span>
                            ) : (
                                <button onClick={() => setModalAberto('locatario')} style={styles.btnAcao}>
                                    Completar Cadastro (CPF)
                                </button>
                            )}
                        </div>
                    </div>

                    <hr style={styles.divisor} />

                    {/* Perfil de Locador */}
                    <div style={styles.perfilRow}>
                        <div>
                            <strong style={{ display: "block", color: "#1f2937" }}>Perfil de Locador (Anunciar Festas)</strong>
                            <span style={{ fontSize: "13px", color: "#6b7280" }}>
                                {usuarioLogado?.isLocador ? "Você é um anunciante parceiro do LocaFesta!" : "Ganhe dinheiro alugando seu espaço ou salão."}
                            </span>
                        </div>
                        <div>
                            {usuarioLogado?.isLocador ? (
                                <span style={styles.badgeLocador}>Anunciante Ativo</span>
                            ) : (
                                <button onClick={() => setModalAberto('locador')} style={styles.btnDestaque}>
                                    Quero Anunciar Meu Espaço
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CARD 3: DADOS PESSOAIS E ENDEREÇO --- */}
                <div style={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <h4 style={{ margin: 0, color: "#374151" }}>Seus Dados Cadastrais:</h4>
                        <button onClick={() => setModalAberto('endereco')} style={styles.btnLink}>
                            {temEndereco ? "Editar Endereço" : "+ Adicionar Endereço"}
                        </button>
                    </div>

                    <p style={styles.dataLine}><strong>ID Interno:</strong> {usuarioLogado?.id}</p>
                    <p style={styles.dataLine}><strong>E-mail:</strong> {usuarioLogado?.email}</p>
                    <p style={styles.dataLine}><strong>Telefone:</strong> {usuarioLogado?.telefone || "Não informado"}</p>
                    
                    <hr style={styles.divisor} />
                    
                    <strong style={{ color: "#374151", fontSize: "14px" }}>Endereço Principal:</strong>
                    {temEndereco ? (
                        <p style={styles.dataLine}>
                            {usuarioLogado.endereco.logradouro}, Nº {usuarioLogado.endereco.numero} 
                            {usuarioLogado.endereco.complemento ? ` (${usuarioLogado.endereco.complemento})` : ""} - 
                            {usuarioLogado.endereco.bairro}, {usuarioLogado.endereco.cidade}/{usuarioLogado.endereco.estado} - CEP: {usuarioLogado.endereco.cep}
                        </p>
                    ) : (
                        <p style={{ ...styles.dataLine, color: "#9ca3af", italic: "true" }}>
                            Nenhum endereço residencial cadastrado.
                        </p>
                    )}
                </div>
            </main>

            {/* ==================== MODAIS ==================== */}

            {/* MODAL 1: CADASTRAR LOCADOR */}
            {modalAberto === 'locador' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3>Tornar-se um Anunciante (Locador)</h3>
                        <p style={{ fontSize: "14px", color: "#6b7280" }}>Informe os dados para disponibilizar seus espaços para locação.</p>

                        <form onSubmit={handleSalvarLocador}>
                            <div style={styles.inputGroup}>
                                <label>CPF ou CNPJ do Anunciante:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                                    value={formLocador.documento}
                                    onChange={(e) => setFormLocador({ ...formLocador, documento: e.target.value })}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label>Nome Fantasia / Nome do Espaço:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Espaço Festa & Cia"
                                    value={formLocador.nomeFantasia}
                                    onChange={(e) => setFormLocador({ ...formLocador, nomeFantasia: e.target.value })}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setModalAberto(null)} style={styles.btnCancelar}>Cancelar</button>
                                <button type="submit" disabled={carregando} style={styles.btnDestaque}>
                                    {carregando ? "Salvando..." : "Confirmar e Anunciar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: CADASTRAR ENDEREÇO */}
            {modalAberto === 'endereco' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3>Endereço Residencial</h3>
                        <p style={{ fontSize: "14px", color: "#6b7280" }}>Seu endereço é utilizado para indicar opções de festa mais próximas.</p>

                        <form onSubmit={handleSalvarEndereco}>
                            <div style={styles.inputGroup}>
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
                                    style={styles.input}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ ...styles.inputGroup, flex: 3 }}>
                                    <label>Rua/Avenida:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.logradouro}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, logradouro: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                    <label>Número:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.numero}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.inputGroup}>
                                <label>Complemento (Opcional):</label>
                                <input
                                    type="text"
                                    placeholder="Apto, Bloco..."
                                    value={formEndereco.complemento}
                                    onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })}
                                    style={styles.input}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ ...styles.inputGroup, flex: 2 }}>
                                    <label>Bairro:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.bairro}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, bairro: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                                <div style={{ ...styles.inputGroup, flex: 2 }}>
                                    <label>Cidade:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formEndereco.cidade}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, cidade: e.target.value })}
                                        style={styles.input}
                                    />
                                </div>
                                <div style={{ ...styles.inputGroup, flex: 1 }}>
                                    <label>UF:</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={2}
                                        placeholder="SP"
                                        value={formEndereco.estado}
                                        onChange={(e) => setFormEndereco({ ...formEndereco, estado: e.target.value.toUpperCase() })}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setModalAberto(null)} style={styles.btnCancelar}>Cancelar</button>
                                <button type="submit" disabled={carregando} style={styles.btnDestaque}>
                                    {carregando ? "Guardando..." : "Salvar Endereço"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    dashboard: {
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: "#f3f4f6",
        minHeight: "100vh"
    },
    header: {
        backgroundColor: "#ffffff",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    },
    logo: {
        color: "#4f46e5",
        margin: 0,
        fontSize: "22px"
    },
    userMenu: {
        display: "flex",
        alignItems: "center",
        gap: "15px"
    },
    logoutBtn: {
        backgroundColor: "#ef4444",
        color: "#ffffff",
        border: "none",
        padding: "8px 12px",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "600"
    },
    main: {
        padding: "40px 30px",
        maxWidth: "800px",
        margin: "0 auto"
    },
    card: {
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        marginTop: "15px"
    },
    dataLine: {
        margin: "8px 0",
        fontSize: "14px",
        color: "#4b5563"
    },
    statusGrid: {
        marginTop: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    statusItem: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "#4b5563"
    },
    perfilRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0"
    },
    divisor: {
        border: "none",
        borderTop: "1px solid #e5e7eb",
        margin: "12px 0"
    },
    badgeSucesso: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold"
    },
    badgeAviso: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold"
    },
    badgeAtivo: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold"
    },
    badgeLocador: {
        backgroundColor: "#e0e7ff",
        color: "#3730a3",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold"
    },
    btnAcao: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        padding: "6px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    },
    btnDestaque: {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    },
    btnLink: {
        background: "none",
        border: "none",
        color: "#4f46e5",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    },
    // Estilos do Modal
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: "25px",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
    },
    inputGroup: {
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    input: {
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #d1d5db",
        fontSize: "14px"
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "20px"
    },
    btnCancelar: {
        backgroundColor: "#e5e7eb",
        color: "#374151",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    }
};