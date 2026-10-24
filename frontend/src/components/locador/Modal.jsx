import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

/**
 * Casca padrão dos modais: cabeçalho e rodapé fixos, só o miolo rola.
 * - Esc fecha (a menos que `bloqueado`, ex.: enquanto salva)
 * - a página de trás não rola enquanto o modal está aberto
 * - botões de envio no rodapé devem usar <button type="submit" form="id-do-form">
 */
export default function Modal({
    titulo,
    subtitulo,
    onClose,
    bloqueado = false,
    rodape,
    tamanho = "md", // "sm" | "md" | "lg"
    children,
}) {
    const idTitulo = useId();
    const dialogoRef = useRef(null);

    // Refs para o efeito rodar só uma vez, mesmo que o pai recrie as funções
    const onCloseRef = useRef(onClose);
    const bloqueadoRef = useRef(bloqueado);
    onCloseRef.current = onClose;
    bloqueadoRef.current = bloqueado;

    useEffect(() => {
        const aoTeclar = (e) => {
            if (e.key === "Escape" && !bloqueadoRef.current) onCloseRef.current?.();
        };
        window.addEventListener("keydown", aoTeclar);

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Só puxa o foco para o diálogo se nenhum campo interno já o pegou
        const dialogo = dialogoRef.current;
        if (dialogo && !dialogo.contains(document.activeElement)) dialogo.focus();

        return () => {
            window.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = overflowAnterior;
        };
    }, []);

    return createPortal(
        <div className="mdl-overlay">
            <div
                ref={dialogoRef}
                className={`mdl mdl--${tamanho}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                tabIndex={-1}
            >
                <header className="mdl-cab">
                    <div>
                        <h2 id={idTitulo}>{titulo}</h2>
                        {subtitulo && <p>{subtitulo}</p>}
                    </div>
                    <button
                        type="button"
                        className="mdl-fechar"
                        aria-label="Fechar"
                        onClick={onClose}
                        disabled={bloqueado}
                    >
                        ×
                    </button>
                </header>

                <div className="mdl-corpo">{children}</div>

                {rodape && <footer className="mdl-rodape">{rodape}</footer>}
            </div>
        </div>,
        document.body
    );
}
