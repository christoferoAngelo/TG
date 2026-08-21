import React, { useEffect, useState } from "react";

import DocumentoCard from "../../components/documento/DocumentoCard";

import {
    listarDocumentosPendentes,
    aprovarDocumento,
    rejeitarDocumento,
    solicitarCorrecao
} from "../../services/documentoService";


export default function DocumentosAdmin() {

    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);


    const carregarDocumentos = async () => {

        try {

            setCarregando(true);

            const data =
                await listarDocumentosPendentes();

            setDocumentos(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(error);

            alert(
                "Erro ao carregar documentos pendentes."
            );

        } finally {

            setCarregando(false);
        }
    };


    useEffect(() => {
        carregarDocumentos();
    }, []);


    const handleAprovar = async (documento) => {

        const confirmar =
            window.confirm(
                `Deseja aprovar o documento "${documento.tipoDocumento}"?`
            );

        if (!confirmar) {
            return;
        }

        try {

            setProcessando(true);

            await aprovarDocumento(documento.id);

            setDocumentos((prev) =>
                prev.filter(
                    (item) => item.id !== documento.id
                )
            );

            alert("Documento aprovado.");

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao aprovar documento."
            );

        } finally {

            setProcessando(false);
        }
    };


    const handleRejeitar = async (documento) => {

        const motivo =
            window.prompt(
                "Informe o motivo da rejeição:"
            );

        if (!motivo || !motivo.trim()) {
            return;
        }

        try {

            setProcessando(true);

            await rejeitarDocumento(
                documento.id,
                motivo
            );

            setDocumentos((prev) =>
                prev.filter(
                    (item) => item.id !== documento.id
                )
            );

            alert("Documento rejeitado.");

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao rejeitar documento."
            );

        } finally {

            setProcessando(false);
        }
    };


    const handleSolicitarCorrecao = async (documento) => {

        const motivo =
            window.prompt(
                "Informe o que precisa ser corrigido:"
            );

        if (!motivo || !motivo.trim()) {
            return;
        }

        try {

            setProcessando(true);

            await solicitarCorrecao(
                documento.id,
                motivo
            );

            setDocumentos((prev) =>
                prev.filter(
                    (item) => item.id !== documento.id
                )
            );

            alert(
                "Solicitação de correção enviada."
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao solicitar correção."
            );

        } finally {

            setProcessando(false);
        }
    };


    return (
        <div className="documentos-admin">

            <header>

                <h2>
                    Análise de documentos
                </h2>

                <p>
                    Revise os documentos enviados
                    pelos usuários e pelos espaços.
                </p>

            </header>


            {carregando ? (

                <p>
                    Carregando documentos pendentes...
                </p>

            ) : documentos.length === 0 ? (

                <div>
                    <h3>
                        Tudo certo!
                    </h3>

                    <p>
                        Não existem documentos pendentes
                        para análise.
                    </p>
                </div>

            ) : (

                <div className="documentos-lista">

                    {documentos.map((documento) => (

                        <DocumentoCard
                            key={documento.id}
                            documento={documento}
                            modo="admin"
                            onAprovar={handleAprovar}
                            onRejeitar={handleRejeitar}
                            onSolicitarCorrecao={
                                handleSolicitarCorrecao
                            }
                        />

                    ))}

                </div>
            )}


            {processando && (
                <p>
                    Processando análise...
                </p>
            )}

        </div>
    );
}