import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        <article className={`hm-card${compacto ? " hm-card--lista" : ""}`}>
            <div className="hm-card-midia">
                <button type="button" className="hm-card-abrir" onClick={abrir} aria-label={`Ver ${espaco.titulo}`}>
                    {foto ? (
                        <img src={foto.url} alt={foto.ambiente} />
                    ) : (
                        <span className="hm-card-sem-foto">Sem foto</span>
                    )}
                </button>
                <button
                    type="button"
                    className={`hm-coracao${favorito ? " hm-coracao--ativo" : ""}`}
                    aria-pressed={favorito}
                    aria-label={favorito ? "Salvo em uma lista" : "Salvar em uma lista"}
                    onClick={(evento) => {
                        evento.stopPropagation();
                        onFavoritar(espaco.id);
                    }}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z" />
                    </svg>
                </button>
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
        </article>
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
