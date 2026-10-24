import { useEffect, useRef, useState } from "react";

const PAINEL = { onde: "Onde", quando: "Quando", quem: "Quem" };

export default function BuscaPill({ onde, quando, pessoas, onChange, onBuscar }) {
    const [aberto, setAberto] = useState(null);
    const caixaRef = useRef(null);

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

    const resumoOnde = onde.trim() || "Cidade ou nome";
    const resumoQuando = quando ? quando.split("-").reverse().join("/") : "Data do evento";
    const resumoQuem = Number(pessoas) > 0
        ? `${pessoas} ${Number(pessoas) === 1 ? "pessoa" : "pessoas"}`
        : "Convidados";
    const vazio = {
        onde: !onde.trim(),
        quando: !quando,
        quem: !(Number(pessoas) > 0),
    };

    const buscar = (evento) => {
        evento?.preventDefault();
        setAberto(null);
        onBuscar();
    };

    return (
        <form className="hm-pill" ref={caixaRef} onSubmit={buscar} role="search">
            <div className={`hm-pill-barra${aberto ? " hm-pill-barra--aberta" : ""}`}>
                {["onde", "quando", "quem"].map((chave) => (
                    <button
                        key={chave}
                        type="button"
                        className={`hm-pill-parte${aberto === chave ? " hm-pill-parte--ativa" : ""}`}
                        aria-expanded={aberto === chave}
                        onClick={() => setAberto((atual) => (atual === chave ? null : chave))}
                    >
                        <span>{PAINEL[chave]}</span>
                        <strong className={vazio[chave] ? "hm-pill-vazio" : ""}>
                            {chave === "onde" ? resumoOnde : chave === "quando" ? resumoQuando : resumoQuem}
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

            {aberto && (
                <div className="hm-pill-painel" role="dialog" aria-label={PAINEL[aberto]}>
                    {aberto === "onde" && (
                        <label className="hm-pill-campo">
                            <span>Cidade, bairro ou nome do espaço</span>
                            <input
                                autoFocus
                                type="text"
                                value={onde}
                                placeholder="Ex: Guarulhos, chácara, salão"
                                onChange={(evento) => onChange({ onde: evento.target.value })}
                            />
                        </label>
                    )}
                    {aberto === "quando" && (
                        <label className="hm-pill-campo">
                            <span>Data do evento</span>
                            <input
                                autoFocus
                                type="date"
                                value={quando}
                                onChange={(evento) => onChange({ quando: evento.target.value })}
                            />
                            <small>Espaços sem vaga nessa data saem da busca. Se a reserva for cancelada, a data volta.</small>
                        </label>
                    )}
                    {aberto === "quem" && (
                        <div className="hm-pill-campo">
                            <span>Convidados</span>
                            <div className="hm-passo">
                                <button
                                    type="button"
                                    aria-label="Diminuir convidados"
                                    disabled={Number(pessoas) <= 0}
                                    onClick={() => onChange({ pessoas: Math.max(0, Number(pessoas) - 1) })}
                                >
                                    −
                                </button>
                                <strong>{Number(pessoas) > 0 ? pessoas : "Qualquer"}</strong>
                                <button
                                    type="button"
                                    aria-label="Aumentar convidados"
                                    onClick={() => onChange({ pessoas: Number(pessoas) + 1 })}
                                >
                                    +
                                </button>
                            </div>
                            <small>Mostra espaços com capacidade para esse número.</small>
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}
