import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DocumentoCard from "../../components/documento/DocumentoCard";
import DocumentoUpload from "../../components/documento/DocumentoUpload";

import {
    listarDocumentosEspaco,
    criarDocumentoEspaco
} from "../../services/documentoService";


export default function DocumentosEspaco() {

    const { id } = useParams();

    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);


    const carregar = async () => {

        try {

            setCarregando(true);

            const data =
                await listarDocumentosEspaco(id);

            setDocumentos(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(error);

            alert(
                "Erro ao carregar documentação do espaço."
            );

        } finally {

            setCarregando(false);
        }
    };


    useEffect(() => {
        carregar();
    }, [id]);


    const handleEnviar = async (documento) => {

        try {

            setEnviando(true);

            const novo =
                await criarDocumentoEspaco(
                    id,
                    documento
                );

            setDocumentos((prev) => [
                ...prev,
                novo
            ]);

            alert("Documento enviado.");

        } catch (error) {

            console.error(
                "Erro ao cadastrar documento do espaço:",
                error
            );

            throw error;

        } finally {

            setEnviando(false);
        }
    };


    return (
        <div className="documentos-page">

            <h2>
                Documentação do espaço
            </h2>

            <p>
                Consulte e envie os documentos
                necessários para validação.
            </p>


            <DocumentoUpload
                categoria="ESPACO"
                espacoId={id}
                onDocumentoEnviado={handleEnviar}
            />


            <section>

                <h3>
                    Documentos enviados
                </h3>


                {carregando ? (

                    <p>
                        Carregando...
                    </p>

                ) : documentos.length === 0 ? (

                    <p>
                        Nenhum documento enviado.
                    </p>

                ) : (

                    <div className="documentos-lista">

                        {documentos.map((documento) => (

                            <DocumentoCard
                                key={documento.id}
                                documento={documento}
                            />

                        ))}

                    </div>
                )}

            </section>

        </div>
    );
}