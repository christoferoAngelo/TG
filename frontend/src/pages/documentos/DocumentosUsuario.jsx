import React, { useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

import DocumentoUpload from "../../components/documento/DocumentoUpload";
import DocumentoCard from "../../components/documento/DocumentoCard";

import {
    criarDocumentoUsuario,
    listarDocumentosUsuario
} from "../../services/documentoService";


export default function DocumentosUsuario() {

    const { usuarioLogado } = useAuth();

    const [documentos, setDocumentos] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");


    /*
     * Dependendo de como seu UsuarioDTO está
     * estruturado, o ID normalmente estará aqui.
     */
    const usuarioId =
        usuarioLogado?.id;


    const carregarDocumentos = async () => {

        if (!usuarioId) {
            setCarregando(false);
            return;
        }

        try {

            setCarregando(true);
            setErro("");

            const dados =
                await listarDocumentosUsuario(
                    usuarioId
                );

            setDocumentos(dados);

        } catch (error) {

            console.error(error);

            setErro(
                "Não foi possível carregar seus documentos."
            );

        } finally {

            setCarregando(false);
        }
    };


    useEffect(() => {

        carregarDocumentos();

    }, [usuarioId]);


const handleDocumentoEnviado = async (documento) => {
    try {
        await criarDocumentoUsuario(
            usuarioLogado.id,
            documento
        );

        const documentosAtualizados =
            await listarDocumentosUsuario(
                usuarioLogado.id
            );

        setDocumentos(documentosAtualizados);

        alert("Documento enviado para validação.");

    } catch (error) {

        console.error(
            "Erro ao cadastrar documento:",
            error
        );

        throw error;
    }
};


    return (
        <div className="pagina-documentos">

            <div className="documentos-header">

                <h1>
                    Meus documentos
                </h1>

                <p>
                    Envie os documentos necessários para
                    validar sua conta.
                </p>

            </div>


            <DocumentoUpload
                categoria="PESSOA"
                usuarioId={usuarioId}
                onDocumentoEnviado={
                    handleDocumentoEnviado
                }
            />


            <section className="documentos-lista">

                <h2>
                    Documentos enviados
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
                            Você ainda não enviou
                            documentos.
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

        </div>
    );
}