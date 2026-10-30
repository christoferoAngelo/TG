import { useEffect, useMemo, useState } from "react";

import { Slider } from "../../../components/base/slider/slider";
import GlideSelect from "../../../components/bits/GlideSelect";
import SpringCheck from "../../../components/bits/SpringCheck";
import {
    CAPACIDADE_MAX_FILTRO,
    FILTRO_INICIAL,
    PRECO_MAX_FILTRO,
    espacosParaHistograma,
    filtrarEspacos,
    histogramaPrecos,
    precoDe,
} from "./explorar";

function clonarFiltros(filtros) {
    return {
        ...filtros,
        comodidades: [...(filtros.comodidades || [])],
    };
}

export default function ModalFiltros({
    aberto,
    filtros,
    comodidades,
    espacos = [],
    pessoas = 0,
    semVaga = [],
    onChange,
    onLimpar,
    onFechar,
}) {
    const [rascunho, setRascunho] = useState(() => clonarFiltros(filtros));
    const [buscaComodidade, setBuscaComodidade] = useState("");

    useEffect(() => {
        if (!aberto) {
            setBuscaComodidade("");
            return undefined;
        }
        setRascunho(clonarFiltros(filtros));
        const tecla = (evento) => {
            if (evento.key === "Escape") onFechar();
        };
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [aberto, filtros, onFechar]);

    const baseHistograma = useMemo(
        () => espacosParaHistograma(espacos, { pessoas, filtros: rascunho, semVaga }),
        [espacos, pessoas, rascunho, semVaga]
    );

    const histograma = useMemo(() => histogramaPrecos(baseHistograma), [baseHistograma]);

    const resultados = useMemo(
        () => filtrarEspacos(espacos, { pessoas, filtros: rascunho, semVaga }),
        [espacos, pessoas, rascunho, semVaga]
    );

    const comodidadesFiltradas = useMemo(() => {
        const termo = buscaComodidade.trim().toLowerCase();
        if (!termo) return comodidades;
        return comodidades.filter((item) => String(item.nome || "").toLowerCase().includes(termo));
    }, [comodidades, buscaComodidade]);

    if (!aberto) return null;

    const precoMin = rascunho.precoMin === "" ? 0 : Number(rascunho.precoMin);
    const precoMax = rascunho.precoMax === "" ? PRECO_MAX_FILTRO : Number(rascunho.precoMax);
    const step = histograma.step;

    const atualizar = (parcial) => setRascunho((atual) => ({ ...atual, ...parcial }));

    const alternarComodidade = (nome) => {
        const jaTem = rascunho.comodidades.includes(nome);
        atualizar({
            comodidades: jaTem
                ? rascunho.comodidades.filter((item) => item !== nome)
                : [...rascunho.comodidades, nome],
        });
    };

    const aplicar = () => {
        onChange(clonarFiltros(rascunho));
        onFechar();
    };

    const limpar = () => {
        const limpo = clonarFiltros(FILTRO_INICIAL);
        setRascunho(limpo);
        onLimpar();
    };

    const qtd = resultados.length;
    const rotuloResultados =
        qtd === 0 ? "Nenhum espaço" : qtd === 1 ? "Mostrar 1 espaço" : `Mostrar ${qtd} espaços`;

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
                        <legend>Faixa de preço</legend>
                        <p className="hm-filtro-sub">Diária média dos espaços nesta busca</p>
                        <div className="hm-histo" aria-hidden="true">
                            {histograma.counts.map((count, indice) => {
                                const inicio = indice * step;
                                const fim = (indice + 1) * step;
                                const noIntervalo = fim > precoMin && inicio < precoMax;
                                const altura = Math.max(4, Math.round((count / histograma.max) * 100));
                                return (
                                    <span
                                        key={indice}
                                        className={`hm-histo-barra${noIntervalo ? " is-ativa" : ""}`}
                                        style={{ height: `${altura}%` }}
                                        title={`${count} espaço${count === 1 ? "" : "s"}`}
                                    />
                                );
                            })}
                        </div>
                        <Slider
                            aria-label="Faixa de preço da diária"
                            labelPosition="bottom"
                            minValue={0}
                            maxValue={PRECO_MAX_FILTRO}
                            step={100}
                            value={[precoMin, precoMax]}
                            labelFormatter={(valor) => {
                                if (valor <= 0) return "R$ 0";
                                if (valor >= PRECO_MAX_FILTRO) return `R$ ${PRECO_MAX_FILTRO.toLocaleString("pt-BR")}+`;
                                return `R$ ${Number(valor).toLocaleString("pt-BR")}`;
                            }}
                            onChange={([minimo, maximo]) =>
                                atualizar({
                                    precoMin: minimo <= 0 ? "" : String(minimo),
                                    precoMax: maximo >= PRECO_MAX_FILTRO ? "" : String(maximo),
                                })
                            }
                        />
                        <div className="hm-faixa-preco-resumo">
                            <span>
                                Mínimo{" "}
                                <strong>
                                    {precoMin <= 0 ? "R$ 0" : `R$ ${precoMin.toLocaleString("pt-BR")}`}
                                </strong>
                            </span>
                            <span>
                                Máximo{" "}
                                <strong>
                                    {precoMax >= PRECO_MAX_FILTRO
                                        ? `R$ ${PRECO_MAX_FILTRO.toLocaleString("pt-BR")}+`
                                        : `R$ ${precoMax.toLocaleString("pt-BR")}`}
                                </strong>
                            </span>
                        </div>
                        <p className="hm-filtro-sub hm-filtro-sub--topo">
                            {baseHistograma.filter((e) => {
                                const p = precoDe(e);
                                return p != null && p >= precoMin && p <= precoMax;
                            }).length}{" "}
                            espaços nesta faixa
                        </p>
                    </fieldset>

                    <label className="hm-filtro-linha">
                        Capacidade mínima
                        <Slider
                            aria-label="Capacidade mínima"
                            labelPosition="bottom"
                            minValue={0}
                            maxValue={CAPACIDADE_MAX_FILTRO}
                            step={10}
                            value={[rascunho.capacidadeMin === "" ? 0 : Number(rascunho.capacidadeMin)]}
                            labelFormatter={(valor) => (valor <= 0 ? "Qualquer" : `${valor} pessoas`)}
                            onChange={([valor]) =>
                                atualizar({
                                    capacidadeMin: valor <= 0 ? "" : String(valor),
                                })
                            }
                        />
                    </label>

                    <label className="hm-filtro-linha">
                        Ordenar por
                        <GlideSelect
                            className="glide-select--bloco"
                            ariaLabel="Ordenar por"
                            size="lg"
                            menuWidth={280}
                            value={rascunho.ordem}
                            options={[
                                { value: "relevancia", label: "Mais avaliados" },
                                { value: "preco-asc", label: "Menor preço" },
                                { value: "preco-desc", label: "Maior preço" },
                                { value: "nota", label: "Melhor nota" },
                                { value: "capacidade", label: "Maior capacidade" },
                            ]}
                            onChange={(valor) => atualizar({ ordem: valor })}
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
                                            const ativa = rascunho.comodidades.includes(item.nome);
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
                    <button type="button" className="hm-btn hm-btn--texto" onClick={limpar}>
                        Remover filtros
                    </button>
                    <button type="button" className="hm-btn hm-btn--primario" onClick={aplicar}>
                        {rotuloResultados}
                    </button>
                </footer>
            </div>
        </div>
    );
}
