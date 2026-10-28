import { useEffect, useMemo, useState } from "react";

import { Slider } from "../../../components/base/slider/slider";
import GlideSelect from "../../../components/bits/GlideSelect";
import SpringCheck from "../../../components/bits/SpringCheck";

export default function ModalFiltros({ aberto, filtros, comodidades, onChange, onLimpar, onFechar }) {
    const [buscaComodidade, setBuscaComodidade] = useState("");

    useEffect(() => {
        if (!aberto) {
            setBuscaComodidade("");
            return undefined;
        }
        const tecla = (evento) => {
            if (evento.key === "Escape") onFechar();
        };
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [aberto, onFechar]);

    const comodidadesFiltradas = useMemo(() => {
        const termo = buscaComodidade.trim().toLowerCase();
        if (!termo) return comodidades;
        return comodidades.filter((item) => String(item.nome || "").toLowerCase().includes(termo));
    }, [comodidades, buscaComodidade]);

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
                        <Slider
                            aria-label="Faixa de preço da diária"
                            labelPosition="bottom"
                            minValue={0}
                            maxValue={15000}
                            step={100}
                            value={[
                                filtros.precoMin === "" ? 0 : Number(filtros.precoMin),
                                filtros.precoMax === "" ? 15000 : Number(filtros.precoMax)
                            ]}
                            labelFormatter={(valor) => {
                                if (valor <= 0) return "Qualquer";
                                if (valor >= 15000) return "Sem limite";
                                return `R$ ${valor}`;
                            }}
                            onChange={([minimo, maximo]) => onChange({
                                ...filtros,
                                precoMin: minimo <= 0 ? "" : String(minimo),
                                precoMax: maximo >= 15000 ? "" : String(maximo)
                            })}
                        />
                    </fieldset>

                    <label className="hm-filtro-linha">
                        Capacidade mínima
                        <Slider
                            aria-label="Capacidade mínima"
                            labelPosition="bottom"
                            minValue={0}
                            maxValue={300}
                            step={5}
                            value={[filtros.capacidadeMin === "" ? 0 : Number(filtros.capacidadeMin)]}
                            labelFormatter={(valor) => (valor <= 0 ? "Qualquer" : `${valor} pessoas`)}
                            onChange={([valor]) => onChange({
                                ...filtros,
                                capacidadeMin: valor <= 0 ? "" : String(valor)
                            })}
                        />
                    </label>

                    <label className="hm-filtro-linha">
                        Ordenar por
                        <GlideSelect
                            className="glide-select--bloco"
                            ariaLabel="Ordenar por"
                            size="lg"
                            menuWidth={280}
                            value={filtros.ordem}
                            options={[
                                { value: "relevancia", label: "Relevância" },
                                { value: "preco-asc", label: "Menor preço" },
                                { value: "preco-desc", label: "Maior preço" },
                                { value: "nota", label: "Melhor avaliação" },
                                { value: "capacidade", label: "Maior capacidade" }
                            ]}
                            onChange={(valor) => onChange({ ...filtros, ordem: valor })}
                        />
                    </label>

                    <fieldset>
                        <legend>Comodidades</legend>
                        {comodidades.length === 0 ? (
                            <p className="hm-filtro-vazio">Nenhuma característica cadastrada ainda.</p>
                        ) : (
                            <>
                                <label className="hm-filtro-linha hm-filtro-busca">
                                    Buscar comodidade
                                    <input
                                        type="search"
                                        value={buscaComodidade}
                                        onChange={(evento) => setBuscaComodidade(evento.target.value)}
                                        placeholder="Ex.: piscina, buffet…"
                                        autoComplete="off"
                                    />
                                </label>
                                {comodidadesFiltradas.length === 0 ? (
                                    <p className="hm-filtro-vazio">Nenhuma comodidade com esse nome.</p>
                                ) : (
                                    <div className="hm-comodidades">
                                        {comodidadesFiltradas.map((item) => {
                                            const ativa = filtros.comodidades.includes(item.nome);
                                            return (
                                                <div
                                                    key={item.id || item.nome}
                                                    className={`hm-comodidade${ativa ? " hm-comodidade--ativa" : ""}`}
                                                >
                                                    {item.icone ? (
                                                        <img src={item.icone} alt="" className="hm-comodidade-ico" />
                                                    ) : null}
                                                    <SpringCheck
                                                        label={item.nome}
                                                        checked={ativa}
                                                        onChange={() => alternarComodidade(item.nome)}
                                                        color="#130501"
                                                        fillColor="#FECB5A"
                                                        checkColor="#130501"
                                                        boxSize={20}
                                                        fontSize={14}
                                                        doneOpacity={1}
                                                        strike="none"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
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
