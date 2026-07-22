import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { usuarioLogado, logout } = useAuth();
    const navigate = useNavigate();

    // Funções placeholder para quando o usuário clicar nos botões de virar locador/locatário
    // Mais pra frente, você vai trocar isso para abrir um modal ou ir para uma tela de cadastro de CPF/CNPJ
    const handleVirarLocatario = () => {
        alert("Em breve: Aqui vamos abrir o modal para o usuário digitar o CPF e virar um Locatário!");
    };

    const handleVirarLocador = () => {
        navigate("/cadastro-locador");
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
                
                {/* --- NOVO CARD: STATUS DE PERFIS E ANÚNCIOS --- */}
                <div style={styles.card}>
                    <h4 style={{ margin: "0 0 15px 0", color: "#374151" }}>Meus Perfis na Plataforma:</h4>
                    
                    {/* Perfil de Locatário (Quem aluga) */}
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
                                <button onClick={handleVirarLocatario} style={styles.btnAcao}>
                                    Completar Cadastro (CPF)
                                </button>
                            )}
                        </div>
                    </div>

                    <hr style={styles.divisor} />

                    {/* Perfil de Locador (Quem anuncia salões) */}
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
                                <button onClick={handleVirarLocador} style={styles.btnDestaque}>
                                    Quero Anunciar Meu Espaço
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CARD ANTIGO: DADOS DO USUÁRIO --- */}
                <div style={styles.card}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#374151" }}>Seus Dados (Sincronizados com MySQL):</h4>
                    <p style={styles.dataLine}><strong>ID Interno:</strong> {usuarioLogado?.id}</p>
                    <p style={styles.dataLine}><strong>E-mail de Acesso:</strong> {usuarioLogado?.email}</p>
                    <p style={styles.dataLine}><strong>Telefone Cadastrado:</strong> {usuarioLogado?.telefone || "Não informado"}</p>
                    {/* Exibindo o status dinamicamente se o campo existir, ou o default */}
                    <p style={styles.dataLine}><strong>Status da Conta:</strong> {usuarioLogado?.statusConta || "ATIVO"}</p>
                </div>
            </main>
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
    
    // --- NOVOS ESTILOS PARA OS PERFIS ---
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
        fontWeight: "600",
        transition: "background 0.2s"
    },
    btnDestaque: {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        border: "none",
        padding: "6px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        transition: "background 0.2s"
    }
};