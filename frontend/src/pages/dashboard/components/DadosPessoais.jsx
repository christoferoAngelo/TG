import React from "react";

function Linha({ rotulo, valor, onAdicionar, largo }) {
    return (
        <div className={`pf-dado${largo ? " pf-dado--largo" : ""}`}>
            <dt>{rotulo}</dt>
            <dd>
                {valor ? (
                    valor
                ) : (
                    <>
                        <span className="pf-vazio">Não informado</span>
                        {onAdicionar && (
                            <button type="button" className="pf-link" onClick={onAdicionar}>
                                Adicionar
                            </button>
                        )}
                    </>
                )}
            </dd>
        </div>
    );
}

export default function DadosPessoais({ usuarioLogado, cpfExibicao, enderecoTexto, onEditar }) {
    return (
        <section className="pf-card" aria-labelledby="pf-dados-titulo">
            <header className="pf-card-cab">
                <h2 className="pf-card-titulo" id="pf-dados-titulo">Meus dados</h2>
                <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" onClick={() => onEditar(null)}>
                    Editar dados
                </button>
            </header>

            <dl className="pf-dados">
                <Linha rotulo="Nome" valor={usuarioLogado?.nome} />
                <Linha rotulo="E-mail" valor={usuarioLogado?.email} />
                <Linha rotulo="Telefone" valor={usuarioLogado?.telefone} onAdicionar={() => onEditar("telefone")} />
                <Linha rotulo="CPF" valor={cpfExibicao} onAdicionar={() => onEditar("cpf")} />
                <Linha rotulo="Endereço" valor={enderecoTexto} onAdicionar={() => onEditar("endereco")} largo />
            </dl>
        </section>
    );
}
