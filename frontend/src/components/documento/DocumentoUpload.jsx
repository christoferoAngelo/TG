import React, { useState } from "react";

import {
    uploadDocumentoCloudinary
} from "../../services/documentoService";


export default function DocumentoUpload({
    categoria,
    usuarioId,
    espacoId,
    onDocumentoEnviado
}) {

    const [tipoDocumento, setTipoDocumento] =
        useState("");

    const [observacao, setObservacao] =
        useState("");

    const [arquivo, setArquivo] =
        useState(null);

    const [enviando, setEnviando] =
        useState(false);


    const tiposUsuario = [
        "DOCUMENTO_IDENTIFICACAO",
        "CPF",
        "COMPROVANTE_RESIDENCIA"
    ];


    const tiposEspaco = [
        "DOCUMENTO_PROPRIEDADE",
        "COMPROVANTE_ENDERECO",
        "DOCUMENTO_AUTORIZACAO"
    ];


    const tiposDisponiveis =
        categoria === "PESSOA"
            ? tiposUsuario
            : tiposEspaco;


    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!tipoDocumento) {
            alert("Selecione o tipo do documento.");
            return;
        }

        if (!arquivo) {
            alert("Selecione um arquivo.");
            return;
        }

        try {

            setEnviando(true);

            /*
             * 1. Envia imagem para Cloudinary
             */
            const upload =
                await uploadDocumentoCloudinary(
                    arquivo
                );


            /*
             * 2. Monta o objeto esperado pelo backend
             */
            const documento = {

                tipoDocumento,

                categoria,

                nomeArquivo:
                    upload.nomeArquivo,

                arquivoUrl:
                    upload.url,

                observacao:
                    observacao || null
            };


            /*
             * 3. Delega a criação para o componente pai.
             */
            await onDocumentoEnviado(
                documento
            );


            /*
             * Limpa formulário
             */
            setTipoDocumento("");
            setObservacao("");
            setArquivo(null);

            const input =
                document.getElementById(
                    "arquivo-documento"
                );

            if (input) {
                input.value = "";
            }

        } catch (error) {

            console.error(
                "Erro ao enviar documento:",
                error
            );

            alert(
                error.message ||
                "Não foi possível enviar o documento."
            );

        } finally {

            setEnviando(false);
        }
    };


    return (
        <div className="documento-upload">

            <h3>
                Enviar documento
            </h3>

            <p>
                Envie um documento para validação.
                Para este projeto acadêmico, podem ser
                utilizadas imagens de exemplo.
            </p>


            <form onSubmit={handleSubmit}>

                <div className="input-group">

                    <label>
                        Tipo de documento
                    </label>

                    <select
                        className="input"
                        value={tipoDocumento}
                        onChange={(e) =>
                            setTipoDocumento(
                                e.target.value
                            )
                        }
                        disabled={enviando}
                    >

                        <option value="">
                            Selecione...
                        </option>

                        {tiposDisponiveis.map(
                            (tipo) => (
                                <option
                                    key={tipo}
                                    value={tipo}
                                >
                                    {tipo
                                        .replaceAll(
                                            "_",
                                            " "
                                        )}
                                </option>
                            )
                        )}

                    </select>

                </div>


                <div className="input-group">

                    <label>
                        Documento / imagem
                    </label>

                    <input
                        id="arquivo-documento"
                        type="file"
                        accept="image/*"
                        className="input"
                        disabled={enviando}
                        onChange={(e) =>
                            setArquivo(
                                e.target.files?.[0] ||
                                null
                            )
                        }
                    />

                </div>


                <div className="input-group">

                    <label>
                        Observação
                    </label>

                    <textarea
                        className="input"
                        rows="3"
                        value={observacao}
                        disabled={enviando}
                        onChange={(e) =>
                            setObservacao(
                                e.target.value
                            )
                        }
                        placeholder="Observação opcional..."
                    />

                </div>


                <button
                    type="submit"
                    className="btn btn-destaque"
                    disabled={enviando}
                >
                    {enviando
                        ? "Enviando..."
                        : "Enviar documento"}
                </button>

            </form>

        </div>
    );
}