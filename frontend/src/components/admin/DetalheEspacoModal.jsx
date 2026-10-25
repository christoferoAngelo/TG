import { useEffect, useState } from "react";
import { interpretarRegras } from "../../pages/novo espaco/regrasTexto";
import { listarDocumentosEspaco } from "../../services/documentoService";
import { rotuloDocumento } from "../documento/rotulosDocumento";
import StatusDocumento from "../documento/StatusDocumento";

function dinheiro(valor) {
    if (valor == null || valor === "") return null;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return null;
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hora(valor) {
    if (valor == null || valor === "") return null;
    if (Array.isArray(valor)) {
        const [h, m] = valor;
        return `${String(h).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
    }
    const texto = String(valor);
    return texto.length >= 5 ? texto.slice(0, 5) : texto;
}

function enderecoLinha(endereco) {
    if (!endereco) return "Endereço não informado.";
    const rua = [endereco.logradouro, endereco.numero].filter(Boolean).join(", ");
    const complemento = endereco.complemento ? ` · ${endereco.complemento}` : "";
    const bairro = [endereco.bairro, endereco.cidade && endereco.estado
        ? `${endereco.cidade}/${endereco.estado}`
        : endereco.cidade || endereco.estado].filter(Boolean).join(", ");
    const cep = endereco.cep ? `CEP ${endereco.cep}` : "";
    return [rua && `${rua}${complemento}`, bairro, cep].filter(Boolean).join(" · ");
}

function fotosDoEspaco(espaco) {
    const fotos = [];
    (espaco?.ambientes || []).forEach((ambiente) => {
        (ambiente.imagensUrls || []).forEach((url) => {
            if (url) fotos.push({ url, ambiente: ambiente.titulo || "Ambiente" });
        });
    });
    return fotos;
}

function Linha({ rotulo, valor }) {
    if (valor == null || valor === "") return null;
    return (
        <div className="adm-detalhe-linha">
            <span>{rotulo}</span>
            <strong>{valor}</strong>
        </div>
    );
}

export default function DetalheEspacoModal({
    espaco,
    carregando,
    erro,
    processando,
    onFechar,
    onAprovar,
    onRecusar,
}) {
    const [documentos, setDocumentos] = useState([]);
    const [docsEstado, setDocsEstado] = useState("carregando");
    const [docsErro, setDocsErro] = useState("");

    useEffect(() => {
        const fecharComEscape = (evento) => {
            if (evento.key === "Escape") onFechar();
        };
        window.addEventListener("keydown", fecharComEscape);
        return () => window.removeEventListener("keydown", fecharComEscape);
    }, [onFechar]);

    useEffect(() => {
        if (!espaco?.id) return undefined;
        let ativo = true;
        setDocsEstado("carregando");
        setDocsErro("");
        listarDocumentosEspaco(espaco.id)
            .then((lista) => {
                if (!ativo) return;
                setDocumentos(Array.isArray(lista) ? lista : []);
                setDocsEstado("pronto");
            })
            .catch((error) => {
                if (!ativo) return;
                setDocumentos([]);
                setDocsErro(error.message || "Não foi possível carregar os documentos deste espaço.");
                setDocsEstado("erro");
            });
        return () => {
            ativo = false;
        };
    }, [espaco?.id]);

    const regras = interpretarRegras(espaco?.restricoesHorario);
    const fotos = fotosDoEspaco(espaco);
    const caracteristicas = [...(espaco?.caracteristicas || [])]
        .map((item) => item?.nome)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const adicionais = Object.entries(regras.adicionais || {});
    const abertura = hora(espaco?.horarioAbertura);
    const fechamento = hora(espaco?.horarioFechamento);
    const funcionamento = abertura && fechamento
        ? `${abertura} às ${fechamento}${espaco?.fechaNoDiaSeguinte ? " (fecha no dia seguinte)" : ""}`
        : null;
    const modalidades = [
        espaco?.permitePeriodoIntegral ? "Período integral" : null,
        espaco?.permiteMeioPeriodo ? "Meio período" : null,
        espaco?.permiteHorarioPersonalizado ? "Horário personalizado" : null,
    ].filter(Boolean).join(", ");
    const antecedencia = espaco?.antecedenciaMinimaDias > 0
        ? `${espaco.antecedenciaMinimaDias} dia(s)`
        : "No mesmo dia";
    const prazo = espaco?.prazoCancelamentoDias > 0
        ? `Até ${espaco.prazoCancelamentoDias} dia(s) antes do evento`
        : "Até o início do evento";
    const podeAprovar = espaco?.statusAprovacao !== "APROVADO";
    const podeRecusar = espaco?.statusAprovacao !== "REJEITADO";

    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div
                className="modal-content adm-detalhe"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adm-detalhe-titulo"
                onClick={(evento) => evento.stopPropagation()}
            >
                <header className="adm-detalhe-topo">
                    <div>
                        <p className="adm-detalhe-kicker">Anúncio #{espaco?.id}</p>
                        <h3 id="adm-detalhe-titulo">{espaco?.titulo || "Espaço"}</h3>
                        <p>{enderecoLinha(espaco?.endereco)}</p>
                    </div>
                    <button type="button" className="btn btn-cancelar" onClick={onFechar}>
                        Fechar
                    </button>
                </header>

                {carregando && <p className="adm-detalhe-aviso">Carregando os dados do anúncio…</p>}
                {erro && <p className="adm-detalhe-aviso">{erro}</p>}

                {fotos.length > 0 ? (
                    <div className="adm-detalhe-fotos">
                        {fotos.map((foto) => (
                            <img key={foto.url} src={foto.url} alt={foto.ambiente} />
                        ))}
                    </div>
                ) : (
                    <p className="adm-detalhe-aviso">Este anúncio ainda não tem fotos.</p>
                )}

                <section>
                    <h4>Descrição</h4>
                    <p className="adm-detalhe-texto">{espaco?.descricao || "Sem descrição."}</p>
                </section>

                <section>
                    <h4>Documentos do espaço</h4>
                    {docsEstado === "carregando" && (
                        <p className="adm-detalhe-aviso">Carregando documentos…</p>
                    )}
                    {docsEstado === "erro" && (
                        <p className="adm-detalhe-aviso">{docsErro}</p>
                    )}
                    {docsEstado === "pronto" && documentos.length === 0 && (
                        <p className="adm-detalhe-aviso">Nenhum documento enviado para este espaço.</p>
                    )}
                    {docsEstado === "pronto" && documentos.length > 0 && (
                        <div className="adm-detalhe-docs">
                            {documentos.map((documento) => (
                                <article key={documento.id}>
                                    <div className="adm-detalhe-doc-topo">
                                        <strong>{rotuloDocumento(documento.tipoDocumento)}</strong>
                                        <StatusDocumento status={documento.status} />
                                    </div>
                                    <p>{documento.nomeArquivo || "Arquivo sem nome"}</p>
                                    {documento.dataEnvio && (
                                        <p>Enviado em {new Date(documento.dataEnvio).toLocaleString("pt-BR")}</p>
                                    )}
                                    {documento.observacao && <p>Observação: {documento.observacao}</p>}
                                    {documento.motivoRejeicao && <p>Motivo: {documento.motivoRejeicao}</p>}
                                    {documento.arquivoUrl && (
                                        <a href={documento.arquivoUrl} target="_blank" rel="noreferrer">
                                            Ver arquivo
                                        </a>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h4>Valores e capacidade</h4>
                    <Linha rotulo="Diária" valor={dinheiro(espaco?.valorDiaria)} />
                    <Linha rotulo="Meio período" valor={dinheiro(espaco?.valorMeioPeriodo)} />
                    <Linha rotulo="Hora" valor={dinheiro(espaco?.valorHora)} />
                    <Linha
                        rotulo="Capacidade"
                        valor={espaco?.capacidadePessoas ? `${espaco.capacidadePessoas} pessoas` : null}
                    />
                    <Linha
                        rotulo="Aprovação da reserva"
                        valor={espaco?.aprovacaoInstantanea ? "Instantânea" : "O locador confirma o pedido"}
                    />
                </section>

                <section>
                    <h4>Funcionamento</h4>
                    <Linha rotulo="Horário" valor={funcionamento} />
                    <Linha rotulo="Modalidades" valor={modalidades || null} />
                    <Linha
                        rotulo="Duração máxima"
                        valor={espaco?.duracaoMaxHoras ? `${espaco.duracaoMaxHoras} h` : null}
                    />
                    <Linha
                        rotulo="Intervalo de limpeza"
                        valor={espaco?.intervaloLimpezaMin ? `${espaco.intervaloLimpezaMin} min` : "Sem intervalo"}
                    />
                    <Linha rotulo="Antecedência mínima" valor={antecedencia} />
                    <Linha rotulo="Cancelamento do locador" valor={prazo} />
                </section>

                {(regras.tiposEvento.length > 0 || regras.regrasSom || regras.regrasLimpeza || regras.regrasAcesso || adicionais.length > 0) && (
                    <section>
                        <h4>Regras do anúncio</h4>
                        {regras.tiposEvento.length > 0 && (
                            <div className="adm-detalhe-chips">
                                {regras.tiposEvento.map((tipo) => (
                                    <span key={tipo}>{tipo}</span>
                                ))}
                            </div>
                        )}
                        {regras.regrasSom && <p className="adm-detalhe-texto">{regras.regrasSom}</p>}
                        {regras.regrasLimpeza && <p className="adm-detalhe-texto">{regras.regrasLimpeza}</p>}
                        {regras.regrasAcesso && <p className="adm-detalhe-texto">{regras.regrasAcesso}</p>}
                        {adicionais.length > 0 && (
                            <div className="adm-detalhe-lista">
                                {adicionais.map(([nome, valor]) => (
                                    <Linha key={nome} rotulo={nome} valor={dinheiro(valor)} />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {caracteristicas.length > 0 && (
                    <section>
                        <h4>Comodidades</h4>
                        <div className="adm-detalhe-chips">
                            {caracteristicas.map((nome) => (
                                <span key={nome}>{nome}</span>
                            ))}
                        </div>
                    </section>
                )}

                {(espaco?.ambientes || []).length > 0 && (
                    <section>
                        <h4>Ambientes</h4>
                        <div className="adm-detalhe-ambientes">
                            {espaco.ambientes.map((ambiente) => (
                                <article key={ambiente.id || ambiente.titulo}>
                                    <strong>{ambiente.titulo || "Ambiente"}</strong>
                                    {ambiente.descricao && <p>{ambiente.descricao}</p>}
                                    <small>{(ambiente.imagensUrls || []).length} foto(s)</small>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {espaco?.respostaLocador && (
                    <section>
                        <h4>Mensagem do locador</h4>
                        <p className="adm-detalhe-texto">{espaco.respostaLocador}</p>
                    </section>
                )}

                {espaco?.motivoRejeicao && (
                    <section>
                        <h4>Motivo da recusa</h4>
                        <p className="adm-detalhe-texto">{espaco.motivoRejeicao}</p>
                    </section>
                )}

                <div className="adm-detalhe-acoes">
                    <a
                        className="btn btn-acao"
                        href={`/espaco/${espaco?.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Abrir anúncio
                    </a>
                    {podeRecusar && (
                        <button
                            type="button"
                            className="btn btn-reject"
                            onClick={() => onRecusar(espaco)}
                            disabled={processando}
                        >
                            Recusar
                        </button>
                    )}
                    {podeAprovar && (
                        <button
                            type="button"
                            className="btn btn-approve"
                            onClick={() => onAprovar(espaco)}
                            disabled={processando}
                        >
                            {processando ? "Salvando…" : "Aprovar"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
