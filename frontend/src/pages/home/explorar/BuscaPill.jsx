import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CalendarioBusca from "./CalendarioBusca";
import { destinosDeCatalogo } from "./explorar";

const CAMPOS = [
    { id: "onde", rotulo: "Onde", vazio: "Destino" },
    { id: "quando", rotulo: "Quando", vazio: "Data" },
    { id: "quem", rotulo: "Quem", vazio: "Convidados" },
];

function formatarDataCurta(iso) {
    if (!iso) return "";
    const [ano, mes, dia] = String(iso).split("-");
    if (!ano || !mes || !dia) return iso;
    return `${dia}/${mes}/${String(ano).slice(-2)}`;
}

const PROXIMO = { onde: "quando", quando: "quem", quem: null };

export default function BuscaPill({
    onde,
    quando,
    pessoas,
    onChange,
    onBuscar,
    catalogo = [],
}) {
    const [aberto, setAberto] = useState(null);
    const [highlight, setHighlight] = useState({ left: 0, width: 0, ready: false });
    const [geo, setGeo] = useState({ status: "idle", lat: null, lng: null, erro: "" });
    const caixaRef = useRef(null);
    const barraRef = useRef(null);
    const parteRefs = useRef({});
    const inputOndeRef = useRef(null);
    const reduzir = useReducedMotion();

    const resumo = {
        onde: onde.trim() || CAMPOS[0].vazio,
        quando: quando ? formatarDataCurta(quando) : CAMPOS[1].vazio,
        quem: Number(pessoas) > 0 ? String(pessoas) : CAMPOS[2].vazio,
    };
    const vazio = {
        onde: !onde.trim(),
        quando: !quando,
        quem: !(Number(pessoas) > 0),
    };

    const destinos = useMemo(
        () => destinosDeCatalogo(catalogo, onde, geo.lat, geo.lng),
        [catalogo, onde, geo.lat, geo.lng]
    );

    const medirHighlight = () => {
        if (!aberto || !barraRef.current || !parteRefs.current[aberto]) {
            setHighlight((h) => ({ ...h, ready: false }));
            return;
        }
        const barra = barraRef.current.getBoundingClientRect();
        const parte = parteRefs.current[aberto].getBoundingClientRect();
        setHighlight({
            left: parte.left - barra.left,
            width: parte.width,
            ready: true,
        });
    };

    useLayoutEffect(() => {
        medirHighlight();
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return undefined;
        const onResize = () => medirHighlight();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return undefined;
        const fechar = (evento) => {
            if (!caixaRef.current?.contains(evento.target)) setAberto(null);
        };
        const tecla = (evento) => {
            if (evento.key === "Escape") setAberto(null);
        };
        document.addEventListener("mousedown", fechar);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", fechar);
            document.removeEventListener("keydown", tecla);
        };
    }, [aberto]);

    useEffect(() => {
        if (aberto === "onde") {
            const t = setTimeout(() => inputOndeRef.current?.focus(), 40);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [aberto]);

    const avancar = () => {
        const proximo = PROXIMO[aberto];
        if (proximo) setAberto(proximo);
        else {
            setAberto(null);
            onBuscar();
        }
    };

    const buscar = (evento) => {
        evento?.preventDefault();
        setAberto(null);
        onBuscar();
    };

    const escolherDestino = (texto) => {
        onChange({ onde: texto });
        setAberto("quando");
    };

    const pedirLocalizacao = () => {
        if (!navigator.geolocation) {
            setGeo({ status: "erro", lat: null, lng: null, erro: "Localização não disponível neste navegador." });
            return;
        }
        setGeo((g) => ({ ...g, status: "loading", erro: "" }));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGeo({ status: "ok", lat, lng, erro: "" });
                const perto = destinosDeCatalogo(catalogo, "", lat, lng);
                const cidade = perto.find((d) => d.tipo === "cidade")?.rotulo
                    || perto.find((d) => d.tipo === "espaco")?.cidade
                    || "";
                if (cidade) onChange({ onde: cidade });
                else onChange({ onde: "" });
                setAberto("quando");
            },
            () => {
                setGeo({
                    status: "erro",
                    lat: null,
                    lng: null,
                    erro: "Não foi possível obter sua localização. Busque um destino ou qualquer lugar.",
                });
            },
            { enableHighAccuracy: false, timeout: 8000 }
        );
    };

    const painelTransition = reduzir
        ? { duration: 0 }
        : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };

    const highlightTransition = reduzir
        ? { duration: 0 }
        : { type: "spring", stiffness: 380, damping: 34, mass: 0.7 };

    return (
        <form className="hm-pill" ref={caixaRef} onSubmit={buscar} role="search">
            <div
                ref={barraRef}
                className={`hm-pill-barra${aberto ? " hm-pill-barra--aberta" : ""}`}
            >
                <AnimatePresence>
                    {aberto && highlight.ready && (
                        <motion.span
                            className="hm-pill-glow"
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                x: highlight.left,
                                width: highlight.width,
                                opacity: 1,
                            }}
                            exit={{ opacity: 0 }}
                            transition={highlightTransition}
                        />
                    )}
                </AnimatePresence>

                {CAMPOS.map((campo) => (
                    <button
                        key={campo.id}
                        type="button"
                        ref={(el) => {
                            parteRefs.current[campo.id] = el;
                        }}
                        className={[
                            "hm-pill-parte",
                            `hm-pill-parte--${campo.id}`,
                            aberto === campo.id ? "hm-pill-parte--ativa" : "",
                            aberto && aberto !== campo.id ? "hm-pill-parte--dim" : "",
                        ].filter(Boolean).join(" ")}
                        aria-expanded={aberto === campo.id}
                        onClick={() => setAberto((atual) => (atual === campo.id ? null : campo.id))}
                    >
                        <span>{campo.rotulo}</span>
                        <strong className={vazio[campo.id] ? "hm-pill-vazio" : ""}>
                            {resumo[campo.id]}
                        </strong>
                    </button>
                ))}

                <button type="submit" className="hm-pill-buscar" aria-label="Buscar espaços">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {aberto && (
                    <motion.div
                        key={aberto}
                        className={`hm-pill-painel hm-pill-painel--${aberto}`}
                        role="dialog"
                        aria-label={CAMPOS.find((c) => c.id === aberto)?.rotulo}
                        initial={reduzir ? false : { opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduzir ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                        transition={painelTransition}
                        onKeyDown={(evento) => {
                            if (evento.key !== "Enter") return;
                            if (aberto === "onde" && evento.target.tagName === "INPUT") return;
                            if (aberto === "quando" || aberto === "quem") {
                                evento.preventDefault();
                                avancar();
                            }
                        }}
                    >
                        {aberto === "onde" && (
                            <div className="hm-pill-campo">
                                <label htmlFor="hm-onde-input">Sugestões de destino</label>
                                <input
                                    id="hm-onde-input"
                                    ref={inputOndeRef}
                                    type="text"
                                    value={onde}
                                    placeholder="Buscar destinos"
                                    onChange={(evento) => onChange({ onde: evento.target.value })}
                                    onKeyDown={(evento) => {
                                        if (evento.key === "Enter") {
                                            evento.preventDefault();
                                            avancar();
                                        }
                                    }}
                                />
                                <ul className="hm-sugestoes-destino" role="listbox">
                                    <li>
                                        <button
                                            type="button"
                                            className="hm-sugestao-destino"
                                            onClick={() => escolherDestino("Qualquer lugar")}
                                        >
                                            <span className="hm-sugestao-ico hm-sugestao-ico--mundo" aria-hidden="true" />
                                            <span>
                                                <strong>Buscar em qualquer lugar</strong>
                                                <small>Veja espaços em todas as cidades</small>
                                            </span>
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            className="hm-sugestao-destino"
                                            onClick={pedirLocalizacao}
                                            disabled={geo.status === "loading"}
                                        >
                                            <span className="hm-sugestao-ico hm-sugestao-ico--pin" aria-hidden="true" />
                                            <span>
                                                <strong>
                                                    {geo.status === "loading" ? "Localizando…" : "Perto de mim"}
                                                </strong>
                                                <small>Usa sua localização para sugerir destinos próximos</small>
                                            </span>
                                        </button>
                                    </li>
                                    {destinos.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                className="hm-sugestao-destino"
                                                onClick={() => escolherDestino(item.valor)}
                                            >
                                                <span
                                                    className={`hm-sugestao-ico hm-sugestao-ico--${item.tipo === "cidade" ? "cidade" : "espaco"}`}
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    <strong>{item.rotulo}</strong>
                                                    <small>
                                                        {item.subtitulo}
                                                        {item.distanciaKm != null
                                                            ? ` · ~${item.distanciaKm.toFixed(0)} km`
                                                            : ""}
                                                    </small>
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {geo.erro && <small className="hm-pill-aviso">{geo.erro}</small>}
                            </div>
                        )}

                        {aberto === "quando" && (
                            <div className="hm-pill-campo">
                                <span>Data do evento</span>
                                <CalendarioBusca
                                    valor={quando}
                                    onEscolher={(iso) => {
                                        onChange({ quando: iso });
                                        setAberto("quem");
                                    }}
                                />
                                <small>
                                    Espaços sem vaga nessa data saem da busca. Se a reserva for cancelada, a data volta.
                                </small>
                            </div>
                        )}

                        {aberto === "quem" && (
                            <div className="hm-pill-campo">
                                <span>Quantas pessoas?</span>
                                <div className="hm-pessoas-presets" role="group" aria-label="Sugestões de convidados">
                                    {[50, 100, 150, 200, 300].map((qtd) => (
                                        <button
                                            key={qtd}
                                            type="button"
                                            className={`hm-pessoas-chip${Number(pessoas) === qtd ? " is-ativo" : ""}`}
                                            onClick={() => onChange({ pessoas: qtd })}
                                        >
                                            {qtd}
                                        </button>
                                    ))}
                                </div>
                                <label className="hm-pessoas-custom" htmlFor="hm-pessoas-input">
                                    Ou digite a quantidade
                                    <input
                                        id="hm-pessoas-input"
                                        type="number"
                                        min={1}
                                        max={1500}
                                        inputMode="numeric"
                                        placeholder="Ex.: 80"
                                        value={Number(pessoas) > 0 ? pessoas : ""}
                                        onChange={(evento) => {
                                            const bruto = evento.target.value;
                                            if (bruto === "") {
                                                onChange({ pessoas: 0 });
                                                return;
                                            }
                                            const n = Math.min(1500, Math.max(1, Number(bruto) || 0));
                                            onChange({ pessoas: n });
                                        }}
                                        onKeyDown={(evento) => {
                                            if (evento.key === "Enter") {
                                                evento.preventDefault();
                                                avancar();
                                            }
                                        }}
                                    />
                                </label>
                                <small>Máximo 1.500 convidados. Enter inicia a busca.</small>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}
