import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlareHover from "../../../components/bits/GlareHover";
import PulseHeart from "../../../components/bits/PulseHeart";
import SpotlightCard from "../../../components/bits/SpotlightCard";
import { formatarData, formatarMoeda, fotosDe, localDe, precoDe, unidadePreco } from "./explorar";

export function CardExplorar({ espaco, favorito, onFavoritar, dataEvento, compacto = false }) {
    const navigate = useNavigate();
    const fotos = fotosDe(espaco);
    const [indice, setIndice] = useState(0);
    const preco = precoDe(espaco);
    const foto = fotos[indice];

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
                    size={34}
                    likedColor="#FECB5A"
                    idleColor="#FEFBE6"
                    pillColor="#FEFBE6"
                    textColor="#130501"
                    label={favorito ? "Salvo em uma lista" : "Salvar em uma lista"}
                    onChange={() => onFavoritar(espaco.id)}
                />
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

export function MapaEspacos({ espacos }) {
    const comPonto = espacos.filter((espaco) => espaco.endereco?.latitude != null && espaco.endereco?.longitude != null);

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

    const lats = comPonto.map((espaco) => espaco.endereco.latitude);
    const lngs = comPonto.map((espaco) => espaco.endereco.longitude);
    const margem = 0.04;
    const bbox = [
        Math.min(...lngs) - margem,
        Math.min(...lats) - margem,
        Math.max(...lngs) + margem,
        Math.max(...lats) + margem,
    ].join(",");
    const primeiro = comPonto[0].endereco;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${primeiro.latitude}%2C${primeiro.longitude}`;

    return (
        <div className="hm-mapa">
            <iframe title="Mapa dos espaços" src={src} loading="lazy" />
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
