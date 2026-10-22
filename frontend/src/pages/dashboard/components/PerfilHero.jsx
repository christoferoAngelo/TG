import React from "react";

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
export default function PerfilHero({ nome, email, tipos, feitos, total, onCompletar }) {
    const completo = feitos === total;

    return (
        <section className="pf-hero" aria-label="Resumo da conta">
            <div className="pf-avatar" aria-hidden="true">
                {iniciaisDe(nome) || "?"}
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
