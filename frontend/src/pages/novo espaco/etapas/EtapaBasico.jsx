import { useState } from "react";
import Campo from "./Campo";
import BotaoImagem from "../../../components/ui/BotaoImagem";
import { TIPOS_EVENTO } from "../tiposEvento";

const COMISSAO = 0.1;

const moeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EtapaBasico({
    form,
    erros,
    bind,
    bindEnd,
    setEndereco,
    handleCep,
    buscandoCep,
    cepNaoEncontrado,
    numeroRef,
    toggleTipoEvento,
    ambientes,
    avisoFotos,
    adicionarAmbiente,
    removerAmbiente,
    atualizarAmbiente,
    adicionarFotos,
    removerFoto,
    fotoCapaId,
    definirCapa,
}) {
    const [buscaTipo, setBuscaTipo] = useState("");
    const valorBase = Number(form.valorDiaria);
    const valorInformado = valorBase > 0;
    const centavos = valorInformado ? Math.round(valorBase * 100) : 0;
    const comissaoCentavos = Math.round(centavos * COMISSAO);
    const recebeCentavos = centavos - comissaoCentavos;
    const termoTipo = buscaTipo.trim().toLocaleLowerCase("pt-BR");
    const extrasTipo = form.tiposEvento.filter((tipo) => !TIPOS_EVENTO.includes(tipo));
    const tiposVisiveis = [...TIPOS_EVENTO, ...extrasTipo].filter((tipo) =>
        tipo.toLocaleLowerCase("pt-BR").includes(termoTipo)
    );

    return (
        <>
            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Apresentação</h2>
                    <p>O que aparece no topo do anúncio e na busca.</p>
                </div>
                <div className="ne-grid">
                    <Campo id="ne-titulo" label="Nome do espaço" erro={erros.titulo}>
                        <input
                            type="text"
                            className="ne-input"
                            maxLength={150}
                            placeholder="Ex: Sítio Recanto das Festas"
                            {...bind("titulo")}
                        />
                    </Campo>
                    <Campo id="ne-descricao" label="Descrição" erro={erros.descricao}>
                        <textarea
                            className="ne-textarea"
                            rows={4}
                            maxLength={2000}
                            placeholder="Ex: Amplo espaço com área verde, ideal para confraternizações."
                            {...bind("descricao")}
                        />
                    </Campo>
                    <div
                        className={`ne-campo ne-span-6${erros.tiposEvento ? " ne-campo--erro" : ""}`}
                        data-erro={erros.tiposEvento ? "true" : undefined}
                    >
                        <span className="ne-rotulo">Tipos de eventos</span>
                        <input
                            id="ne-busca-tipo"
                            type="search"
                            className="ne-input ne-busca-tipo"
                            placeholder="Buscar tipo de evento"
                            value={buscaTipo}
                            onChange={(evento) => setBuscaTipo(evento.target.value)}
                        />
                        <p className="ne-dica">
                            {form.tiposEvento.length === 1
                                ? "1 tipo selecionado"
                                : `${form.tiposEvento.length} tipos selecionados`}
                        </p>
                        <div className="ne-chips ne-chips-rolagem" role="group" aria-label="Tipos de eventos">
                            {tiposVisiveis.length === 0 ? (
                                <p className="ne-dica">Nenhum tipo com esse nome.</p>
                            ) : (
                                tiposVisiveis.map((tipo) => {
                                    const marcado = form.tiposEvento.includes(tipo);
                                    return (
                                        <label key={tipo} className="ne-chip">
                                            <input
                                                type="checkbox"
                                                className="ne-sr"
                                                checked={marcado}
                                                onChange={() => toggleTipoEvento(tipo)}
                                            />
                                            <span className={marcado ? "ne-chip-ativo" : ""}>{tipo}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {erros.tiposEvento && <small className="ne-erro">{erros.tiposEvento}</small>}
                    </div>
                    <Campo
                        id="ne-valorDiaria"
                        label="Valor cobrado na reserva (R$)"
                        span={6}
                        erro={erros.valorDiaria}
                    >
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            className="ne-input ne-valor-input"
                            placeholder="5000"
                            {...bind("valorDiaria")}
                        />
                        <div className="ne-repasse" aria-live="polite">
                            <p>
                                No período integral, este é o valor da diária. Nos turnos, é o valor de cada turno, antes do acréscimo.
                                A LocaFesta fica com 10% de comissão. Você recebe o restante.
                            </p>
                            <div className="ne-repasse-linha ne-repasse-linha--voce">
                                <span>Você recebe por reserva</span>
                                <strong>{valorInformado ? moeda(recebeCentavos / 100) : "—"}</strong>
                            </div>
                            <div className="ne-repasse-linha">
                                <span>Comissão da LocaFesta (10%)</span>
                                <strong>{valorInformado ? moeda(comissaoCentavos / 100) : "—"}</strong>
                            </div>
                        </div>
                    </Campo>
                    <Campo id="ne-capacidadePessoas" label="Capacidade (pessoas)" span={3} erro={erros.capacidadePessoas}>
                        <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            className="ne-input"
                            placeholder="100"
                            {...bind("capacidadePessoas")}
                        />
                    </Campo>
                </div>
            </section>

            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Onde fica</h2>
                    <p>O endereço é obrigatório para o anúncio aparecer na busca. O CEP completa o restante.</p>
                </div>
                <div className="ne-grid">
                    <Campo
                        id="ne-end-cep"
                        label="CEP"
                        span={2}
                        erro={erros.end_cep || (cepNaoEncontrado ? "CEP não encontrado. Preencha o endereço manualmente." : "")}
                        dica={buscandoCep ? "Buscando endereço…" : undefined}
                    >
                        <input
                            type="text"
                            inputMode="numeric"
                            className="ne-input"
                            placeholder="00000-000"
                            {...bindEnd("cep")}
                            onChange={(e) => handleCep(e.target.value)}
                        />
                    </Campo>
                    <Campo id="ne-end-logradouro" label="Rua ou avenida" span={4} erro={erros.end_logradouro}>
                        <input type="text" className="ne-input" {...bindEnd("logradouro")} />
                    </Campo>
                    <Campo id="ne-end-numero" label="Número" span={2} erro={erros.end_numero}>
                        <input type="text" className="ne-input" ref={numeroRef} {...bindEnd("numero")} />
                    </Campo>
                    <Campo id="ne-end-complemento" label="Complemento" opcional span={4}>
                        <input
                            type="text"
                            className="ne-input"
                            placeholder="Salão 2, Bloco B…"
                            {...bindEnd("complemento")}
                        />
                    </Campo>
                    <Campo id="ne-end-bairro" label="Bairro" span={3} erro={erros.end_bairro}>
                        <input type="text" className="ne-input" {...bindEnd("bairro")} />
                    </Campo>
                    <Campo id="ne-end-cidade" label="Cidade" span={2} erro={erros.end_cidade}>
                        <input type="text" className="ne-input" {...bindEnd("cidade")} />
                    </Campo>
                    <Campo id="ne-end-estado" label="UF" span={1} erro={erros.end_estado}>
                        <input
                            type="text"
                            className="ne-input"
                            maxLength={2}
                            placeholder="SP"
                            value={form.endereco.estado}
                            id="ne-end-estado"
                            aria-invalid={erros.end_estado ? "true" : undefined}
                            onChange={(e) => setEndereco("estado", e.target.value.toUpperCase())}
                        />
                    </Campo>
                </div>
            </section>

            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Cômodos e ambientes</h2>
                    <p>Cada cômodo vira uma galeria no anúncio, com nome, descrição e fotos.</p>
                </div>
                <div className="ne-ambientes">
                    {erros.ambientes && <p className="ne-erro ne-erro--bloco" data-erro="true">{erros.ambientes}</p>}
                    {avisoFotos && <p className="ne-aviso">{avisoFotos}</p>}
                    {ambientes.map((amb, indice) => {
                        const erroAmb = erros.amb?.[amb.id] || {};
                        return (
                            <article className="ne-ambiente" key={amb.id}>
                                <div className="ne-ambiente-cab">
                                    <h3>Cômodo {indice + 1}</h3>
                                    {ambientes.length > 1 && (
                                        <button
                                            type="button"
                                            className="ne-btn ne-btn--perigo"
                                            onClick={() => removerAmbiente(amb.id)}
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <div className="ne-grid">
                                    <Campo id={`ne-amb-${amb.id}-titulo`} label="Nome do cômodo" erro={erroAmb.titulo}>
                                        <input
                                            id={`ne-amb-${amb.id}-titulo`}
                                            type="text"
                                            className="ne-input"
                                            maxLength={100}
                                            placeholder="Ex: Área da piscina"
                                            value={amb.titulo}
                                            aria-invalid={erroAmb.titulo ? "true" : undefined}
                                            onChange={(e) => atualizarAmbiente(amb.id, "titulo", e.target.value)}
                                        />
                                    </Campo>
                                    <Campo id={`ne-amb-${amb.id}-descricao`} label="Descrição" opcional>
                                        <textarea
                                            id={`ne-amb-${amb.id}-descricao`}
                                            className="ne-textarea"
                                            rows={3}
                                            maxLength={800}
                                            placeholder="Ex: Piscina de 1,4 m de profundidade."
                                            value={amb.descricao}
                                            onChange={(e) => atualizarAmbiente(amb.id, "descricao", e.target.value)}
                                        />
                                    </Campo>
                                    <div
                                        className={`ne-campo ne-span-6 ne-fotos${erroAmb.fotos ? " ne-campo--erro" : ""}`}
                                        data-erro={erroAmb.fotos ? "true" : undefined}
                                    >
                                        <span className="ne-rotulo">Fotos do cômodo</span>
                                        <p className="ne-dica">
                                            Até 8 fotos neste cômodo e 24 no anúncio. Clique em “Usar como capa” para
                                            escolher a imagem principal do anúncio.
                                        </p>
                                        <div className="ne-fotos">
                                            {amb.fotos.map((foto) => (
                                                <figure
                                                    className={`ne-foto${fotoCapaId === foto.id ? " ne-foto--capa" : ""}`}
                                                    key={foto.id}
                                                >
                                                    <img src={foto.preview || foto.url} alt="" />
                                                    <button
                                                        type="button"
                                                        className="ne-foto-remover"
                                                        onClick={() => removerFoto(amb.id, foto.id)}
                                                        aria-label="Remover foto"
                                                    >
                                                        ×
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ne-foto-capa"
                                                        onClick={() => definirCapa?.(foto.id)}
                                                        aria-pressed={fotoCapaId === foto.id}
                                                    >
                                                        {fotoCapaId === foto.id ? "Capa" : "Usar como capa"}
                                                    </button>
                                                </figure>
                                            ))}
                                            <BotaoImagem
                                                className="ne-foto-add-btn"
                                                accept="image/*"
                                                multiple
                                                compacto
                                                rotulo="Adicionar fotos"
                                                rotuloTroca="Adicionar mais fotos"
                                                dica="Até 8 por cômodo"
                                                onChange={(e) => {
                                                    adicionarFotos(amb.id, e.target.files);
                                                    e.target.value = "";
                                                }}
                                            />
                                        </div>
                                        {erroAmb.fotos && <small className="ne-erro">{erroAmb.fotos}</small>}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                    <button type="button" className="ne-btn ne-btn--ghost ne-btn--largo" onClick={adicionarAmbiente}>
                        + Adicionar cômodo/ambiente
                    </button>
                </div>
            </section>
        </>
    );
}
