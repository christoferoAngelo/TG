import React, { useEffect, useState } from "react";
import { auth, googleProvider } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail
} from "firebase/auth";
import { userService } from "../../config/api";
import { mascararTelefone } from "../../services/documentos";

import { useAuth } from "../../contexts/AuthContext";

import iconVoltar from "../../assets/voltar_icon.png";
import "./Auth.css";

function ErroDoCampo({ erro, campo }) {
    if (erro?.campo !== campo) return null;

    return (
        <p id={`erro-${campo}`} className="auth-campo-erro" role="alert">
            {erro.mensagem}
        </p>
    );
}

export default function Auth() {
    const { setUsuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [telefone, setTelefone] = useState("");
    const [erro, setErro] = useState(null);
    const [mensagemSucesso, setMensagemSucesso] = useState("");
    const [aguardandoVerificacao, setAguardandoVerificacao] = useState(false);
    const [carregando, setCarregando] = useState(false);

    const limparAvisos = () => {
        setErro(null);
        setMensagemSucesso("");
        setAguardandoVerificacao(false);
    };

    const mostrarErro = (campo, mensagem) => {
        setErro({ campo, mensagem });
    };

    const alterarCampo = (campo, definirValor) => (evento) => {
        definirValor(evento.target.value);
        setErro((atual) => (atual?.campo === campo ? null : atual));
    };

    useEffect(() => {
        if (!erro) return;

        const aviso = document.getElementById(`erro-${erro.campo}`);
        if (!aviso) return;

        const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        aviso.scrollIntoView({
            behavior: reduzirMovimento ? "auto" : "smooth",
            block: "center"
        });
        document.getElementById(erro.campo)?.focus({ preventScroll: true });
    }, [erro]);

    const mensagemFalhaEnvio = (error) => {
        if (error.code === "auth/too-many-requests") {
            return "Muitas tentativas de envio. Espere um pouco e tente de novo.";
        }
        return "Não foi possível enviar o e-mail de verificação.";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        limparAvisos();
        setCarregando(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const firebaseUser = userCredential.user;
            await firebaseUser.reload();

            if (!firebaseUser.emailVerified) {
                setAguardandoVerificacao(true);
                mostrarErro(
                    "auth-email",
                    "Confirme seu e-mail antes de entrar. Se o link não chegou, reenvie abaixo."
                );
                return;
            }

            const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);

            if (perfilLocal) {
                setUsuarioLogado(perfilLocal);
            } else {
                mostrarErro(
                    "auth-email",
                    "Sua conta do Firebase existe, mas não encontramos seu perfil no banco local."
                );
            }
        } catch (error) {
            console.error(error);
            mostrarErro("auth-senha", "Credenciais inválidas ou erro de conexão.");
        } finally {
            setCarregando(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        limparAvisos();

        if (senha.length < 6) {
            mostrarErro("auth-senha", "A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarErro("auth-confirmar-senha", "As senhas não coincidem.");
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

            await userService.cadastrarNoBancoLocal(dadosCadastro);

            try {
                await sendEmailVerification(firebaseUser);
            } catch (erroEnvio) {
                console.error(erroEnvio);
                setAguardandoVerificacao(true);
                mostrarErro("auth-email", mensagemFalhaEnvio(erroEnvio));
                return;
            }

            setSenha("");
            setConfirmarSenha("");
            setIsRegistering(false);
            setAguardandoVerificacao(true);
            setMensagemSucesso(
                `Conta criada. Enviamos um link de verificação para ${email}. Confirme o e-mail antes de entrar.`
            );
        } catch (error) {
            console.error(error);
            if (error.code === "auth/weak-password") {
                mostrarErro("auth-senha", "A senha inserida é muito fraca. Digite pelo menos 6 caracteres.");
            } else if (error.code === "auth/email-already-in-use") {
                mostrarErro("auth-email", "Este e-mail já está cadastrado.");
            } else {
                mostrarErro("auth-email", error.message || "Ocorreu um erro ao criar a sua conta.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const handleGoogleLogin = async () => {
        limparAvisos();
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
            mostrarErro("auth-google", "Falha na autenticação com o Google ou erro ao salvar perfil local.");
        } finally {
            setCarregando(false);
        }
    };

    const reenviarEmailVerificacao = async () => {
        setErro(null);
        setMensagemSucesso("");
        setCarregando(true);

        try {
            const usuario = auth.currentUser;

            if (!usuario) {
                mostrarErro("auth-email", "Entre com seu e-mail e senha para reenviar o link.");
                return;
            }

            await sendEmailVerification(usuario);
            setAguardandoVerificacao(true);
            setMensagemSucesso(`Enviamos outro link de verificação para ${usuario.email}.`);
        } catch (error) {
            console.error(error);
            mostrarErro("auth-email", mensagemFalhaEnvio(error));
        } finally {
            setCarregando(false);
        }
    };

    const handleEsqueciSenha = async () => {
        limparAvisos();

        const emailInformado = email.trim();

        if (!emailInformado) {
            mostrarErro("auth-email", "Digite seu e-mail para receber o link de redefinição.");
            return;
        }

        setCarregando(true);

        try {
            await sendPasswordResetEmail(auth, emailInformado);
            setMensagemSucesso(
                "Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha."
            );
        } catch (error) {
            console.error(error);
            if (error.code === "auth/invalid-email") {
                mostrarErro("auth-email", "Digite um e-mail válido.");
            } else if (error.code === "auth/too-many-requests") {
                mostrarErro("auth-email", "Muitas tentativas de envio. Espere um pouco e tente de novo.");
            } else if (error.code === "auth/user-not-found") {
                setMensagemSucesso(
                    "Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha."
                );
            } else {
                mostrarErro("auth-email", "Não foi possível enviar o e-mail de redefinição.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const alternarModo = () => {
        limparAvisos();
        setConfirmarSenha("");
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

                    {mensagemSucesso && (
                        <div className="alert-success auth-sucesso" role="status">
                            {mensagemSucesso}
                        </div>
                    )}

                    {aguardandoVerificacao && erro?.campo !== "auth-email" && (
                        <button
                            type="button"
                            className="auth-link auth-reenviar"
                            onClick={reenviarEmailVerificacao}
                            disabled={carregando}
                        >
                            Reenviar e-mail de verificação
                        </button>
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
                                        onChange={alterarCampo("auth-nome", setNome)}
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
                                        onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        maxLength={15}
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
                                onChange={alterarCampo("auth-email", setEmail)}
                                required
                                autoComplete="email"
                                aria-invalid={erro?.campo === "auth-email"}
                                aria-describedby={erro?.campo === "auth-email" ? "erro-auth-email" : undefined}
                            />
                            <ErroDoCampo erro={erro} campo="auth-email" />
                            {aguardandoVerificacao && erro?.campo === "auth-email" && (
                                <button
                                    type="button"
                                    className="auth-link auth-reenviar"
                                    onClick={reenviarEmailVerificacao}
                                    disabled={carregando}
                                >
                                    Reenviar e-mail de verificação
                                </button>
                            )}
                        </div>

                        <div className="auth-campo">
                            <label htmlFor="auth-senha">Senha</label>
                            <input
                                id="auth-senha"
                                type="password"
                                className="auth-input"
                                value={senha}
                                onChange={alterarCampo("auth-senha", setSenha)}
                                required
                                autoComplete={isRegistering ? "new-password" : "current-password"}
                                aria-invalid={erro?.campo === "auth-senha"}
                                aria-describedby={erro?.campo === "auth-senha" ? "erro-auth-senha" : undefined}
                            />
                            <ErroDoCampo erro={erro} campo="auth-senha" />
                            {!isRegistering && (
                                <button
                                    type="button"
                                    className="auth-link auth-esqueci"
                                    onClick={handleEsqueciSenha}
                                    disabled={carregando}
                                >
                                    Esqueci minha senha
                                </button>
                            )}
                        </div>

                        {isRegistering && (
                            <div className="auth-campo">
                                <label htmlFor="auth-confirmar-senha">Confirmar senha</label>
                                <input
                                    id="auth-confirmar-senha"
                                    type="password"
                                    className="auth-input"
                                    value={confirmarSenha}
                                    onChange={alterarCampo("auth-confirmar-senha", setConfirmarSenha)}
                                    required
                                    autoComplete="new-password"
                                    aria-invalid={erro?.campo === "auth-confirmar-senha"}
                                    aria-describedby={
                                        erro?.campo === "auth-confirmar-senha"
                                            ? "erro-auth-confirmar-senha"
                                            : undefined
                                    }
                                />
                                <ErroDoCampo erro={erro} campo="auth-confirmar-senha" />
                            </div>
                        )}

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
                        id="auth-google"
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
                    <ErroDoCampo erro={erro} campo="auth-google" />

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
