import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DocumentoUpload from "./DocumentoUpload";
import DocumentoCard from "./DocumentoCard";
import DocumentoCard from "../../components/documento/DocumentoCard";
import DocumentoUpload from "../../components/documento/DocumentoUpload";

import {
    criarDocumentoEspaco,
    listarDocumentosEspaco
} from "../../services/documentoService";


export default function DocumentosEspaco() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [documentos, setDocumentos] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");


    const espacoId = id;


    const carregarDocumentos = async () => {

        if (!espacoId) {
            setErro(
                "Espaço não identificado."
            );

            setCarregando(false);

            return;
        }

        try {

            setCarregando(true);
            setErro("");

            const dados =
                await listarDocumentosEspaco(
                    espacoId
                );

            setDocumentos(dados);

        } catch (error) {

            console.error(error);

            setErro(
                "Não foi possível carregar os documentos do espaço."
            );

        } finally {

            setCarregando(false);
        }
    };


    useEffect(() => {

        carregarDocumentos();

    }, [espacoId]);


    const handleDocumentoEnviado =
        async (documento) => {

            await criarDocumentoEspaco(
                espacoId,
                documento
            );

            await carregarDocumentos();
        };


    return (
        <div className="pagina-documentos">

            <div className="documentos-header">

                <h1>
                    Validação do espaço
                </h1>

                <p>
                    Antes de disponibilizar seu espaço,
                    envie os documentos necessários para
                    análise administrativa.
                </p>

            </div>


            <div className="documentos-info">

                <h2>
                    Documentação do anúncio
                </h2>

                <p>
                    Esta etapa funciona como uma validação
                    do espaço antes da publicação.
                </p>

            </div>


            <DocumentoUpload
                categoria="ESPACO"
                espacoId={espacoId}
                onDocumentoEnviado={
                    handleDocumentoEnviado
                }
            />


            <section className="documentos-lista">

                <h2>
                    Documentos deste espaço
                </h2>

                {carregando && (
                    <p>
                        Carregando documentos...
                    </p>
                )}

                {erro && (
                    <p>
                        {erro}
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    documentos.length === 0 && (

                        <p>
                            Nenhum documento enviado
                            para este espaço.
                        </p>
                    )
                }


                <div className="documentos-grid">

                    {documentos.map(
                        (documento) => (

                            <DocumentoCard
                                key={documento.id}
                                documento={documento}
                            />

                        )
                    )}

                </div>

            </section>


            <div className="documentos-footer">

                <button
                    type="button"
                    className="btn"
                    onClick={() =>
                        navigate("/dashboard-locador")
                    }
                >
                    Voltar ao painel
                </button>

            </div>

        </div>
    );
}