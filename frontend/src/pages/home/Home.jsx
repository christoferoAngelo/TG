import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CaixaAvisos from "../../components/notificacao/CaixaAvisos";
import BuscaPill from "./explorar/BuscaPill";
import MenuPerfil from "./explorar/MenuPerfil";
import ModalFiltros from "./explorar/ModalFiltros";
import SalvarLista from "./explorar/SalvarLista";
import { CardExplorar, EsqueletoGrade, MapaEspacos } from "./explorar/CardExplorar";
import {
    CATEGORIAS,
    FILTRO_INICIAL,
    aplicarFiltros,
    comodidadesDisponiveis,
} from "./explorar/explorar";
import { carregarListas, espacoSalvo } from "../favoritos/favoritosApi";
import JellyRadio, { jellyTema } from "../../components/ui/JellyRadio";
import AnimatedContent from "../../components/bits/AnimatedContent";
import BlurText from "../../components/bits/BlurText";
import GradualBlur from "../../components/bits/GradualBlur";
import PillNav from "../../components/bits/PillNav";
import "./Home.css";
import "./HomeExplorar.css";

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
    if (id === "Chácaras" || id === "Sítios" || id === "Áreas ao ar livre") {
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
    const navigate = useNavigate();
    const location = useLocation();
    const { usuarioLogado } = useAuth();
    const [params, setParams] = useSearchParams();
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const [onde, setOnde] = useState(params.get("q") || "");
    const [quando, setQuando] = useState(params.get("data") || "");
    const [pessoas, setPessoas] = useState(params.get("pessoas") || "0");
    const [categoria, setCategoria] = useState(params.get("cat") || "Todos");
    const [filtros, setFiltros] = useState(FILTRO_INICIAL);
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [vista, setVista] = useState("grade");
    const [listas, setListas] = useState([]);
    const [espacoLista, setEspacoLista] = useState(null);
    const [semVaga, setSemVaga] = useState([]);
    const [caracteristicasCatalogo, setCaracteristicasCatalogo] = useState([]);
    const ultimaBusca = useRef(0);

    const buscar = (termo) => {
        const idBusca = ++ultimaBusca.current;
        setCarregando(true);
        setErro(false);
        fetch(`${API_BUSCA}?q=${encodeURIComponent(termo)}`)
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
        setOnde(params.get("q") || "");
        setQuando(params.get("data") || "");
        setPessoas(params.get("pessoas") || "0");
        setCategoria(cat);
        buscar(cat !== "Todos" ? cat : termoUrl);
    }, [params]);

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

    const atualizarUrl = (proximo) => {
        const q = (proximo.onde ?? onde).trim();
        const data = proximo.quando ?? quando;
        const qtd = String(proximo.pessoas ?? pessoas);
        const cat = proximo.categoria ?? categoria;
        const busca = new URLSearchParams();
        if (cat !== "Todos") busca.set("cat", cat);
        else if (q) busca.set("q", q);
        if (data) busca.set("data", data);
        if (Number(qtd) > 0) busca.set("pessoas", qtd);
        setParams(busca, { replace: true });
    };

    const pesquisar = () => {
        atualizarUrl({ onde, quando, pessoas, categoria: "Todos" });
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
    const comodidadesDaBusca = useMemo(() => comodidadesDisponiveis(espacos), [espacos]);
    const comodidades = caracteristicasCatalogo.length > 0 ? caracteristicasCatalogo : comodidadesDaBusca;
    const filtrosAtivos = filtros.precoMin || filtros.precoMax || filtros.capacidadeMin || filtros.comodidades.length > 0 || filtros.ordem !== "relevancia";

    const titulo = categoria !== "Todos"
        ? categoria
        : onde.trim()
            ? `Resultados para “${onde.trim()}”`
            : "Espaços para o seu evento";

    return (
        <div className="hm">
            <div className="hm-fixos">
                <header className="hm-topo">
                    <button type="button" className="hm-logo" onClick={() => navigate("/home")}>
                        LocaFesta
                    </button>
                    <BuscaPill
                        onde={onde}
                        quando={quando}
                        pessoas={pessoas}
                        onChange={(parcial) => {
                            if (parcial.onde != null) setOnde(parcial.onde);
                            if (parcial.quando != null) setQuando(parcial.quando);
                            if (parcial.pessoas != null) setPessoas(String(parcial.pessoas));
                        }}
                        onBuscar={pesquisar}
                    />
                    <div className="hm-acoes">
                        <button
                            type="button"
                            className="hm-cta-anunciar"
                            onClick={() => {
                                if (!usuarioLogado) {
                                    navigate("/login", { state: { fundo: location } });
                                    return;
                                }
                                navigate(
                                    usuarioLogado.locador || usuarioLogado.isLocador
                                        ? "/perfil_locador"
                                        : "/cadastro-locador"
                                );
                            }}
                        >
                            {usuarioLogado?.locador || usuarioLogado?.isLocador ? "Meu negócio" : "Vou anunciar"}
                        </button>
                        {usuarioLogado ? <CaixaAvisos usuarioId={usuarioLogado.id} /> : null}
                        {usuarioLogado ? (
                            <button
                                type="button"
                                className="hm-listas"
                                aria-label="Favoritos"
                                onClick={() => navigate("/favoritos")}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z" />
                                </svg>
                            </button>
                        ) : null}
                        <MenuPerfil />
                    </div>
                </header>

                <div className="hm-faixa">
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
                            theme="light"
                            textColor="#130501"
                            highlightColor="#FECB5A"
                            highlightTextColor="#130501"
                        />
                        <GradualBlur position="right" width="36px" height="100%" strength={1.1} tint="var(--color-surface)" zIndex={2} />
                    </div>
                    <button
                        type="button"
                        className={`hm-filtros${filtrosAtivos ? " hm-filtros--ativo" : ""}`}
                        onClick={() => setFiltrosAbertos(true)}
                    >
                        Filtros
                    </button>
                </div>
            </div>

            <div className="hm-conteudo">
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
                        <p>{visiveis.length === 1 ? "1 espaço" : `${visiveis.length} espaços`}</p>
                    )}
                </div>

                {erro ? (
                    <div className="hm-estado" role="alert">
                        <p>Não conseguimos carregar os espaços agora.</p>
                        <button type="button" className="hm-btn hm-btn--primario" onClick={() => buscar(categoria !== "Todos" ? categoria : onde.trim())}>
                            Tentar novamente
                        </button>
                    </div>
                ) : carregando ? (
                    <EsqueletoGrade />
                ) : visiveis.length === 0 ? (
                    <div className="hm-estado">
                        <p>Nenhum espaço encontrado com esses filtros. Tente outra cidade, data ou menos comodidades.</p>
                    </div>
                ) : vista === "mapa" ? (
                    <MapaEspacos espacos={visiveis} />
                ) : (
                    <AnimatedContent
                        className={vista === "lista" ? "hm-lista" : "hm-grade"}
                        trigger="mount"
                        distance={28}
                        duration={0.55}
                        blur={2}
                        stagger={0.045}
                        once
                    >
                        {visiveis.map((espaco) => (
                            <CardExplorar
                                key={espaco.id}
                                espaco={espaco}
                                favorito={espacoSalvo(listas, espaco.id)}
                                onFavoritar={() => setEspacoLista(espaco)}
                                dataEvento={dataAplicada}
                                compacto={vista === "lista"}
                            />
                        ))}
                    </AnimatedContent>
                )}
            </div>

            <div className="hm-alternar-wrap">
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

            <ModalFiltros
                aberto={filtrosAbertos}
                filtros={filtros}
                comodidades={comodidades}
                onChange={setFiltros}
                onLimpar={() => setFiltros(FILTRO_INICIAL)}
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
