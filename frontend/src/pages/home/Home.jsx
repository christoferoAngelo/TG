import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ModalFiltros from "./explorar/ModalFiltros";
import SalvarLista from "./explorar/SalvarLista";
import { CardExplorar, EsqueletoGrade, MapaEspacos } from "./explorar/CardExplorar";
import MelhorAvaliados, { espacosEmDestaque } from "./explorar/MelhorAvaliados";
import HomeRodape from "./HomeRodape";
import {
    CATEGORIAS,
    FILTRO_INICIAL,
    aplicarFiltros,
    comodidadesDisponiveis,
    sugerirEspacos,
} from "./explorar/explorar";
import { carregarListas, espacoSalvo } from "../favoritos/favoritosApi";
import JellyRadio, { jellyTema } from "../../components/ui/JellyRadio";
import AnimatedContent from "../../components/bits/AnimatedContent";
import BlurText from "../../components/bits/BlurText";
import GradualBlur from "../../components/bits/GradualBlur";
import PillNav from "../../components/bits/PillNav";
import { temaAtual } from "../../styles/tema";
import "./Home.css";
import "./HomeExplorar.css";
import iconeChacara from "../../assets/icone-chacara.png";
import iconeSitio from "../../assets/icone-sitio.png";

const API_BUSCA = "http://localhost:8080/api/locadores/espacos/busca";

function LinkCategoria({ href, children, ...props }) {
    return (
        <button type="button" {...props}>
            {children}
        </button>
    );
}

