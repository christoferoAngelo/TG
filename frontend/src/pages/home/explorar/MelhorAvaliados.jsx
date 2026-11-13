import { useRef } from "react";
import { espacoSalvo } from "../../favoritos/favoritosApi";
import { CardExplorar } from "./CardExplorar";
import { qtdAvaliacoes } from "./explorar";

export function espacosEmDestaque(espacos, limite = 4) {
    return (espacos || [])
        .filter((espaco) => espaco?.notaMedia != null && qtdAvaliacoes(espaco) > 0)
        .slice(0, limite);
}

export default function MelhorAvaliados({ espacos, listas, onFavoritar, onVerMais, dataEvento }) {
    const faixa = useRef(null);
    if (!espacos.length) return null;

    const rolar = (direcao) => {
        const el = faixa.current;
        if (!el) return;
        el.scrollBy({ left: direcao * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
    };

    return (
        <section className="hm-avaliados" aria-labelledby="hm-avaliados-titulo">
            <div className="hm-avaliados-cab">
                <h2 id="hm-avaliados-titulo">Espaços mais bem avaliados</h2>
                <div className="hm-avaliados-acoes">
                    <button type="button" className="hm-avaliados-ver" onClick={onVerMais}>
                        Ver mais
                    </button>
                    <button type="button" className="hm-avaliados-seta" aria-label="Anterior" onClick={() => rolar(-1)}>
                        ‹
                    </button>
                    <button type="button" className="hm-avaliados-seta" aria-label="Próximo" onClick={() => rolar(1)}>
                        ›
                    </button>
                </div>
            </div>
            <div className="hm-avaliados-faixa" ref={faixa}>
                {espacos.map((espaco) => (
                    <CardExplorar
                        key={espaco.id}
                        espaco={espaco}
                        favorito={espacoSalvo(listas, espaco.id)}
                        onFavoritar={() => onFavoritar(espaco)}
                        dataEvento={dataEvento}
                    />
                ))}
            </div>
        </section>
    );
}
