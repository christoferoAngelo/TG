import { useEffect, useState } from "react";
import { EMAIL_SUPORTE, rotuloVersaoTermo } from "./termos";
import { termoService } from "../../services/termoService";
import "./TermosModal.css";

/**
 * Modal de aceite. Conteúdo vem da API (texto puro, sem HTML).
 * @param {string} tipoAudiencia LOCATARIO (cadastro) ou LOCADOR
 * @param {object[]|null} termosForcados lista já carregada (ex.: pendentes)
 */
export default function TermosModal({
    aberto,
    onAceitar,
    onFechar,
    tipoAudiencia = "LOCATARIO",
    termosForcados = null,
    titulo = "Termos de Uso e Política de Privacidade",
    textoConfirmar = "Aceitar e continuar",
}) {
    const [aceito, setAceito] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);
    const [termos, setTermos] = useState([]);

    useEffect(() => {
        if (!aberto) {
            setAceito(false);
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
                // Cadastro: carrega LOCATARIO + LOCADOR (mesmo texto na v1; IDs distintos).
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
    }, [aberto, tipoAudiencia, termosForcados]);

    if (!aberto) return null;

    const termoPrincipal = termos[0] || null;

    const confirmar = () => {
        const ids = termos.map((t) => t.id).filter(Boolean);
        onAceitar?.(ids, termos);
    };

    return (
        <div className="termos-fundo" role="presentation" onMouseDown={onFechar}>
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
                    <button type="button" className="termos-fechar" onClick={onFechar} aria-label="Fechar">
                        ×
                    </button>
                </header>
                <div className="termos-rola" tabIndex={0}>
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
                <label className="termos-aceite">
                    <input
                        type="checkbox"
                        checked={aceito}
                        disabled={carregando || !!erro || !termoPrincipal}
                        onChange={(evento) => setAceito(evento.target.checked)}
                    />
                    <span>Li e concordo com os Termos de Uso e Política de Privacidade.</span>
                </label>
                <button
                    type="button"
                    className="termos-confirmar"
                    disabled={!aceito || carregando || !!erro || !termoPrincipal}
                    onClick={confirmar}
                >
                    {textoConfirmar}
                </button>
            </div>
        </div>
    );
}
