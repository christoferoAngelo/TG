import { useEffect } from "react";
import "./ConfirmacaoSair.css";

export default function ConfirmacaoSair({ aberto, onCancelar, onConfirmar, saindo = false }) {
    useEffect(() => {
        if (!aberto) return undefined;
        const tecla = (evento) => {
            if (evento.key === "Escape" && !saindo) onCancelar();
        };
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [aberto, saindo, onCancelar]);

    if (!aberto) return null;

    return (
        <div
            className="cs-overlay"
            role="presentation"
            onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget && !saindo) onCancelar();
            }}
        >
            <div
                className="cs-caixa"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cs-titulo"
                aria-describedby="cs-desc"
            >
                <h2 id="cs-titulo">Sair da conta?</h2>
                <p id="cs-desc">Tem certeza que deseja sair da sua conta?</p>
                <div className="cs-acoes">
                    <button type="button" className="cs-btn cs-btn--texto" onClick={onCancelar} disabled={saindo}>
                        Cancelar
                    </button>
                    <button type="button" className="cs-btn cs-btn--sair" onClick={onConfirmar} disabled={saindo}>
                        {saindo ? "Saindo…" : "Sair"}
                    </button>
                </div>
            </div>
        </div>
    );
}
