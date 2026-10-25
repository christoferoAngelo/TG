import { useState } from "react";
import { EMAIL_SUPORTE, TERMOS } from "./termos";
import "./TermosModal.css";

export default function TermosModal({ aberto, onAceitar, onFechar }) {
    const [aceito, setAceito] = useState(false);

    if (!aberto) return null;

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
                    <h2 id="termos-titulo">Termos de Uso e Política de Privacidade</h2>
                    <button type="button" className="termos-fechar" onClick={onFechar} aria-label="Fechar">
                        ×
                    </button>
                </header>
                <div className="termos-rola" tabIndex={0}>
                    {TERMOS.map((bloco) => (
                        <section key={bloco.titulo}>
                            <h3>{bloco.titulo}</h3>
                            {bloco.itens.map((item) => (
                                <p key={item}>{item}</p>
                            ))}
                        </section>
                    ))}
                    <p>E-mail suporte: {EMAIL_SUPORTE}</p>
                    <p>Equipe LocaFesta</p>
                </div>
                <label className="termos-aceite">
                    <input
                        type="checkbox"
                        checked={aceito}
                        onChange={(evento) => setAceito(evento.target.checked)}
                    />
                    <span>Li e concordo com os Termos de Uso e Política de Privacidade.</span>
                </label>
                <button type="button" className="termos-confirmar" disabled={!aceito} onClick={onAceitar}>
                    Aceitar e continuar
                </button>
            </div>
        </div>
    );
}
