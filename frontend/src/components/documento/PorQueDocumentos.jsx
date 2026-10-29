import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import "./PorQueDocumentos.css";

/**
 * Texto curto + botão ⓘ que abre a explicação de por que pedimos documentos.
 * variante: "locatario" | "locador" | null
 */
export default function PorQueDocumentos({
    variante = null,
    className = "",
    fraseCurta = "Pedimos seus documentos para proteger você e a outra parte da reserva.",
    botaoTexto = "Saiba por quê",
}) {
    const [aberto, setAberto] = useState(false);
    const tituloId = useId();

    useEffect(() => {
        if (!aberto) return undefined;
        const tecla = (evento) => {
            if (evento.key === "Escape") setAberto(false);
        };
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [aberto]);

    return (
        <div className={`pq-docs ${className}`.trim()}>
            <p className="pq-docs-frase">
                {fraseCurta}{" "}
                <button
                    type="button"
                    className="pq-docs-info"
                    aria-label="Por que pedimos documentos"
                    aria-expanded={aberto}
                    aria-haspopup="dialog"
                    onClick={() => setAberto(true)}
                >
                    {botaoTexto} <span aria-hidden="true">ⓘ</span>
                </button>
            </p>

            {aberto && (
                <div
                    className="pq-docs-modal"
                    role="presentation"
                    onMouseDown={() => setAberto(false)}
                >
                    <div
                        className="pq-docs-caixa"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={tituloId}
                        onMouseDown={(evento) => evento.stopPropagation()}
                    >
                        <header className="pq-docs-topo">
                            <h2 id={tituloId}>Por que pedimos seus documentos?</h2>
                            <button
                                type="button"
                                className="pq-docs-fechar"
                                aria-label="Fechar"
                                onClick={() => setAberto(false)}
                            >
                                ×
                            </button>
                        </header>

                        <div className="pq-docs-corpo">
                            <p className="pq-docs-lead">Para que todos aluguem e anunciem com segurança.</p>
                            <p>
                                No LocaFesta, pessoas que não se conhecem fecham negócios juntas.
                                Conferir quem está do outro lado ajuda a evitar golpes e perfis falsos,
                                e protege você e quem vai alugar ou receber o seu evento.
                            </p>

                            <h3>Documento de identidade (RG, CIN ou CNH, frente e verso)</h3>
                            <p>
                                Confirma que você é quem diz ser. Assim o locador sabe quem vai usar o espaço,
                                e o locatário sabe que o anunciante é real.
                            </p>

                            <h3>Comprovante de residência</h3>
                            <p>
                                Confirma que o endereço informado existe e é seu. Isso dá mais confiança
                                para as duas partes e permite contato caso haja algum problema, como dano ou cobrança.
                            </p>

                            <h3>O que fazemos com seus dados</h3>
                            <ul>
                                <li>Só nossa equipe de validação vê os arquivos.</li>
                                <li>Usamos apenas para conferir sua identidade e prevenir fraudes.</li>
                                <li>
                                    Você pode pedir a exclusão dos seus dados quando quiser, pelo e-mail do suporte:{" "}
                                    <a href="mailto:locafesta.suporte@gmail.com">locafesta.suporte@gmail.com</a>.
                                </li>
                            </ul>

                            {variante === "locatario" && (
                                <p className="pq-docs-variante">
                                    Com seus documentos validados, o locador tem mais segurança para aprovar sua reserva.
                                </p>
                            )}

                            <p className="pq-docs-termos">
                                <Link to="/jornada" onClick={() => setAberto(false)}>
                                    Ver Termos de Uso e Política de Privacidade
                                </Link>
                            </p>
                        </div>

                        <footer className="pq-docs-rodape">
                            <button type="button" className="pq-docs-ok" onClick={() => setAberto(false)}>
                                Entendi
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
