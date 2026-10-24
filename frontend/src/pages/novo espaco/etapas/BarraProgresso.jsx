const ETAPAS = [
    { n: 1, titulo: "O básico", detalhe: "Apresentação e cômodos" },
    { n: 2, titulo: "Horários", detalhe: "Turnos de locação" },
    { n: 3, titulo: "Regras", detalhe: "Comodidades e restrições" },
    { n: 4, titulo: "Documentos", detalhe: "Vínculo e termos" },
];

export default function BarraProgresso({ etapa, onIr }) {
    const preenchido = (etapa / ETAPAS.length) * 100;

    return (
        <div className="ne-wizard">
            <div
                className="ne-wizard-trilha"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={ETAPAS.length}
                aria-valuenow={etapa}
                aria-label="Progresso do cadastro"
            >
                <span style={{ width: `${preenchido}%` }} />
            </div>
            <ol className="ne-wizard-passos">
                {ETAPAS.map((item) => {
                    const atual = item.n === etapa;
                    const feita = item.n < etapa;
                    return (
                        <li key={item.n}>
                            <button
                                type="button"
                                className={`ne-wizard-passo${atual ? " ne-wizard-passo--atual" : ""}${feita ? " ne-wizard-passo--feita" : ""}`}
                                disabled={item.n > etapa}
                                aria-current={atual ? "step" : undefined}
                                onClick={() => feita && onIr(item.n)}
                            >
                                <span className="ne-wizard-num">{feita ? "✓" : item.n}</span>
                                <span className="ne-wizard-rotulo">
                                    <strong>{item.titulo}</strong>
                                    <small>{item.detalhe}</small>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
