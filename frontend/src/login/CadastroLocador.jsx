import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CadastroLocador() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [documento, setDocumento] = useState("");
    const [nomeFantasia, setNomeFantasia] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        // Montando o DTO esperado pelo Spring Boot
        const payload = {
            documento: documento.replace(/\D/g, ""), // Remove pontuações
            nomeFantasia: nomeFantasia,
            usuarioId: usuarioLogado?.id,
        };

        try {
            const response = await fetch("http://localhost:8080/api/locadores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": `Bearer ${token}` // Se estiver usando JWT do Firebase
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || "Erro ao processar cadastro.");
            }

            alert("Perfil de Locador criado com sucesso!");
            
            // Opcional: Atualizar o contexto do usuário aqui para isLocador = true
            
            navigate("/dashboard"); // Volta pro painel
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.titulo}>Torne-se um Anunciante</h2>
                <p style={styles.subtitulo}>
                    Preencha os dados abaixo para começar a alugar seus espaços no LocaFesta.
                </p>

                {erro && <div style={styles.erroBox}>{erro}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>CPF ou CNPJ *</label>
                        <input
                            type="text"
                            required
                            maxLength="18"
                            placeholder="Apenas números"
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Nome Fantasia da Propriedade / Empresa</label>
                        <input
                            type="text"
                            maxLength="150"
                            placeholder="Ex: Chácara Recanto Feliz (Opcional)"
                            value={nomeFantasia}
                            onChange={(e) => setNomeFantasia(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.botoes}>
                        <button 
                            type="button" 
                            onClick={() => navigate("/dashboard")} 
                            style={styles.btnCancelar}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={styles.btnSalvar}
                        >
                            {loading ? "Salvando..." : "Confirmar Cadastro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
    },
    card: {
        backgroundColor: "#ffffff",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        width: "100%",
        maxWidth: "500px"
    },
    titulo: {
        color: "#1f2937",
        margin: "0 0 10px 0",
        fontSize: "24px"
    },
    subtitulo: {
        color: "#6b7280",
        fontSize: "14px",
        marginBottom: "25px"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#374151"
    },
    input: {
        padding: "10px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
        outline: "none"
    },
    erroBox: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        padding: "10px",
        borderRadius: "6px",
        fontSize: "14px",
        marginBottom: "15px",
        border: "1px solid #f87171"
    },
    botoes: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "10px"
    },
    btnCancelar: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        padding: "10px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600"
    },
    btnSalvar: {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        border: "none",
        padding: "10px 16px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600"
    }
};