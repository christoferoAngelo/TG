import React from "react";
import StatusDocumento from "./StatusDocumento";

export default function DocumentoCard({
    documento,
    modoAdmin = false,
    onAprovar,
    onRejeitar,
    onCorrecao
}) {

    if (!documento) {
        return null;
    }

    const abrirDocumento = () => {

        if (!documento.arquivoUrl) {
            alert("Este documento não possui arquivo.");
            return;
        }

        window.open(
            documento.arquivoUrl,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className="documento-card">

            <div className="documento-card-header">

                <div>
                    <h3>
                        {documento.tipoDocumento}
                    </h3>

                    <span>
                        {documento.categoria}
                    </span>
                </div>

                <StatusDocumento
                    status={documento.status}
                />

            </div>


            <div className="documento-card-body">

                <p>
                    <strong>Arquivo:</strong>{" "}
                    {documento.nomeArquivo || "Não informado"}
                </p>

                {documento.dataEnvio && (
                    <p>
                        <strong>Enviado em:</strong>{" "}
                        {new Date(
                            documento.dataEnvio
                        ).toLocaleString("pt-BR")}
                    </p>
                )}

                {documento.dataAnalise && (
                    <p>
                        <strong>Analisado em:</strong>{" "}
                        {new Date(
                            documento.dataAnalise
                        ).toLocaleString("pt-BR")}
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

                        <strong>
                            Motivo / orientação:
                        </strong>

                        <p>
                            {documento.motivoRejeicao}
                        </p>

                    </div>
                )}

            </div>


            <div className="documento-card-actions">

                {documento.arquivoUrl && (
                    <button
                        type="button"
                        className="btn"
                        onClick={abrirDocumento}
                    >
                        Visualizar documento
                    </button>
                )}


                {modoAdmin && (
                    <>
                        {documento.status === "PENDENTE" && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-destaque"
                                    onClick={() =>
                                        onAprovar?.(documento)
                                    }
                                >
                                    Aprovar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-perigo"
                                    onClick={() =>
                                        onRejeitar?.(documento)
                                    }
                                >
                                    Rejeitar
                                </button>

                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() =>
                                        onCorrecao?.(documento)
                                    }
                                >
                                    Solicitar correção
                                </button>
                            </>
                        )}
                    </>
                )}

            </div>

        </div>
    );
}