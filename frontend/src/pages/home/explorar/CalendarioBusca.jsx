import { useEffect, useState } from "react";

const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDia(ano, mes, dia) {
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function CalendarioBusca({ valor, minima, onEscolher }) {
    const min = minima || hojeISO();
    const base = valor && valor >= min ? valor : min;
    const [ano, setAno] = useState(() => Number(base.slice(0, 4)));
    const [mes, setMes] = useState(() => Number(base.slice(5, 7)));

    useEffect(() => {
        const proximo = valor && valor >= min ? valor : min;
        setAno(Number(proximo.slice(0, 4)));
        setMes(Number(proximo.slice(5, 7)));
    }, [valor, min]);

    const primeiro = new Date(ano, mes - 1, 1).getDay();
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const celulas = [
        ...Array.from({ length: primeiro }, () => null),
        ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
    ];
    const mesChave = isoDia(ano, mes, 1).slice(0, 7);
    const podeVoltar = mesChave > min.slice(0, 7);

    const mover = (delta) => {
        const data = new Date(ano, mes - 1 + delta, 1);
        setAno(data.getFullYear());
        setMes(data.getMonth() + 1);
    };

    return (
        <div className="hm-cal">
            <div className="hm-cal-nav">
                <button type="button" onClick={() => mover(-1)} disabled={!podeVoltar} aria-label="Mês anterior">
                    ‹
                </button>
                <strong>
                    {MESES[mes - 1]} {ano}
                </strong>
                <button type="button" onClick={() => mover(1)} aria-label="Próximo mês">
                    ›
                </button>
            </div>
            <div className="hm-cal-grade" role="grid" aria-label="Calendário">
                {DIAS.map((dia) => (
                    <span key={dia} className="hm-cal-semana">
                        {dia}
                    </span>
                ))}
                {celulas.map((dia, indice) => {
                    if (!dia) return <span key={`vazio-${indice}`} className="hm-cal-vazio" />;
                    const iso = isoDia(ano, mes, dia);
                    const bloqueado = iso < min;
                    const hoje = iso === hojeISO();
                    return (
                        <button
                            key={iso}
                            type="button"
                            role="gridcell"
                            className={[
                                "hm-cal-dia",
                                iso === valor ? "hm-cal-dia--ativo" : "",
                                hoje ? "hm-cal-dia--hoje" : "",
                            ].filter(Boolean).join(" ")}
                            disabled={bloqueado}
                            aria-pressed={iso === valor}
                            onClick={() => onEscolher(iso)}
                        >
                            {dia}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
