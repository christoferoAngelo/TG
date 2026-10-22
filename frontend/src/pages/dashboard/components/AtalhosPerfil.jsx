import React from "react";

export default function AtalhosPerfil({ ehLocatario, ehLocador, onReservas, onExplorar, onPainel }) {
    return (
        <section className="pf-atalhos" aria-label="Atalhos">
            <article className="pf-card pf-atalho">
                <h2 className="pf-card-titulo">Alugar um espaço</h2>
                <p className="pf-atalho-texto">
                    Acompanhe suas reservas ou encontre o lugar ideal para o seu evento.
                </p>
                <div className="pf-atalho-acoes">
                    <button type="button" className="pf-btn pf-btn--primario" onClick={onReservas}>
                        Minhas reservas
                    </button>
                    <button type="button" className="pf-btn pf-btn--ghost" onClick={onExplorar}>
                        Explorar espaços
                    </button>
                </div>
            </article>

            <article className="pf-card pf-atalho">
                <div className="pf-atalho-topo">
                    <h2 className="pf-card-titulo">Anunciar meu espaço</h2>
                    <span className={`pf-chip ${ehLocador ? "pf-chip--ok" : "pf-chip--muted"}`}>
                        {ehLocador ? "Locador ativo" : "Sem conta de locador"}
                    </span>
                </div>
                <p className="pf-atalho-texto">
                    {ehLocador
                        ? "Gerencie seus anúncios, os pedidos de locação e a agenda dos seus espaços."
                        : "No painel do locador você cria sua conta de anunciante e cadastra seus espaços."}
                </p>
                {!ehLocador && !ehLocatario && (
                    <p className="pf-atalho-dica">
                        Antes de criar a conta de locador, complete seu cadastro com o CPF.
                    </p>
                )}
                <div className="pf-atalho-acoes">
                    <button type="button" className="pf-btn pf-btn--primario" onClick={onPainel}>
                        Acessar painel do locador
                    </button>
                </div>
            </article>
        </section>
    );
}
