import React, { useState } from "react";
import { auth, googleProvider } from "../config/firebaseConfig"; // Ajuste o caminho conforme sua pasta
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup 
} from "firebase/auth";
import { userService } from "../config/api";
import { useAuth } from "../contexts/AuthContext"; // 1. Importamos o Hook de Autenticação global

/**
 * Componente unificado de Autenticação (Login / Registro).
 * Utiliza o Firebase para segurança e registra os dados no MySQL local do LocaFesta.
 */
export default function Auth() { // Retirada a prop onLoginSuccess
    const { setUsuarioLogado } = useAuth(); // 2. Consumimos a função para atualizar o usuário globalmente
    const [isRegistering, setIsRegistering] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [telefone, setTelefone] = useState("");
    const [mensagemErro, setMensagemErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    // Função de Login (Email e Senha)
    const handleLogin = async (e) => {
        e.preventDefault();
        setMensagemErro("");
        setCarregando(true);

        try {
            // 1. Autentica no Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const firebaseUser = userCredential.user;

            // 2. Busca o perfil no MySQL usando o UID do Firebase
            const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
            
            if (perfilLocal) {
                setUsuarioLogado(perfilLocal); // 3. Atualiza o estado global
            } else {
                setMensagemErro("Sua conta do Firebase existe, mas não encontramos seu perfil no banco local.");
            }
        } catch (error) {
            console.error(error);
            setMensagemErro("Credenciais inválidas ou erro de conexão.");
        } finally {
            setCarregando(false);
        }
    };

    // Função de Registro de Novo Usuário (Email e Senha)
    const handleRegister = async (e) => {
        e.preventDefault();
        setMensagemErro("");

        // Validação preventiva de tamanho de senha para evitar o erro do Firebase
        if (senha.length < 6) {
            setMensagemErro("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        setCarregando(true);

        try {
            // 1. Cria o usuário na base do Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const firebaseUser = userCredential.user;

            // 2. Prepara os dados para persistência local
            const dadosCadastro = {
                firebaseUid: firebaseUser.uid,
                nome: nome,
                email: email,
                telefone: telefone
            };

            // 3. Salva no banco MySQL através do Spring Boot
            const novoUsuarioSalvo = await userService.cadastrarNoBancoLocal(dadosCadastro);
            
            setUsuarioLogado(novoUsuarioSalvo); // 4. Atualiza o estado global
        } catch (error) {
            console.error(error);
            if (error.code === "auth/weak-password") {
                setMensagemErro("A senha inserida é muito fraca. Digite pelo menos 6 caracteres.");
            } else if (error.code === "auth/email-already-in-use") {
                setMensagemErro("Este e-mail já está cadastrado.");
            } else {
                setMensagemErro(error.message || "Ocorreu um erro ao criar a sua conta.");
            }
        } finally {
            setCarregando(false);
        }
    };

    // Login com Conta Google
    const handleGoogleLogin = async () => {
        setMensagemErro("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            let perfilLocal = null;
            
            try {
                // Verifica se o usuário do Google já existe no MySQL
                perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
            } catch (err) {
                // Se der 404, significa que ele realmente não existe no banco local ainda. 
                // Continuamos o fluxo sem quebrar a aplicação para criar o perfil abaixo.
                console.log("Usuário novo do Google detectado. Criando cadastro no MySQL...");
            }

            // Se for o primeiro acesso dele, criamos o perfil no MySQL
            if (!perfilLocal) {
                const novosDados = {
                    firebaseUid: firebaseUser.uid,
                    nome: firebaseUser.displayName || "Usuário Google",
                    email: firebaseUser.email,
                    telefone: firebaseUser.phoneNumber || ""
                };
                perfilLocal = await userService.cadastrarNoBancoLocal(novosDados);
            }

            setUsuarioLogado(perfilLocal); // 5. Atualiza o estado global
        } catch (error) {
            console.error(error);
            setMensagemErro("Falha na autenticação com o Google ou erro ao salvar perfil local.");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>LocaFesta</h2>
                <p style={styles.subtitle}>
                    {isRegistering ? "Crie sua conta para começar" : "Acesse sua conta de eventos"}
                </p>

                {mensagemErro && <div style={styles.errorAlert}>{mensagemErro}</div>}

                <form onSubmit={isRegistering ? handleRegister : handleLogin} style={styles.form}>
                    {isRegistering && (
                        <>
                            <label style={styles.label}>Nome Completo</label>
                            <input 
                                type="text" 
                                style={styles.input} 
                                value={nome} 
                                onChange={(e) => setNome(e.target.value)} 
                                required 
                            />

                            <label style={styles.label}>Telefone de Contato</label>
                            <input 
                                type="tel" 
                                placeholder="(11) 99999-9999"
                                style={styles.input} 
                                value={telefone} 
                                onChange={(e) => setTelefone(e.target.value)} 
                            />
                        </>
                    )}

                    <label style={styles.label}>E-mail</label>
                    <input 
                        type="email" 
                        style={styles.input} 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />

                    <label style={styles.label}>Senha</label>
                    <input 
                        type="password" 
                        style={styles.input} 
                        value={senha} 
                        onChange={(e) => setSenha(e.target.value)} 
                        required 
                    />

                    <button type="submit" disabled={carregando} style={styles.submitBtn}>
                        {carregando ? "Aguarde..." : (isRegistering ? "Cadastrar" : "Entrar")}
                    </button>
                </form>

                <div style={styles.divider}>ou</div>

                <button onClick={handleGoogleLogin} style={styles.googleBtn}>
                    Entrar com o Google
                </button>

                <p style={styles.switchText}>
                    {isRegistering ? "Já possui uma conta?" : "Ainda não tem conta?"}{" "}
                    <span 
                        onClick={() => setIsRegistering(!isRegistering)} 
                        style={styles.switchLink}
                    >
                        {isRegistering ? "Fazer Login" : "Cadastre-se"}
                    </span>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    card: {
        background: "#ffffff",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center"
    },
    title: {
        margin: "0 0 5px 0",
        color: "#4f46e5",
        fontSize: "28px",
        fontWeight: "bold"
    },
    subtitle: {
        margin: "0 0 25px 0",
        color: "#6b7280",
        fontSize: "14px"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        textAlign: "left"
    },
    label: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#374151",
        marginBottom: "6px"
    },
    input: {
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid #d1d5db",
        marginBottom: "16px",
        fontSize: "14px",
        outline: "none",
        transition: "border-color 0.2s",
    },
    submitBtn: {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        border: "none",
        padding: "12px",
        borderRadius: "6px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s"
    },
    divider: {
        margin: "20px 0",
        color: "#9ca3af",
        fontSize: "13px",
        position: "relative"
    },
    googleBtn: {
        backgroundColor: "#ffffff",
        color: "#374151",
        border: "1px solid #d1d5db",
        padding: "10px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        width: "100%",
        marginBottom: "20px"
    },
    switchText: {
        fontSize: "13px",
        color: "#4b5563",
        margin: 0
    },
    switchLink: {
        color: "#4f46e5",
        fontWeight: "600",
        cursor: "pointer",
        textDecoration: "underline"
    },
    errorAlert: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        padding: "10px",
        borderRadius: "6px",
        fontSize: "13px",
        marginBottom: "20px",
        textAlign: "left"
    }
};