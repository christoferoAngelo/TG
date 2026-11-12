import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlareHover from "../../../components/bits/GlareHover";
import PulseHeart from "../../../components/bits/PulseHeart";
import SpotlightCard from "../../../components/bits/SpotlightCard";
import { useAuth } from "../../../contexts/AuthContext";
import { formatarData, formatarMoeda, fotosDe, localDe, precoDe, unidadePreco } from "./explorar";

export function CardExplorar({ espaco, favorito, onFavoritar, dataEvento, compacto = false, motivoSugestao }) {
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();
    const fotos = fotosDe(espaco);
    const [indice, setIndice] = useState(0);
    const preco = precoDe(espaco);
    const foto = fotos[indice];
    const meuAnuncio = Boolean(
        usuarioLogado?.id
        && espaco?.locadorUsuarioId
        && Number(usuarioLogado.id) === Number(espaco.locadorUsuarioId)
    );

    const abrir = () => navigate(`/espaco/${espaco.id}`);
    const mover = (evento, passo) => {
        evento.stopPropagation();
        if (fotos.length < 2) return;
        setIndice((atual) => (atual + passo + fotos.length) % fotos.length);
    };

    return (
        <SpotlightCard
            className={`hm-card${compacto ? " hm-card--lista" : ""}`}
            theme="light"
            spotlightColor="#FECB5A"
            intensity={0.2}
            borderGlow={0.45}
            spotlightSize={220}
        >
            <div className="hm-card-midia">
                <GlareHover
                    className="hm-card-brilho"
                    width="100%"
                    height="100%"
                    background="transparent"
                    borderRadius="14px"
                    borderColor="transparent"
                    glareColor="#FEFBE6"
                    glareOpacity={0.42}
                    glareSize={28}
                >
                    <button type="button" className="hm-card-abrir" onClick={abrir} aria-label={`Ver ${espaco.titulo}`}>
                        {foto ? (
                            <img src={foto.url} alt={foto.ambiente} />
                        ) : (
                            <span className="hm-card-sem-foto">Sem foto</span>
                        )}
                    </button>
                </GlareHover>
                <PulseHeart
                    className="hm-coracao"
                    liked={Boolean(favorito)}
                    showCount={false}
                    size={28}
                    likedColor="#FECB5A"
                    idleColor="#717171"
                    pillColor="transparent"
                    textColor="#130501"
                    label={favorito ? "Salvo em uma lista" : "Salvar em uma lista"}
                    onChange={() => onFavoritar(espaco.id)}
                />
                {meuAnuncio && (
                    <span className="hm-selo-meu" title="Este anúncio é seu">
                        Seu anúncio
                    </span>
                )}
                {fotos.length > 1 && (
                    <>
                        <button type="button" className="hm-seta hm-seta--esq" aria-label="Foto anterior" onClick={(evento) => mover(evento, -1)}>‹</button>
                        <button type="button" className="hm-seta hm-seta--dir" aria-label="Próxima foto" onClick={(evento) => mover(evento, 1)}>›</button>
                        <div className="hm-dots" aria-hidden="true">
                            {fotos.slice(0, 6).map((_, i) => (
                                <span key={i} className={i === Math.min(indice, 5) ? "hm-dot--ativo" : ""} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button type="button" className="hm-card-texto" onClick={abrir}>
                <div className="hm-card-linha">
                    <h3>{espaco.titulo}</h3>
                    {espaco.notaMedia != null && (
                        <span className="hm-nota" aria-label={`Nota ${Number(espaco.notaMedia).toFixed(1)}`}>
                            ★ {Number(espaco.notaMedia).toFixed(1)}
                        </span>
                    )}
                </div>
                <p>{localDe(espaco)}</p>
                <p>Até {espaco.capacidadePessoas || "—"} pessoas{dataEvento ? ` · ${formatarData(dataEvento)}` : ""}</p>
                {Array.isArray(motivoSugestao) && motivoSugestao.length > 0 && (
                    <p className="hm-sugestao-motivo">{motivoSugestao.join(" · ")}</p>
                )}
                {preco != null && (
                    <p className="hm-preco">
                        <strong>{formatarMoeda(preco)}</strong> {unidadePreco(espaco)}
                    </p>
                )}
            </button>
        </SpotlightCard>
    );
}

export function EsqueletoGrade() {
    return (
        <div className="hm-grade" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
                <div className="hm-esqueleto" key={i}>
                    <span className="hm-esqueleto-foto" />
                    <span className="hm-esqueleto-linha" />
                    <span className="hm-esqueleto-linha hm-esqueleto-linha--curta" />
                    <span className="hm-esqueleto-linha hm-esqueleto-linha--preco" />
                </div>
            ))}
        </div>
    );
}

let leafletPronto = null;

function carregarLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPronto) return leafletPronto;
    leafletPronto = new Promise((resolve, reject) => {
        if (!document.querySelector("link[data-leaflet]")) {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            css.dataset.leaflet = "1";
            document.head.appendChild(css);
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error("Não foi possível carregar o mapa."));
        document.body.appendChild(script);
    });
    return leafletPronto;
}

export function MapaEspacos({ espacos }) {
    const comPonto = espacos.filter((espaco) => espaco.endereco?.latitude != null && espaco.endereco?.longitude != null);
    const moldura = useRef(null);
    const chave = comPonto.map((espaco) => `${espaco.id}:${espaco.endereco.latitude},${espaco.endereco.longitude}`).join("|");

    useEffect(() => {
        if (!moldura.current || comPonto.length === 0) return undefined;
        let mapa = null;
        let cancelado = false;
        carregarLeaflet().then((L) => {
            if (cancelado || !moldura.current) return;
            mapa = L.map(moldura.current, { scrollWheelZoom: false });
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap",
            }).addTo(mapa);
            const limites = [];
            comPonto.forEach((espaco) => {
                const ponto = [Number(espaco.endereco.latitude), Number(espaco.endereco.longitude)];
                L.marker(ponto).addTo(mapa).bindPopup(espaco.titulo || "Espaço");
                limites.push(ponto);
            });
            if (limites.length === 1) mapa.setView(limites[0], 14);
            else mapa.fitBounds(limites, { padding: [36, 36], maxZoom: 14 });
        }).catch(() => {});
        return () => {
            cancelado = true;
            if (mapa) mapa.remove();
        };
    }, [chave]);

    if (comPonto.length === 0) {
        return (
            <div className="hm-mapa-vazio">
                <p>Estes espaços ainda não têm coordenada no mapa. A lista abaixo mostra a cidade de cada um.</p>
                <ul>
                    {espacos.map((espaco) => (
                        <li key={espaco.id}>{espaco.titulo} — {espaco.endereco?.cidade || "cidade não informada"}</li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="hm-mapa">
            <div ref={moldura} className="hm-mapa-folha" role="region" aria-label="Mapa dos espaços" />
            <ul>
                {espacos.map((espaco) => (
                    <li key={espaco.id}>
                        <strong>{espaco.titulo}</strong>
                        <span>{espaco.endereco?.cidade || "Cidade não informada"}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
