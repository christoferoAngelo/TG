import { useEffect, useState } from "react";
import { alternarTema, iniciarTema, temaAtual } from "../../styles/tema";
import "./BotaoTema.css";

export default function BotaoTema({ className = "" }) {
    const [tema, setTema] = useState(() =>
        typeof document !== "undefined"
            ? document.documentElement.getAttribute("data-tema") || temaAtual()
            : "light"
    );

    useEffect(() => {
        iniciarTema();
        setTema(temaAtual());
        const onTema = (evento) => setTema(evento.detail || temaAtual());
        window.addEventListener("locafesta-tema", onTema);
        return () => window.removeEventListener("locafesta-tema", onTema);
    }, []);

    const escuro = tema === "dark";

    return (
        <button
            type="button"
            className={`bt-tema ${className}`.trim()}
            aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
            title={escuro ? "Modo claro" : "Modo escuro"}
            aria-pressed={escuro}
            onClick={() => setTema(alternarTema())}
        >
            {escuro ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
                    <path
                        d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                    />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 7.6 7.6 0 1 0 19.5 13.2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </button>
    );
}
