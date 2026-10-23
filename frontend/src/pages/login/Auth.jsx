import React, { useState } from "react";
import { auth, googleProvider } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import { userService } from "../../config/api";

import { useAuth } from "../../contexts/AuthContext";

import iconVoltar from "../../assets/voltar_icon.png";
import "./Auth.css";

export default function Auth() {
    const { setUsuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [telefone, setTelefone] = useState("");
    const [mensagemErro, setMensagemErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMensagemErro("");
        setCarregando(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const firebaseUser = userCredential.user;

            const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);

            if (perfilLocal) {
                setUsuarioLogado(perfilLocal);
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

    const handleRegister = async (e) => {
        e.preventDefault();
        setMensagemErro("");

        if (senha.length < 6) {
            setMensagemErro("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        setCarregando(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const firebaseUser = userCredential.user;

            const dadosCadastro = {
                firebaseUid: firebaseUser.uid,
                nome: nome,
                email: email,
                telefone: telefone
            };

            const novoUsuarioSalvo = await userService.cadastrarNoBancoLocal(dadosCadastro);

            setUsuarioLogado(novoUsuarioSalvo);
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

    const handleGoogleLogin = async () => {
        setMensagemErro("");
        setCarregando(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;

            let perfilLocal = null;

            try {
                perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
            } catch (err) {
                console.log("Usuário novo do Google detectado. Criando cadastro no MySQL...");
            }

            if (!perfilLocal) {
                const novosDados = {
                    firebaseUid: firebaseUser.uid,
                    nome: firebaseUser.displayName || "Usuário Google",
                    email: firebaseUser.email,
                    telefone: firebaseUser.phoneNumber || ""
                };
                perfilLocal = await userService.cadastrarNoBancoLocal(novosDados);
            }

            setUsuarioLogado(perfilLocal);
        } catch (error) {
            console.error(error);
            setMensagemErro("Falha na autenticação com o Google ou erro ao salvar perfil local.");
        } finally {
            setCarregando(false);
        }
    };

    const alternarModo = () => {
        setMensagemErro("");
        setIsRegistering(!isRegistering);
    };

    return (
        <div className="auth-page">
            <button
                type="button"
                className="auth-voltar"
                onClick={() => navigate("/home")}
            >
                <img src={iconVoltar} alt="" aria-hidden="true" />
                Voltar para a Home
            </button>

            <div className="auth-shell">
                <aside className="auth-marca" aria-hidden="true">
                    <h1 className="auth-marca-nome">LocaFesta</h1>
                    <p className="auth-marca-texto">
                        Encontre salões e espaços para festas, gerencie reservas e anuncie o seu
                        local em um só lugar.
                    </p>
                    <ul className="auth-marca-lista">
                        <li>Busque espaços perto de você</li>
                        <li>Reserve com segurança</li>
                        <li>Anuncie como locador</li>
                    </ul>
                </aside>

                <div className="auth-painel">
                    <header className="auth-cab">
                        <h2 className="auth-titulo">
                            {isRegistering ? "Criar conta" : "Entrar"}
                        </h2>
                        <p className="auth-subtitulo">
                            {isRegistering
                                ? "Preencha seus dados para começar a usar a plataforma."
                                : "Acesse sua conta para reservar espaços e gerenciar anúncios."}
                        </p>
                    </header>

                    {mensagemErro && (
                        <div className="alert-error auth-erro" role="alert">
                            {mensagemErro}
                        </div>
                    )}

                    <form
                        className="auth-form"
                        onSubmit={isRegistering ? handleRegister : handleLogin}
                    >
                        {isRegistering && (
                            <>
                                <div className="auth-campo">
                                    <label htmlFor="auth-nome">Nome completo</label>
                                    <input
                                        id="auth-nome"
                                        type="text"
                                        className="auth-input"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </div>

                                <div className="auth-campo">
                                    <label htmlFor="auth-telefone">Telefone de contato</label>
                                    <input
                                        id="auth-telefone"
                                        type="tel"
                                        className="auth-input"
                                        placeholder="(11) 99999-9999"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        autoComplete="tel"
                                    />
                                </div>
                            </>
                        )}

                        <div className="auth-campo">
                            <label htmlFor="auth-email">E-mail</label>
                            <input
                                id="auth-email"
                                type="email"
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-campo">
                            <label htmlFor="auth-senha">Senha</label>
                            <input
                                id="auth-senha"
                                type="password"
                                className="auth-input"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                                autoComplete={isRegistering ? "new-password" : "current-password"}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className="auth-btn auth-btn--primario"
                        >
                            {carregando
                                ? "Aguarde…"
                                : isRegistering
                                  ? "Cadastrar"
                                  : "Entrar"}
                        </button>
                    </form>

                    <div className="auth-divisor" aria-hidden="true">
                        ou
                    </div>

                    <button
                        type="button"
                        disabled={carregando}
                        className="auth-btn auth-btn--google"
                        onClick={handleGoogleLogin}
                    >
                        <span className="auth-google-g" aria-hidden="true">
                            G
                        </span>
                        Entrar com o Google
                    </button>

                    <p className="auth-rodape">
                        {isRegistering ? "Já possui uma conta?" : "Ainda não tem conta?"}{" "}
                        <button type="button" className="auth-link" onClick={alternarModo}>
                            {isRegistering ? "Fazer login" : "Cadastre-se"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
