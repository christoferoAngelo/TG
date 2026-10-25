import Campo from "./Campo";
import SpringCheck from "../../../components/bits/SpringCheck";

export default function EtapaRegras({
    form,
    caracteristicasDisponiveis,
    toggleCaracteristica,
    bind,
}) {
    return (
        <>
            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Comodidades</h2>
                    <p>Marque o que o espaço oferece. A lista vem das características cadastradas.</p>
                </div>
                {caracteristicasDisponiveis.length === 0 ? (
                    <p className="ne-vazio">Nenhuma característica cadastrada no sistema.</p>
                ) : (
                    <div className="ne-chips">
                        {caracteristicasDisponiveis.map((item) => {
                            const marcado = form.caracteristicas.some((c) => c.id === item.id);
                            return (
                                <SpringCheck
                                    key={item.id}
                                    label={item.nome}
                                    checked={marcado}
                                    onChange={() => toggleCaracteristica(item)}
                                    color="#130501"
                                    fillColor="#FECB5A"
                                    checkColor="#130501"
                                    boxSize={22}
                                    fontSize={15}
                                    doneOpacity={1}
                                    strikeLag={1}
                                />
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Regras do espaço</h2>
                    <p>Descreva com as suas palavras. Estes textos aparecem para quem for alugar.</p>
                </div>
                <div className="ne-grid">
                    <Campo id="ne-regrasSom" label="Regras gerais e de som" opcional>
                        <textarea
                            className="ne-textarea"
                            rows={4}
                            maxLength={800}
                            placeholder="Ex: Som alto até 22h, proibido DJ."
                            {...bind("regrasSom")}
                        />
                    </Campo>
                    <Campo id="ne-regrasLimpeza" label="Regras de limpeza e danos" opcional>
                        <textarea
                            className="ne-textarea"
                            rows={4}
                            maxLength={800}
                            placeholder="Ex: Entregar varrido e colocar o lixo no contêiner."
                            {...bind("regrasLimpeza")}
                        />
                    </Campo>
                    <Campo id="ne-regrasAcesso" label="Segurança e acesso" opcional>
                        <textarea
                            className="ne-textarea"
                            rows={4}
                            maxLength={800}
                            placeholder="Ex: Câmeras na área externa e chaves com o caseiro."
                            {...bind("regrasAcesso")}
                        />
                    </Campo>
                </div>
            </section>
        </>
    );
}
