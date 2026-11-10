import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EMAIL_SUPORTE, rotuloVersaoTermo } from "../../components/apresentacao/termos";
import {
    registrarAceiteTermos,
    termoService,
} from "../../services/termoService";
import "../../components/apresentacao/TermosModal.css";
import "./AceitarTermos.css";

function chegouAoFim(el) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
}

/**
 * Rota dedicada: bloqueia o restante da conta até aceitar a versão vigente.
 * Query: ?tipo=LOCADOR|LOCATARIO|AMBOS  e  ?voltar=/caminho
 */
export default function AceitarTermos() {
    const { usuarioLogado, logout, verificarTermosPendentes } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tipoParam = (params.get("tipo") || "").toUpperCase();
    const voltar = params.get("voltar") || location.state?.from || "/home";

    const [termos, setTermos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [lido, setLido] = useState(false);
    const [aceito, setAceito] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const caixaRef = useRef(null);

    useEffect(() => {
        let cancelado = false;
        const carregar = async () => {
            setCarregando(true);
            setErro(null);
            setLido(false);
            setAceito(false);
            try {
                let lista = [];
                if (tipoParam === "LOCADOR" || tipoParam === "LOCATARIO") {
                    lista = [await termoService.vigente(tipoParam)];
                } else if (tipoParam === "AMBOS") {
                    lista = [
                        await termoService.vigente("LOCATARIO"),
                        await termoService.vigente("LOCADOR"),
                    ];
                } else {
                    const pend = await termoService.pendente();
                    lista = pend?.termosPendentes?.length
                        ? pend.termosPendentes
                        : [await termoService.vigente("LOCATARIO")];
                }
                if (!cancelado) setTermos(lista.filter(Boolean));
            } catch (e) {
                console.error(e);
                if (!cancelado) setErro(e.message || "Não foi possível carregar os Termos.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        };
        carregar();
        return () => {
            cancelado = true;
        };
    }, [tipoParam]);

    useEffect(() => {
        const el = caixaRef.current;
        if (el && chegouAoFim(el)) setLido(true);
    }, [termos, carregando]);

    const termoPrincipal = termos[0] || null;

    const sairSemAceitar = async () => {
        if (usuarioLogado) {
            await logout();
        }
        navigate("/home", { replace: true });
    };

    const confirmar = async () => {
        if (!aceito || !lido || !termos.length) return;
        setEnviando(true);
        setErro(null);
        try {
            const ids = termos.map((t) => t.id).filter(Boolean);
            await registrarAceiteTermos(ids);
            await verificarTermosPendentes?.();
            navigate(voltar, { replace: true });
        } catch (e) {
            console.error(e);
            setErro(e.message || "Não foi possível registrar o aceite.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="aceitar-termos-page">
            <div className="termos-caixa aceitar-termos-caixa" role="main">
                <header className="termos-topo">
                    <div>
                        <h1 id="aceitar-termos-titulo" className="aceitar-termos-titulo">
                            Termos de Uso e Política de Privacidade
                        </h1>
                        {termoPrincipal && (
                            <p className="termos-versao">{rotuloVersaoTermo(termoPrincipal)}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="termos-fechar"
                        onClick={sairSemAceitar}
                        aria-label="Voltar à página inicial"
                        title="Voltar à página inicial"
                    >
                        ×
                    </button>
                </header>

                <p className="aceitar-termos-aviso">
                    Para continuar, aceite a versão atual dos Termos de Uso.
                </p>

                <div
                    className="termos-rola"
                    tabIndex={0}
                    ref={caixaRef}
                    onScroll={(e) => {
                        if (chegouAoFim(e.currentTarget)) setLido(true);
                    }}
                >
                    {carregando && <p>Carregando termos…</p>}
                    {erro && <p className="termos-erro">{erro}</p>}
                    {!carregando && !erro && termoPrincipal && (
                        <>
                            {termoPrincipal.titulo && (
                                <h2 className="termos-subtitulo">{termoPrincipal.titulo}</h2>
                            )}
                            <pre className="termos-texto">{termoPrincipal.conteudo}</pre>
                            {termos.length > 1 && (
                                <p className="aceitar-termos-meta">
                                    Este aceite vale também para a audiência{" "}
                                    {termos
                                        .slice(1)
                                        .map((t) => t.tipo)
                                        .join(", ")}{" "}
                                    (mesma versão vigente).
                                </p>
                            )}
                            <p>E-mail suporte: {EMAIL_SUPORTE}</p>
                            <p>Equipe LocaFesta</p>
                        </>
                    )}
                </div>

                {!lido && !carregando && !erro && (
                    <small className="aceitar-termos-dica">
                        Role o texto até o final para habilitar o aceite.
                    </small>
                )}

                <label className={`termos-aceite${lido ? "" : " termos-aceite--bloqueado"}`}>
                    <input
                        type="checkbox"
                        checked={aceito}
                        disabled={!lido || carregando || !!erro || !termoPrincipal}
                        onChange={(e) => setAceito(e.target.checked)}
                    />
                    <span>Li e concordo com os Termos de Uso e Política de Privacidade.</span>
                </label>

                <button
                    type="button"
                    className="termos-confirmar"
                    disabled={!aceito || !lido || enviando || carregando || !!erro || !termoPrincipal}
                    onClick={confirmar}
                >
                    {enviando ? "Registrando…" : "Aceitar e continuar"}
                </button>
            </div>
        </div>
    );
}
