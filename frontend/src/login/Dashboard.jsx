import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
    const { usuarioLogado, logout } = useAuth();

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
                
                <div style={styles.card}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#374151" }}>Seus Dados (Sincronizados com MySQL):</h4>
                    <p style={styles.dataLine}><strong>ID Interno:</strong> {usuarioLogado?.id}</p>
                    <p style={styles.dataLine}><strong>E-mail de Acesso:</strong> {usuarioLogado?.email}</p>
                    <p style={styles.dataLine}><strong>Telefone Cadastrado:</strong> {usuarioLogado?.telefone || "Não informado"}</p>
                    <p style={styles.dataLine}><strong>Status do Perfil:</strong> {usuarioLogado?.statusConta}</p>
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
    }
};