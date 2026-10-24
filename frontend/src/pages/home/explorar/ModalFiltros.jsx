import { useEffect } from "react";

export default function ModalFiltros({ aberto, filtros, comodidades, onChange, onLimpar, onFechar }) {
    useEffect(() => {
        if (!aberto) return undefined;
        const tecla = (evento) => {
            if (evento.key === "Escape") onFechar();
        };
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [aberto, onFechar]);

    if (!aberto) return null;

    const alternarComodidade = (nome) => {
        const jaTem = filtros.comodidades.includes(nome);
        onChange({
            ...filtros,
            comodidades: jaTem
                ? filtros.comodidades.filter((item) => item !== nome)
                : [...filtros.comodidades, nome],
        });
    };

    return (
        <div className="hm-modal" role="presentation" onMouseDown={onFechar}>
            <div
                className="hm-modal-caixa"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hm-filtros-titulo"
                onMouseDown={(evento) => evento.stopPropagation()}
            >
                <header className="hm-modal-topo">
                    <h2 id="hm-filtros-titulo">Filtros</h2>
                    <button type="button" className="hm-modal-fechar" onClick={onFechar} aria-label="Fechar filtros">
                        ×
                    </button>
                </header>

                <div className="hm-modal-corpo">
                    <fieldset>
                        <legend>Faixa de preço (diária)</legend>
                        <div className="hm-faixa-preco">
                            <label>
                                Mínimo
                                <input
                                    type="number"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={filtros.precoMin}
                                    onChange={(evento) => onChange({ ...filtros, precoMin: evento.target.value })}
                                />
                            </label>
                            <label>
                                Máximo
                                <input
                                    type="number"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="Sem limite"
                                    value={filtros.precoMax}
                                    onChange={(evento) => onChange({ ...filtros, precoMax: evento.target.value })}
                                />
                            </label>
                        </div>
                    </fieldset>

                    <label className="hm-filtro-linha">
                        Capacidade mínima
                        <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="Qualquer"
                            value={filtros.capacidadeMin}
                            onChange={(evento) => onChange({ ...filtros, capacidadeMin: evento.target.value })}
                        />
                    </label>

                    <label className="hm-filtro-linha">
                        Ordenar por
                        <select
                            value={filtros.ordem}
                            onChange={(evento) => onChange({ ...filtros, ordem: evento.target.value })}
                        >
                            <option value="relevancia">Relevância</option>
                            <option value="preco-asc">Menor preço</option>
                            <option value="preco-desc">Maior preço</option>
                            <option value="nota">Melhor avaliação</option>
                            <option value="capacidade">Maior capacidade</option>
                        </select>
                    </label>

                    <fieldset>
                        <legend>Comodidades</legend>
                        {comodidades.length === 0 ? (
                            <p className="hm-filtro-vazio">Nenhuma comodidade cadastrada nos espaços desta busca.</p>
                        ) : (
                            <div className="hm-comodidades">
                                {comodidades.map((item) => (
                                    <label key={item.id || item.nome}>
                                        <input
                                            type="checkbox"
                                            checked={filtros.comodidades.includes(item.nome)}
                                            onChange={() => alternarComodidade(item.nome)}
                                        />
                                        {item.nome}
                                    </label>
                                ))}
                            </div>
                        )}
                    </fieldset>
                </div>

                <footer className="hm-modal-rodape">
                    <button type="button" className="hm-btn hm-btn--texto" onClick={onLimpar}>Limpar</button>
                    <button type="button" className="hm-btn hm-btn--primario" onClick={onFechar}>Mostrar espaços</button>
                </footer>
            </div>
        </div>
    );
}
