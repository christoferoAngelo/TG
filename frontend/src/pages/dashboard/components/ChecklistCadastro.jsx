import React from "react";

/**
 * Lista do que falta no cadastro. Cada linha é clicável e abre o modal
 * de completar cadastro já focado naquele item.
 */
export default function ChecklistCadastro({ itens, onAbrir }) {
    const pendentes = itens.filter((i) => !i.feito).length;

    return (
        <section className="pf-card" aria-labelledby="pf-checklist-titulo">
            <header className="pf-card-cab">
                <div>
                    <h2 className="pf-card-titulo" id="pf-checklist-titulo">Complete seu cadastro</h2>
                    <p className="pf-card-sub">
                        {pendentes === 1 ? "Falta 1 item." : `Faltam ${pendentes} itens.`} Toque em um deles para preencher.
                    </p>
                </div>
            </header>

            <ul className="pf-checklist">
                {itens.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            className={`pf-item${item.feito ? " pf-item--feito" : ""}`}
                            onClick={() => onAbrir(item.id)}
                        >
                            <span className="pf-item-marca" aria-hidden="true">{item.feito ? "✓" : ""}</span>
                            <span className="pf-item-texto">
                                <strong>{item.titulo}</strong>
                                <span>{item.feito ? item.valor : item.descricao}</span>
                            </span>
                            <span className={`pf-chip ${item.feito ? "pf-chip--ok" : "pf-chip--warn"}`}>
                                {item.feito ? "Preenchido" : "Pendente"}
                            </span>
                            <span className="pf-item-seta" aria-hidden="true">›</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
