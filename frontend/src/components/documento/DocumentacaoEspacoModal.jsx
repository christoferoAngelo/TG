import React, { useState } from "react";

import DocumentoUpload from "./DocumentoUpload";
import DocumentoCard from "./DocumentoCard";

import {
    criarDocumentoEspaco
} from "../../services/documentoService";


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

        console.log("========================================");
        console.log("📤 DocumentacaoEspacoModal - handleEnviar");
        console.log("📤 Documento recebido:", documento);
        console.log("📤 ID do espaço:", espaco.id);
        console.log("========================================");

        try {

            setEnviando(true);

            const novoDocumento =
                await criarDocumentoEspaco(
                    espaco.id,
                    documento
                );

            console.log("✅ Documento cadastrado no backend:");
            console.log(novoDocumento);

            setDocumentos((prev) => [
                ...prev,
                novoDocumento
            ]);

            alert(
                "Documento do espaço enviado para análise."
            );

        } catch (error) {

            console.error(
                "❌ Erro ao cadastrar documento do espaço:",
                error
            );

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


    console.log("========================================");
    console.log("📋 DocumentacaoEspacoModal");
    console.log("📋 espaco:", espaco);
    console.log("📋 espaco.id:", espaco?.id);
    console.log("📋 handleEnviar:", handleEnviar);
    console.log("📋 typeof handleEnviar:", typeof handleEnviar);
    console.log("========================================");


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
                    categoria="ESPACO"
                    espacoId={espaco.id}
                    onDocumentoEnviado={handleEnviar}
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
                        disabled={enviando}
                    >
                        Concluir documentação
                    </button>

                </div>

            </div>

        </div>
    );
}