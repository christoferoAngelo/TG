import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    applyActionCode,
    confirmPasswordReset,
    verifyPasswordResetCode
} from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
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

function mensagemLinkInvalido(error) {
    if (error?.code === "auth/expired-action-code") {
        return "Este link expirou. Peça um novo e-mail na tela de login.";
    }
    if (error?.code === "auth/invalid-action-code") {
        return "Este link é inválido ou já foi usado. Peça um novo e-mail na tela de login.";
    }
    return "Não foi possível validar este link. Peça um novo e-mail na tela de login.";
}

export default function RedefinirSenha() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    const [etapa, setEtapa] = useState("carregando");
    const [emailConta, setEmailConta] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erro, setErro] = useState(null);
    const [salvando, setSalvando] = useState(false);

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

        if (erro.campo !== "link") {
            document.getElementById(erro.campo)?.focus({ preventScroll: true });
        }
    }, [erro]);

    useEffect(() => {
        let ativo = true;

        async function prepararLink() {
            if (!oobCode) {
                mostrarErro("link", "Este link é inválido. Peça um novo e-mail na tela de login.");
                setEtapa("erro");
                return;
            }

            try {
                if (mode === "verifyEmail" || mode === "recoverEmail") {
                    await applyActionCode(auth, oobCode);
                    if (ativo) {
                        setEtapa(mode === "verifyEmail" ? "emailConfirmado" : "emailRecuperado");
                    }
                    return;
                }

                if (mode && mode !== "resetPassword") {
                    mostrarErro("link", "Este link não pode ser aberto por aqui.");
                    setEtapa("erro");
                    return;
                }

                const email = await verifyPasswordResetCode(auth, oobCode);
                if (!ativo) return;
                setEmailConta(email);
                setEtapa("formulario");
            } catch (error) {
                console.error(error);
                if (!ativo) return;
                mostrarErro("link", mensagemLinkInvalido(error));
                setEtapa("erro");
            }
        }

        prepararLink();
        return () => {
            ativo = false;
        };
    }, [mode, oobCode]);

    const handleSalvar = async (e) => {
        e.preventDefault();
        setErro(null);

        if (senha.length < 6) {
            mostrarErro("reset-senha", "A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarErro("reset-confirmar-senha", "As senhas não coincidem.");
            return;
        }

        setSalvando(true);

        try {
            await confirmPasswordReset(auth, oobCode, senha);
            setSenha("");
            setConfirmarSenha("");
            setEtapa("sucesso");
        } catch (error) {
            console.error(error);
            if (error.code === "auth/weak-password") {
                mostrarErro("reset-senha", "A senha inserida é muito fraca. Digite pelo menos 6 caracteres.");
            } else if (
                error.code === "auth/expired-action-code" ||
                error.code === "auth/invalid-action-code"
            ) {
                mostrarErro("link", mensagemLinkInvalido(error));
                setEtapa("erro");
            } else {
                mostrarErro("reset-confirmar-senha", "Não foi possível salvar a nova senha.");
            }
        } finally {
            setSalvando(false);
        }
    };

    const titulo =
        etapa === "emailConfirmado"
            ? "E-mail confirmado"
            : etapa === "emailRecuperado"
              ? "E-mail recuperado"
              : etapa === "sucesso"
                ? "Senha atualizada"
                : "Nova senha";

    const subtitulo =
        etapa === "carregando"
            ? "Estamos conferindo se este link ainda vale."
            : etapa === "emailConfirmado"
              ? "Seu e-mail foi confirmado. Você já pode entrar na sua conta."
              : etapa === "emailRecuperado"
                ? "O e-mail da conta foi restaurado. Entre novamente para continuar."
                : etapa === "sucesso"
                  ? "A nova senha foi salva. Entre com ela na próxima vez."
                  : "Digite a nova senha duas vezes para confirmar.";

    return (
        <div className="auth-page">
            <button type="button" className="auth-voltar" onClick={() => navigate("/login")}>
                <img src={iconVoltar} alt="" aria-hidden="true" />
                Voltar para o login
            </button>

            <div className="auth-shell">
                <aside className="auth-marca" aria-hidden="true">
                    <h1 className="auth-marca-nome">LocaFesta</h1>
                    <p className="auth-marca-texto">
                        Crie uma senha nova e confirme digitando de novo, para não salvar um valor
                        diferente do que você quis.
                    </p>
                </aside>

                <div className="auth-painel">
                    <header className="auth-cab">
                        <h2 className="auth-titulo">{titulo}</h2>
                        <p className="auth-subtitulo">{subtitulo}</p>
                    </header>

                    {erro?.campo === "link" && (
                        <div id="erro-link" className="alert-error auth-erro" role="alert">
                            {erro.mensagem}
                        </div>
                    )}

                    {etapa === "carregando" && <p className="auth-subtitulo">Verificando o link…</p>}

                    {etapa === "formulario" && (
                        <form className="auth-form" onSubmit={handleSalvar}>
                            <div className="auth-campo">
                                <label htmlFor="reset-email">E-mail</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className="auth-input auth-input--fixo"
                                    value={emailConta}
                                    readOnly
                                />
                            </div>

                            <div className="auth-campo">
                                <label htmlFor="reset-senha">Nova senha</label>
                                <input
                                    id="reset-senha"
                                    type="password"
                                    className="auth-input"
                                    value={senha}
                                    onChange={alterarCampo("reset-senha", setSenha)}
                                    required
                                    autoComplete="new-password"
                                    aria-invalid={erro?.campo === "reset-senha"}
                                    aria-describedby={erro?.campo === "reset-senha" ? "erro-reset-senha" : undefined}
                                />
                                <ErroDoCampo erro={erro} campo="reset-senha" />
                            </div>

                            <div className="auth-campo">
                                <label htmlFor="reset-confirmar-senha">Confirmar nova senha</label>
                                <input
                                    id="reset-confirmar-senha"
                                    type="password"
                                    className="auth-input"
                                    value={confirmarSenha}
                                    onChange={alterarCampo("reset-confirmar-senha", setConfirmarSenha)}
                                    required
                                    autoComplete="new-password"
                                    aria-invalid={erro?.campo === "reset-confirmar-senha"}
                                    aria-describedby={
                                        erro?.campo === "reset-confirmar-senha"
                                            ? "erro-reset-confirmar-senha"
                                            : undefined
                                    }
                                />
                                <ErroDoCampo erro={erro} campo="reset-confirmar-senha" />
                            </div>

                            <button
                                type="submit"
                                className="auth-btn auth-btn--primario"
                                disabled={salvando}
                            >
                                {salvando ? "Aguarde…" : "Salvar senha"}
                            </button>
                        </form>
                    )}

                    {(etapa === "sucesso" ||
                        etapa === "emailConfirmado" ||
                        etapa === "emailRecuperado" ||
                        etapa === "erro") && (
                        <button
                            type="button"
                            className="auth-btn auth-btn--primario"
                            onClick={() => navigate("/login")}
                        >
                            Ir para o login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
