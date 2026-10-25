import { useEffect, useMemo, useRef } from "react";
import Campo from "./Campo";
import { Slider } from "../../../components/base/slider/slider";
import { calcularTurnos } from "../turnos";

export default function EtapaHorarios({ form, erros, bind, setCampo, setAdicional }) {
    const avisosRef = useRef(null);
    const fracionado = form.aceitaFracionado;

    const { turnos, avisos } = useMemo(() => {
        if (!fracionado) return { turnos: [], avisos: [] };
        return calcularTurnos({
            abertura: form.horarioAbertura,
            fechamento: form.horarioFechamento,
            duracaoHoras: form.duracaoMaxHoras,
            limpezaMin: form.intervaloLimpezaMin === "" ? NaN : Number(form.intervaloLimpezaMin),
        });
    }, [fracionado, form.horarioAbertura, form.horarioFechamento, form.duracaoMaxHoras, form.intervaloLimpezaMin]);

    const avisosChave = avisos.map((a) => a.tipo).join("|");

    useEffect(() => {
        if (!avisosChave) return;
        avisosRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [avisosChave]);

    return (
        <section className="ne-secao">
            <div className="ne-secao-cab">
                <h2>Tipo de locação</h2>
                <p>Você pode oferecer a diária, os turnos ou os dois ao mesmo tempo.</p>
            </div>
            <div className="ne-grid">
                <div className={`ne-campo ne-span-6${erros.formas ? " ne-campo--erro" : ""}`}>
                    <div className="ne-opcoes ne-opcoes--duas">
                        {[
                            ["aceitaIntegral", "Diária", "Uma reserva usa o espaço da abertura até o fechamento."],
                            ["aceitaFracionado", "Fracionada (turnos)", "Vários eventos no mesmo dia, com intervalo para limpeza."],
                        ].map(([campo, titulo, dica]) => (
                            <label key={campo} className={`ne-opcao${form[campo] ? " ne-opcao--ativa" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(form[campo])}
                                    onChange={(evento) => setCampo(campo, evento.target.checked)}
                                />
                                <span className="ne-opcao-titulo">{titulo}</span>
                                <span className="ne-opcao-dica">{dica}</span>
                            </label>
                        ))}
                    </div>
                    {erros.formas && <small className="ne-erro">{erros.formas}</small>}
                </div>

                <Campo id="ne-horarioAbertura" label="Horário de abertura" span={3} erro={erros.horarioAbertura}>
                    <input type="time" className="ne-input" {...bind("horarioAbertura")} />
                </Campo>
                <Campo id="ne-horarioFechamento" label="Horário de fechamento" span={3} erro={erros.horarioFechamento}>
                    <input type="time" className="ne-input" {...bind("horarioFechamento")} />
                </Campo>

                <div className="ne-campo ne-span-6">
                    <label className="ne-opcao ne-opcao--linha">
                        <input
                            type="checkbox"
                            checked={form.fechaNoDiaSeguinte}
                            onChange={(e) => setCampo("fechaNoDiaSeguinte", e.target.checked)}
                        />
                        <span className="ne-opcao-titulo">O fechamento é no dia seguinte</span>
                    </label>
                </div>

                <div className="ne-campo ne-span-6">
                    <span className="ne-rotulo">Confirmação da reserva</span>
                    <div className="ne-opcoes ne-opcoes--duas">
                        {[
                            [false, "Pedido para o locador", "O locatário envia um pedido e você aprova ou recusa."],
                            [true, "Aprovação instantânea", "Não há pedido. Na página do espaço ele segue direto para o pagamento."],
                        ].map(([valor, titulo, dica]) => (
                            <label
                                key={String(valor)}
                                className={`ne-opcao${Boolean(form.aprovacaoInstantanea) === valor ? " ne-opcao--ativa" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="aprovacaoInstantanea"
                                    checked={Boolean(form.aprovacaoInstantanea) === valor}
                                    onChange={() => setCampo("aprovacaoInstantanea", valor)}
                                />
                                <span className="ne-opcao-titulo">{titulo}</span>
                                <span className="ne-opcao-dica">{dica}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <Campo
                    id="ne-antecedencia"
                    label="Antecedência mínima (dias)"
                    span={3}
                    erro={erros.antecedenciaMinimaDias}
                    dica="O locatário não consegue escolher datas antes desse prazo. Use 0 para permitir o mesmo dia."
                >
                    <Slider
                        aria-label="Antecedência mínima em dias"
                        labelPosition="bottom"
                        minValue={0}
                        maxValue={60}
                        step={1}
                        value={[Number(form.antecedenciaMinimaDias) || 0]}
                        labelFormatter={(valor) => `${valor} dias`}
                        onChange={([valor]) => setCampo("antecedenciaMinimaDias", String(valor))}
                    />
                </Campo>
                <Campo
                    id="ne-prazo-cancelamento"
                    label="Prazo para você cancelar (dias)"
                    span={3}
                    erro={erros.prazoCancelamentoDias}
                    dica="Depois de confirmada, você só cancela até esse número de dias antes do evento. O locatário recebe reembolso total."
                >
                    <Slider
                        aria-label="Prazo para cancelar em dias"
                        labelPosition="bottom"
                        minValue={0}
                        maxValue={30}
                        step={1}
                        value={[form.prazoCancelamentoDias === "" ? 2 : Number(form.prazoCancelamentoDias)]}
                        labelFormatter={(valor) => `${valor} dias`}
                        onChange={([valor]) => setCampo("prazoCancelamentoDias", String(valor))}
                    />
                </Campo>

                {fracionado && (
                    <>
                        <Campo
                            id="ne-duracaoMaxHoras"
                            label="Duração do evento (horas)"
                            span={3}
                            erro={erros.duracaoMaxHoras}
                        >
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                inputMode="decimal"
                                className="ne-input"
                                placeholder="Ex: 4"
                                {...bind("duracaoMaxHoras")}
                            />
                        </Campo>
                        <Campo
                            id="ne-intervaloLimpezaMin"
                            label="Tempo de limpeza (minutos)"
                            span={3}
                            erro={erros.intervaloLimpezaMin}
                            dica="Intervalo livre entre uma reserva e a próxima."
                        >
                            <input
                                type="number"
                                min="0"
                                step="5"
                                inputMode="numeric"
                                className="ne-input"
                                placeholder="60"
                                {...bind("intervaloLimpezaMin")}
                            />
                        </Campo>

                        {avisos.length > 0 && (
                            <div className="ne-campo ne-span-6 ne-alertas" ref={avisosRef}>
                                {avisos.map((aviso) => (
                                    <p
                                        key={aviso.tipo}
                                        className={`ne-alerta ne-alerta--${aviso.nivel}`}
                                        role="status"
                                    >
                                        {aviso.mensagem}
                                    </p>
                                ))}
                            </div>
                        )}

                        {turnos.length > 0 && (
                            <div className="ne-campo ne-span-6">
                                <span className="ne-rotulo">Turnos do dia</span>
                                <div className="ne-turnos">
                                    {turnos.map((turno) => {
                                        const extra = form.adicionais[turno.chave];
                                        const aberto = extra !== undefined;
                                        return (
                                            <article className="ne-turno" key={turno.chave}>
                                                <div>
                                                    <strong>Turno {turno.numero}</strong>
                                                    <p>{turno.inicio} às {turno.fim}</p>
                                                </div>
                                                {aberto ? (
                                                    <label className="ne-turno-extra">
                                                        <span>Acréscimo (R$)</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            inputMode="decimal"
                                                            className="ne-input"
                                                            placeholder="200"
                                                            value={extra}
                                                            onChange={(e) => setAdicional(turno.chave, e.target.value)}
                                                        />
                                                    </label>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="ne-btn ne-btn--ghost"
                                                        onClick={() => setAdicional(turno.chave, "")}
                                                    >
                                                        + Adicional
                                                    </button>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
