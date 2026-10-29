import React, { useEffect, useRef, useState } from "react";

const iniciaisDe = (nome = "") =>
    nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join("");

/**
 * Bloco grande no topo: nome, tipos de conta e andamento do cadastro.
 * A foto abre um menu ao clicar (adicionar / alterar / remover).
 */
export default function PerfilHero({
    nome,
    email,
    fotoUrl,
    tipos,
    feitos,
    total,
    onCompletar,
    onFoto,
    onRemoverFoto,
    enviandoFoto,
    erroFoto,
}) {
    const completo = feitos === total;
    const [menuAberto, setMenuAberto] = useState(false);
    const caixaRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!menuAberto) return undefined;
        const fechar = (evento) => {
            if (!caixaRef.current?.contains(evento.target)) setMenuAberto(false);
        };
        const tecla = (evento) => {
            if (evento.key === "Escape") setMenuAberto(false);
        };
        document.addEventListener("mousedown", fechar);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", fechar);
            document.removeEventListener("keydown", tecla);
        };
    }, [menuAberto]);

    const escolherArquivo = () => {
        setMenuAberto(false);
        inputRef.current?.click();
    };

    return (
        <section className="pf-hero" aria-label="Resumo da conta">
            <div className="pf-foto" ref={caixaRef}>
                <button
                    type="button"
                    className="pf-avatar pf-avatar--botao"
                    aria-label={fotoUrl ? "Opções da foto de perfil" : "Adicionar foto de perfil"}
                    aria-expanded={menuAberto}
                    aria-haspopup="menu"
                    disabled={enviandoFoto}
                    onClick={() => setMenuAberto((atual) => !atual)}
                >
                    {fotoUrl ? <img src={fotoUrl} alt="" /> : (iniciaisDe(nome) || "?")}
                </button>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(evento) => {
                        const arquivo = evento.target.files?.[0];
                        evento.target.value = "";
                        if (arquivo) onFoto?.(arquivo);
                    }}
                />

                {menuAberto && (
                    <div className="pf-foto-menu" role="menu">
                        <button type="button" role="menuitem" onClick={escolherArquivo}>
                            {fotoUrl ? "Alterar foto" : "Adicionar foto"}
                        </button>
                        {fotoUrl && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setMenuAberto(false);
                                    onRemoverFoto?.();
                                }}
                            >
                                Remover foto
                            </button>
                        )}
                    </div>
                )}

                {erroFoto && <p className="pf-foto-erro" role="alert">{erroFoto}</p>}
            </div>

            <div className="pf-hero-info">
                <p className="pf-hero-eyebrow">Minha conta</p>
                <h1 className="pf-hero-nome">{nome}</h1>
                {email && <p className="pf-hero-email">{email}</p>}

                <ul className="pf-tipos" aria-label="Tipos de conta">
                    {tipos.map((tipo) => (
                        <li key={tipo.rotulo} className={`pf-tipo${tipo.ativo ? " pf-tipo--ativo" : ""}`}>
                            {tipo.rotulo}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pf-hero-lado">
                {completo ? (
                    <p className="pf-hero-ok">Cadastro completo</p>
                ) : (
                    <>
                        <p className="pf-hero-prog">
                            <strong>{feitos} de {total}</strong> itens do cadastro
                        </p>
                        <div
                            className="pf-barra"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={total}
                            aria-valuenow={feitos}
                        >
                            <span style={{ width: `${(feitos / Math.max(total, 1)) * 100}%` }} />
                        </div>
                        <button type="button" className="pf-btn pf-btn--primario" onClick={onCompletar}>
                            Completar cadastro
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
