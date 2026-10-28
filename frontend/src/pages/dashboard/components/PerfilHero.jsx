import React from "react";
import BotaoImagem from "../../../components/ui/BotaoImagem";

const iniciaisDe = (nome = "") =>
    nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join("");

/**
 * Bloco grande no topo: nome da pessoa, tipos de conta que ela tem
 * e o andamento do cadastro.
 */
export default function PerfilHero({ nome, email, fotoUrl, tipos, feitos, total, onCompletar, onFoto, enviandoFoto, erroFoto }) {
    const completo = feitos === total;

    return (
        <section className="pf-hero" aria-label="Resumo da conta">
            <div className="pf-foto">
                <div className="pf-avatar" aria-hidden="true">
                    {fotoUrl ? <img src={fotoUrl} alt="" /> : (iniciaisDe(nome) || "?")}
                </div>
                <BotaoImagem
                    className="pf-foto-upload"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={enviandoFoto}
                    preview={fotoUrl || ""}
                    compacto
                    rotulo={enviandoFoto ? "Enviando…" : "Adicionar foto"}
                    rotuloTroca={enviandoFoto ? "Enviando…" : "Trocar foto"}
                    dica="JPG, PNG ou WEBP"
                    onChange={(evento) => {
                        const arquivo = evento.target.files?.[0];
                        evento.target.value = "";
                        if (arquivo) onFoto?.(arquivo);
                    }}
                />
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
                            <span style={{ width: `${(feitos / total) * 100}%` }} />
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
