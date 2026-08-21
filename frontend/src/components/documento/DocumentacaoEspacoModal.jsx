import React, { useState } from "react";

import DocumentoUpload from "./DocumentoUpload";
import DocumentoCard from "./DocumentoCard";

import {
    criarDocumentoEspaco
} from "../../services/documentoService";


const TIPOS_DOCUMENTO_ESPACO = [
    {
        valor: "COMPROVANTE_PROPRIEDADE",
        label: "Comprovante de propriedade"
    },
    {
        valor: "ALVARA_FUNCIONAMENTO",
        label: "Alvará de funcionamento"
    },
    {
        valor: "COMPROVANTE_ENDERECO",
        label: "Comprovante de endereço do espaço"
    },
    {
        valor: "OUTRO",
        label: "Outro documento"
    }
];


export default function DocumentacaoEspacoModal({
    espaco,
    onClose,
    onConcluir
}) {

    const [documentos, setDocumentos] = useState([]);
    const [enviando, setEnviando] = useState(false);


    if (!espaco) {
        return null;
    }


    const handleEnviar = async (documento) => {

        try {

            setEnviando(true);

            const novoDocumento =
                await criarDocumentoEspaco(
                    espaco.id,
                    documento
                );

            setDocumentos((prev) => [
                ...prev,
                novoDocumento
            ]);

            alert(
                "Documento do espaço enviado para análise."
            );

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Erro ao enviar documento."
            );

            throw error;

        } finally {

            setEnviando(false);
        }
    };


    const handleConcluir = () => {

        onConcluir?.(documentos);

        onClose?.();
    };


    return (
        <div className="modal-overlay">

            <div className="modal-content">

                <h2>
                    Documentação do espaço
                </h2>

                <p>
                    {espaco.titulo}
                </p>

                <p>
                    Antes de disponibilizar o espaço,
                    envie os documentos necessários
                    para validação.
                </p>


                <DocumentoUpload
                    titulo="Adicionar documento do espaço"
                    tiposDocumento={TIPOS_DOCUMENTO_ESPACO}
                    onEnviar={handleEnviar}
                    carregando={enviando}
                />


                {documentos.length > 0 && (

                    <section>

                        <h3>
                            Documentos adicionados
                        </h3>

                        {documentos.map((documento) => (

                            <DocumentoCard
                                key={documento.id}
                                documento={documento}
                            />

                        ))}

                    </section>
                )}


                <div className="modal-actions">

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Fazer depois
                    </button>

                    <button
                        type="button"
                        onClick={handleConcluir}
                    >
                        Concluir documentação
                    </button>

                </div>

            </div>

        </div>
    );
}