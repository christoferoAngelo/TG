import { useEffect, useRef, useState } from "react";
import { EMAIL_SUPORTE, rotuloVersaoTermo } from "./termos";
import { termoService } from "../../services/termoService";
import "./TermosModal.css";

function chegouAoFim(el) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
}

/**
 * Modal de aceite. Conteúdo vem da API (texto puro, sem HTML).
 * O × / fundo não “pula” o aceite: chama onRecusar (voltar à home / sair).
 */
export default function TermosModal({
    aberto,
    onAceitar,
    onFechar,
    onRecusar,
    tipoAudiencia = "LOCATARIO",
    termosForcados = null,
    titulo = "Termos de Uso e Política de Privacidade",
    textoConfirmar = "Aceitar e continuar",
    exigirLeitura = true,
    /** Só consulta (rodapé Legal): sem checkbox de aceite. */
    somenteLeitura = false,
}) {
    const [aceito, setAceito] = useState(false);
    const [lido, setLido] = useState(!exigirLeitura || somenteLeitura);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);
    const [termos, setTermos] = useState([]);
    const caixaRef = useRef(null);

    const recusar = onRecusar || onFechar;
    const consulta = Boolean(somenteLeitura);

    useEffect(() => {
        if (!aberto) {
            setAceito(false);
            setLido(!exigirLeitura || somenteLeitura);
            setErro(null);
            return;
        }

        let cancelado = false;

        const carregar = async () => {
            if (Array.isArray(termosForcados) && termosForcados.length) {
                setTermos(termosForcados);
                return;
            }
            setCarregando(true);
            setErro(null);
            try {
                const tipos =
                    tipoAudiencia === "AMBOS"
                        ? ["LOCATARIO", "LOCADOR"]
                        : [tipoAudiencia];
                const lista = [];
                for (const tipo of tipos) {
                    const vigente = await termoService.vigente(tipo);
                    if (vigente) lista.push(vigente);
                }
                if (!cancelado) setTermos(lista);
            } catch (e) {
                console.error(e);
                if (!cancelado) {
                    setErro("Não foi possível carregar os Termos. Tente novamente.");
                    setTermos([]);
                }
            } finally {
                if (!cancelado) setCarregando(false);
            }
        };

        carregar();
        return () => {
            cancelado = true;
        };
    }, [aberto, tipoAudiencia, termosForcados, exigirLeitura]);

    useEffect(() => {
        const el = caixaRef.current;
        if (el && exigirLeitura && chegouAoFim(el)) setLido(true);
    }, [termos, carregando, aberto, exigirLeitura]);

    if (!aberto) return null;

    const termoPrincipal = termos[0] || null;

    const confirmar = () => {
        const ids = termos.map((t) => t.id).filter(Boolean);
        onAceitar?.(ids, termos);
    };

    return (
        <div className="termos-fundo" role="presentation" onMouseDown={recusar}>
            <div
                className="termos-caixa"
                role="dialog"
                aria-modal="true"
                aria-labelledby="termos-titulo"
                onMouseDown={(evento) => evento.stopPropagation()}
            >
                <header className="termos-topo">
                    <div>
                        <h2 id="termos-titulo">{titulo}</h2>
                        {termoPrincipal && (
                            <p className="termos-versao">{rotuloVersaoTermo(termoPrincipal)}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="termos-fechar"
                        onClick={recusar}
                        aria-label={consulta ? "Fechar" : "Voltar sem aceitar"}
                        title={consulta ? "Fechar" : "Voltar sem aceitar"}
                    >
                        ×
                    </button>
                </header>
                <div
                    className="termos-rola"
                    tabIndex={0}
                    ref={caixaRef}
                    onScroll={(e) => {
                        if (!consulta && exigirLeitura && chegouAoFim(e.currentTarget)) setLido(true);
                    }}
                >
                    {carregando && <p>Carregando termos…</p>}
                    {erro && <p className="termos-erro">{erro}</p>}
                    {!carregando && !erro && termoPrincipal && (
                        <>
                            {termoPrincipal.titulo && (
                                <h3 className="termos-subtitulo">{termoPrincipal.titulo}</h3>
                            )}
                            <pre className="termos-texto">{termoPrincipal.conteudo}</pre>
                            <p>E-mail suporte: {EMAIL_SUPORTE}</p>
                            <p>Equipe LocaFesta</p>
                        </>
                    )}
                </div>
                {consulta ? (
                    <button type="button" className="termos-confirmar" onClick={recusar}>
                        Fechar
                    </button>
                ) : (
                    <>
                        {exigirLeitura && !lido && !carregando && !erro && (
                            <small className="aceitar-termos-dica" style={{ marginTop: 8 }}>
                                Role o texto até o final para habilitar o aceite.
                            </small>
                        )}
                        <label className={`termos-aceite${lido ? "" : " termos-aceite--bloqueado"}`}>
                            <input
                                type="checkbox"
                                checked={aceito}
                                disabled={!lido || carregando || !!erro || !termoPrincipal}
                                onChange={(evento) => setAceito(evento.target.checked)}
                            />
                            <span>Li e concordo com os Termos de Uso e Política de Privacidade.</span>
                        </label>
                        <button
                            type="button"
                            className="termos-confirmar"
                            disabled={!aceito || !lido || carregando || !!erro || !termoPrincipal}
                            onClick={confirmar}
                        >
                            {textoConfirmar}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
