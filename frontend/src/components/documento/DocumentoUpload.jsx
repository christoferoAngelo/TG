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

    console.log("========================================");
    console.log("📄 DocumentoUpload MONTADO");
    console.log("📄 categoria:", categoria);
    console.log("📄 usuarioId:", usuarioId);
    console.log("📄 espacoId:", espacoId);
    console.log("📄 onDocumentoEnviado:", onDocumentoEnviado);
    console.log(
        "📄 typeof onDocumentoEnviado:",
        typeof onDocumentoEnviado
    );
    console.log("========================================");


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

    console.log("========================================");
    console.log("🚀 INÍCIO DO ENVIO DO DOCUMENTO");
    console.log("categoria:", categoria);
    console.log("usuarioId:", usuarioId);
    console.log("espacoId:", espacoId);
    console.log("tipoDocumento:", tipoDocumento);
    console.log("observacao:", observacao);
    console.log("arquivo:", arquivo);
    console.log("onDocumentoEnviado:", onDocumentoEnviado);
    console.log(
        "typeof onDocumentoEnviado:",
        typeof onDocumentoEnviado
    );
    console.log("========================================");


    if (!tipoDocumento) {
        console.error("❌ Nenhum tipo de documento selecionado.");
        alert("Selecione o tipo do documento.");
        return;
    }

    if (!arquivo) {
        console.error("❌ Nenhum arquivo selecionado.");
        alert("Selecione um arquivo.");
        return;
    }


    try {

        setEnviando(true);

        console.log("☁️ Enviando arquivo para Cloudinary...");

        const upload =
            await uploadDocumentoCloudinary(
                arquivo
            );

        console.log("☁️ Cloudinary respondeu:", upload);


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


        console.log("📦 Documento montado:");
        console.log(documento);


        console.log(
            "🔎 Verificando callback antes de chamar..."
        );

        console.log(
            "onDocumentoEnviado:",
            onDocumentoEnviado
        );

        console.log(
            "typeof:",
            typeof onDocumentoEnviado
        );


        if (typeof onDocumentoEnviado !== "function") {

            console.error(
                "❌ ERRO: onDocumentoEnviado NÃO É UMA FUNÇÃO!"
            );

            console.error(
                "Props recebidas pelo DocumentoUpload:",
                {
                    categoria,
                    usuarioId,
                    espacoId,
                    onDocumentoEnviado
                }
            );

            throw new Error(
                "O componente pai não forneceu uma função onDocumentoEnviado."
            );
        }


        console.log(
            "✅ Callback encontrado. Chamando onDocumentoEnviado..."
        );


        await onDocumentoEnviado(
            documento
        );


        console.log(
            "✅ onDocumentoEnviado executado com sucesso."
        );


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
            "❌ ERRO AO ENVIAR DOCUMENTO:",
            error
        );

        console.error(
            "Stack:",
            error.stack
        );

        alert(
            error.message ||
            "Não foi possível enviar o documento."
        );

    } finally {

        setEnviando(false);

        console.log(
            "🏁 FIM DO PROCESSAMENTO DO DOCUMENTO"
        );
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