import React, { useState } from "react";
import StatusDocumento from "./StatusDocumento";
import { rotuloDocumento } from "./rotulosDocumento";

function formatarData(valor) {
    if (!valor) return null;
    return new Date(valor).toLocaleString("pt-BR");
}

export default function DocumentoCard({
    documento,
    modoAdmin = false,
    compacto = false,
    expandidoInicial = false,
    onAprovar,
    onRejeitar,
    onCorrecao,
    onVisualizar,
    forcarBotaoVisualizar = false,
}) {
    const [expandido, setExpandido] = useState(expandidoInicial && !compacto ? true : !compacto);

    if (!documento) {
        return null;
    }

    const aberto = compacto ? expandido : true;
    const dataResumo = formatarData(documento.dataEnvio) || formatarData(documento.dataAnalise);

    const abrirDocumento = () => {
        if (onVisualizar) {
            onVisualizar(documento);
            return;
        }

        if (!documento.arquivoUrl) {
            alert("Este documento não possui arquivo.");
            return;
        }

        window.open(documento.arquivoUrl, "_blank", "noopener,noreferrer");
    };

    const toggle = () => {
        if (!compacto) return;
        setExpandido((v) => !v);
    };

    return (
        <div className={`documento-card${compacto ? " documento-card--lista" : ""}${aberto ? " is-aberto" : ""}`}>
            {compacto ? (
                <button
                    type="button"
                    className="documento-card-resumo"
                    onClick={toggle}
                    aria-expanded={aberto}
                >
                    <div className="documento-card-resumo-texto">
                        <strong>{rotuloDocumento(documento.tipoDocumento)}</strong>
                        <span>
                            {rotuloDocumento(documento.categoria)}
                            {dataResumo ? ` · ${dataResumo}` : ""}
                        </span>
                    </div>
                    <StatusDocumento status={documento.status} />
                    <span className="documento-card-chevron" aria-hidden="true">
                        {aberto ? "▾" : "▸"}
                    </span>
                </button>
            ) : (
                <div className="documento-card-header">
                    <div>
                        <h3>{rotuloDocumento(documento.tipoDocumento)}</h3>
                        <span className="documento-card-categoria">
                            {rotuloDocumento(documento.categoria)}
                        </span>
                    </div>
                    <StatusDocumento status={documento.status} />
                </div>
            )}

            {aberto && (
                <>
                    <div className="documento-card-body">
                        <p>
                            <strong>Arquivo:</strong>{" "}
                            {documento.nomeArquivo || "Não informado"}
                        </p>

                        {documento.dataEnvio && (
                            <p>
                                <strong>Enviado em:</strong>{" "}
                                {formatarData(documento.dataEnvio)}
                            </p>
                        )}

                        {documento.dataAnalise && (
                            <p>
                                <strong>Analisado em:</strong>{" "}
                                {formatarData(documento.dataAnalise)}
                            </p>
                        )}

                        {documento.observacao && (
                            <p>
                                <strong>Observação:</strong>{" "}
                                {documento.observacao}
                            </p>
                        )}

                        {documento.motivoRejeicao && (
                            <div className="documento-motivo">
                                <strong>Motivo / orientação:</strong>
                                <p>{documento.motivoRejeicao}</p>
                            </div>
                        )}
                    </div>

                    <div className="documento-card-actions">
                        {(documento.arquivoUrl || forcarBotaoVisualizar) && (
                            <button type="button" className="btn" onClick={abrirDocumento}>
                                Visualizar documento
                            </button>
                        )}

                        {modoAdmin && documento.status === "PENDENTE" && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-destaque"
                                    onClick={() => onAprovar?.(documento)}
                                >
                                    Aprovar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-perigo"
                                    onClick={() => onRejeitar?.(documento)}
                                >
                                    Rejeitar
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => onCorrecao?.(documento)}
                                >
                                    Solicitar correção
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