function IconeCategoria({ id }) {
    const comum = { viewBox: "0 0 24 24", "aria-hidden": true };
    // Artes invertidas em relação aos rótulos; width/height fixos evitam o PNG estourar o PillNav.
    if (id === "Chácaras") {
        return <img src={iconeSitio} alt="" className="hm-cat-img" width={18} height={18} />;
    }
    if (id === "Sítios") {
        return <img src={iconeChacara} alt="" className="hm-cat-img" width={18} height={18} />;
    }
    if (id === "Áreas ao ar livre") {
        return (
            <svg {...comum}><path d="M12 20V10M8 20c0-4 4-6 4-10 0 4 4 6 4 10M5 20h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        );
    }
    if (id === "Rooftops") {
        return (
            <svg {...comum}><path d="M4 18h16M6 18V10l6-4 6 4v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        );
    }
    if (id === "Espaços corporativos") {
        return (
            <svg {...comum}><path d="M5 20V6h8v14M13 10h6v10M8 9h2M8 12h2M8 15h2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        );
    }
    if (id === "Todos") {
        return (
            <svg {...comum}><path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        );
    }
    return (
        <svg {...comum}><path d="M4 18V9l8-4 8 4v9M9 18v-5h6v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    );
}

export default function Home() {
    const { usuarioLogado } = useAuth();
    const [params, setParams] = useSearchParams();
    const [espacos, setEspacos] = useState([]);
    const [melhores, setMelhores] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const onde = params.get("q") || "";
    const quando = params.get("data") || "";
    const pessoas = params.get("pessoas") || "0";
    const [categoria, setCategoria] = useState(params.get("cat") || "Todos");
    const [filtros, setFiltros] = useState(() => (
        params.get("ordenar") === "melhor-avaliados"
            ? { ...FILTRO_INICIAL, ordem: "melhor-avaliados" }
            : FILTRO_INICIAL
    ));
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [vista, setVista] = useState("grade");
    const [listas, setListas] = useState([]);
    const [espacoLista, setEspacoLista] = useState(null);
    const [semVaga, setSemVaga] = useState([]);
    const [caracteristicasCatalogo, setCaracteristicasCatalogo] = useState([]);
    const [rodapeVisivel, setRodapeVisivel] = useState(false);
    const [tema, setTema] = useState(() =>
        typeof document !== "undefined"
            ? document.documentElement.getAttribute("data-tema") || temaAtual()
            : "light"
    );
    const ultimaBusca = useRef(0);
    const rodapeRef = useRef(null);

    useEffect(() => {
        const onTema = (evento) => setTema(evento.detail || temaAtual());
        window.addEventListener("locafesta-tema", onTema);
        return () => window.removeEventListener("locafesta-tema", onTema);
    }, []);

    const buscar = (termo, ordenar) => {
        const idBusca = ++ultimaBusca.current;
        setCarregando(true);
        setErro(false);
        const url = ordenar === "melhor-avaliados"
            ? `${API_BUSCA}?ordenar=melhor-avaliados`
            : `${API_BUSCA}?q=${encodeURIComponent(termo)}`;
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then((data) => {
                if (idBusca === ultimaBusca.current) setEspacos(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Erro ao buscar espaços:", err);
                if (idBusca === ultimaBusca.current) {
                    setEspacos([]);
                    setErro(true);
                }
            })
            .finally(() => {
                if (idBusca === ultimaBusca.current) setCarregando(false);
            });
    };

    useEffect(() => {
        const termoUrl = (params.get("q") || "").trim();
        const cat = params.get("cat") || "Todos";
        setCategoria(cat);
        if (params.get("ordenar") === "melhor-avaliados") {
            buscar("", "melhor-avaliados");
            return;
        }
        const termoApi = cat !== "Todos"
            ? cat
            : (/^qualquer lugar$/i.test(termoUrl) ? "" : termoUrl);
        buscar(termoApi);
    }, [params]);

    useEffect(() => {
        const querMelhores = params.get("ordenar") === "melhor-avaliados";
        setFiltros((atual) => {
            if (querMelhores && atual.ordem !== "melhor-avaliados") {
                return { ...atual, ordem: "melhor-avaliados" };
            }
            if (!querMelhores && atual.ordem === "melhor-avaliados") {
                return { ...atual, ordem: "relevancia" };
            }
            return atual;
        });
    }, [params]);

    useEffect(() => {
        let ativo = true;
        fetch(`${API_BUSCA}?ordenar=melhor-avaliados`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (ativo) setMelhores(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (ativo) setMelhores([]);
            });
        return () => {
            ativo = false;
        };
    }, []);

    useEffect(() => {
        let ativo = true;
        fetch("http://localhost:8080/api/caracteristicas")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (!ativo) return;
                const lista = Array.isArray(data) ? data : [];
                setCaracteristicasCatalogo(
                    [...lista].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"))
                );
            })
            .catch(() => {
                if (ativo) setCaracteristicasCatalogo([]);
            });
        return () => {
            ativo = false;
        };
    }, []);

    // Esconde Grade/Lista/Mapa quando o rodapé está na tela (evita cobrir o ©)
    useEffect(() => {
        const el = rodapeRef.current;
        if (!el || typeof IntersectionObserver === "undefined") return undefined;
        const io = new IntersectionObserver(
            ([entry]) => setRodapeVisivel(Boolean(entry?.isIntersecting)),
            { root: null, threshold: 0.08 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Catálogo completo para sugestões quando a busca/filtros zeram
    useEffect(() => {
        let ativo = true;
        fetch(`${API_BUSCA}?q=`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (ativo) setCatalogo(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (ativo) setCatalogo([]);
            });
        return () => {
            ativo = false;
        };
    }, []);

    const termoBusca = (texto) => {
        const q = String(texto || "").trim();
        if (!q || /^qualquer lugar$/i.test(q)) return "";
        return q;
    };

    const atualizarUrl = (proximo) => {
        const q = termoBusca(proximo.onde ?? onde);
        const data = proximo.quando ?? quando;
        const qtd = String(proximo.pessoas ?? pessoas);
        const cat = proximo.categoria ?? categoria;
        const busca = new URLSearchParams();
        if (cat !== "Todos") busca.set("cat", cat);
        else if (q) busca.set("q", q);
        // Mantém o rótulo “Qualquer lugar” na URL só como estado da UI
        else if (/^qualquer lugar$/i.test(String(proximo.onde ?? onde).trim())) {
            busca.set("q", "Qualquer lugar");
        }
        if (data) busca.set("data", data);
        if (Number(qtd) > 0) busca.set("pessoas", qtd);
        setParams(busca, { replace: true });
    };

    useEffect(() => {
        if (!usuarioLogado?.id) {
            setListas([]);
            return undefined;
        }
        let ativo = true;
        carregarListas(usuarioLogado.id)
            .then((salvas) => {
                if (ativo) setListas(Array.isArray(salvas) ? salvas : []);
            })
            .catch(() => {
                if (ativo) setListas([]);
            });
        return () => {
            ativo = false;
        };
    }, [usuarioLogado?.id]);

    const escolherCategoria = (id) => {
        setFiltros(FILTRO_INICIAL);
        atualizarUrl({ onde: "", categoria: id });
    };

    const pessoasAplicadas = params.get("pessoas") || "0";
    const dataAplicada = params.get("data") || "";

    useEffect(() => {
        if (!dataAplicada) {
            setSemVaga([]);
            return;
        }
        let ativo = true;
        fetch(`http://localhost:8080/api/reservas/indisponiveis?data=${dataAplicada}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((ids) => {
                if (ativo) setSemVaga(Array.isArray(ids) ? ids.map(Number) : []);
            })
            .catch(() => {
                if (ativo) setSemVaga([]);
            });
        return () => {
            ativo = false;
        };
    }, [dataAplicada]);

    const visiveis = useMemo(
        () => aplicarFiltros(espacos, { pessoas: pessoasAplicadas, filtros })
            .filter((espaco) => !dataAplicada || !semVaga.includes(Number(espaco.id))),
        [espacos, pessoasAplicadas, filtros, dataAplicada, semVaga]
    );
    const sugestoes = useMemo(() => {
        if (visiveis.length > 0) return [];
        const base = catalogo.length > 0 ? catalogo : espacos;
        return sugerirEspacos(base, {
            pessoas: pessoasAplicadas,
            termo: onde.trim() || (categoria !== "Todos" ? categoria : ""),
            data: dataAplicada,
            semVaga,
            filtros,
            excluirIds: visiveis.map((e) => e.id),
            limite: 8,
        });
    }, [visiveis, catalogo, espacos, pessoasAplicadas, onde, categoria, dataAplicada, semVaga, filtros]);
    const comodidadesDaBusca = useMemo(() => comodidadesDisponiveis(espacos), [espacos]);
    const comodidades = caracteristicasCatalogo.length > 0 ? caracteristicasCatalogo : comodidadesDaBusca;
    const filtrosAtivos = filtros.precoMin || filtros.precoMax || filtros.capacidadeMin || filtros.comodidades.length > 0 || filtros.ordem !== "relevancia";
    // Filtros só depois de Onde + Quando + Quem preenchidos
    const buscaCompleta = Boolean(onde.trim()) && Boolean(quando) && Number(pessoasAplicadas) > 0;
    const mostrarFiltros = buscaCompleta;

    const listagemAvaliados = params.get("ordenar") === "melhor-avaliados";
    const destaques = useMemo(() => espacosEmDestaque(melhores, 4), [melhores]);
    const inicio = !listagemAvaliados && categoria === "Todos" && !termoBusca(onde);
    const listagem = useMemo(() => {
        if (!inicio || destaques.length === 0) return visiveis;
        const ids = new Set(destaques.map((espaco) => Number(espaco.id)));
        return visiveis.filter((espaco) => !ids.has(Number(espaco.id)));
    }, [visiveis, inicio, destaques]);
    const titulo = listagemAvaliados
        ? "Espaços mais bem avaliados"
        : categoria !== "Todos"
            ? categoria
            : onde.trim()
                ? `Resultados para “${onde.trim()}”`
                : "Espaços para o seu evento";

    const verMaisAvaliados = () => {
        setParams(new URLSearchParams({ ordenar: "melhor-avaliados" }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const aplicarFiltrosHome = (proximos) => {
        setFiltros(proximos);
        if (proximos.ordem === "melhor-avaliados") {
            if (params.get("ordenar") !== "melhor-avaliados") {
                setParams(new URLSearchParams({ ordenar: "melhor-avaliados" }));
            }
            return;
        }
        if (params.get("ordenar") === "melhor-avaliados") {
            const proxima = new URLSearchParams(params);
            proxima.delete("ordenar");
            setParams(proxima, { replace: true });
        }
    };

    const limparFiltros = () => {
        setFiltros(FILTRO_INICIAL);
        if (params.get("ordenar") === "melhor-avaliados") {
            const proxima = new URLSearchParams(params);
            proxima.delete("ordenar");
            setParams(proxima, { replace: true });
        }
    };

    const renderGrade = (lista) => (
        <AnimatedContent
            className={vista === "lista" ? "hm-lista" : "hm-grade"}
            trigger="mount"
            distance={28}
            duration={0.55}
            blur={2}
            stagger={0.045}
            once
        >
            {lista.map((espaco) => (
                <CardExplorar
                    key={espaco.id}
                    espaco={espaco}
                    favorito={espacoSalvo(listas, espaco.id)}
                    onFavoritar={() => setEspacoLista(espaco)}
                    dataEvento={dataAplicada}
                    compacto={vista === "lista"}
                    motivoSugestao={espaco._sugestaoMotivo}
                />
            ))}
        </AnimatedContent>
    );

    return (
        <div className="hm">
            <div className="hm-fixos hm-fixos--faixa">
                <div className={`hm-faixa${mostrarFiltros ? " hm-faixa--chips" : " hm-faixa--sem-filtros"}`}>
                    {mostrarFiltros ? (
                        <div className="hm-filtro-chips" role="toolbar" aria-label="Filtros rápidos">
                            <button
                                type="button"
                                className={`hm-chip-filtro hm-chip-filtro--principal${filtrosAtivos ? " is-ativo" : ""}`}
                                onClick={() => setFiltrosAbertos(true)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
                                    <path
                                        d="M4 6h16M7 12h10M10 18h4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                Filtros
                                {filtrosAtivos ? <span className="hm-chip-badge" aria-hidden="true" /> : null}
                            </button>
                            {comodidades.slice(0, 10).map((item) => {
                                const ativa = filtros.comodidades.includes(item.nome);
                                return (
                                    <button
                                        key={item.id || item.nome}
                                        type="button"
                                        className={`hm-chip-filtro${ativa ? " is-ativo" : ""}`}
                                        onClick={() => {
                                            setFiltros((atual) => ({
                                                ...atual,
                                                comodidades: ativa
                                                    ? atual.comodidades.filter((nome) => nome !== item.nome)
                                                    : [...atual.comodidades, item.nome],
                                            }));
                                        }}
                                    >
                                        {item.icone ? (
                                            <img src={item.icone} alt="" className="hm-chip-ico" />
                                        ) : null}
                                        {item.nome}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="hm-cats">
                            <GradualBlur position="left" width="36px" height="100%" strength={1.1} tint="var(--color-surface)" zIndex={2} />
                            <PillNav
                                ariaLabel="Categorias de espaços"
                                linkComponent={LinkCategoria}
                                items={CATEGORIAS.map((item) => ({
                                    label: item.rotulo,
                                    href: item.id,
                                    icon: <IconeCategoria id={item.id} />
                                }))}
                                activeHref={categoria}
                                onItemClick={(item) => escolherCategoria(item.href)}
                                itemStyle="plain"
                                hoverEffect="glide"
                                indicator="dot"
                                layout="split"
                                surface="none"
                                size="md"
                                bounce={0.2}
                                stretch={0.5}
                                collapse="auto"
                                intro
                                theme={tema === "dark" ? "dark" : "light"}
                                textColor={tema === "dark" ? "#F7F0DF" : "#130501"}
                                highlightColor="#FECB5A"
                                highlightTextColor="#130501"
                            />
                            <GradualBlur position="right" width="36px" height="100%" strength={1.1} tint="var(--color-surface)" zIndex={2} />
                        </div>
                    )}
                </div>
            </div>

            <div className="hm-conteudo">
                {inicio && (
                    <MelhorAvaliados
                        espacos={destaques}
                        listas={listas}
                        onFavoritar={setEspacoLista}
                        onVerMais={verMaisAvaliados}
                        dataEvento={dataAplicada}
                    />
                )}
                <div className="hm-resumo">
                    <BlurText
                        text={titulo}
                        className="hm-titulo-anim"
                        animateBy="words"
                        effect="blur"
                        direction="bottom"
                        delay={70}
                        blur={8}
                        distance={16}
                        trigger="load"
                    />
                    {!carregando && !erro && (
                        <p>{listagem.length === 1 ? "1 espaço" : `${listagem.length} espaços`}</p>
                    )}
                </div>

                {erro ? (
                    <div className="hm-estado" role="alert">
                        <p>Não conseguimos carregar os espaços agora.</p>
                        <button
                            type="button"
                            className="hm-btn hm-btn--primario"
                            onClick={() => (
                                params.get("ordenar") === "melhor-avaliados"
                                    ? buscar("", "melhor-avaliados")
                                    : buscar(categoria !== "Todos" ? categoria : termoBusca(onde))
                            )}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : carregando ? (
                    <EsqueletoGrade />
                ) : listagem.length === 0 ? (
                    <>
                        <div className="hm-estado">
                            <p>Nenhum espaço encontrado com esses filtros. Tente outra cidade, data ou menos comodidades.</p>
                        </div>
                        {sugestoes.length > 0 && (
                            <section className="hm-sugestoes" aria-labelledby="hm-sugestoes-titulo">
                                <div className="hm-sugestoes-cab">
                                    <h2 id="hm-sugestoes-titulo">Sugestões próximas da sua busca</h2>
                                    <p>
                                        Espaços com capacidade, preço ou disponibilidade parecidos —
                                        os mais bem avaliados aparecem primeiro.
                                    </p>
                                </div>
                                {vista === "mapa" ? (
                                    <MapaEspacos espacos={sugestoes} />
                                ) : (
                                    renderGrade(sugestoes)
                                )}
                            </section>
                        )}
                    </>
                ) : vista === "mapa" ? (
                    <MapaEspacos espacos={listagem} />
                ) : (
                    renderGrade(listagem)
                )}
            </div>

            <div
                className={`hm-alternar-wrap${rodapeVisivel ? " hm-alternar-wrap--oculto" : ""}`}
                aria-hidden={rodapeVisivel ? "true" : undefined}
            >
                <JellyRadio
                    className="hm-alternar"
                    ariaLabel="Modo de visualização"
                    size="lg"
                    gap={12}
                    items={[
                        { value: "grade", label: "Grade" },
                        { value: "lista", label: "Lista" },
                        { value: "mapa", label: "Mapa" },
                    ]}
                    value={vista}
                    onChange={setVista}
                    {...jellyTema}
                />
            </div>

            <div ref={rodapeRef}>
                <HomeRodape />
            </div>

            <ModalFiltros
                aberto={filtrosAbertos}
                filtros={filtros}
                comodidades={comodidades}
                espacos={espacos}
                espacosMelhorAvaliados={melhores}
                pessoas={pessoasAplicadas}
                semVaga={dataAplicada ? semVaga : []}
                onChange={aplicarFiltrosHome}
                onLimpar={limparFiltros}
                onFechar={() => setFiltrosAbertos(false)}
            />
            <SalvarLista
                espaco={espacoLista}
                listas={listas}
                usuarioId={usuarioLogado?.id}
                onFechar={() => setEspacoLista(null)}
                onListas={setListas}
            />
        </div>
    );
}
