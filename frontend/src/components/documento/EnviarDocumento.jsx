import { useState } from "react";

const API_URL = "http://localhost:8080";

function EnviarDocumento({
    usuarioId,
    espacoId,
    categoria,
    onEnviado
}) {

    const [arquivo, setArquivo] = useState(null);
    const [tipoDocumento, setTipoDocumento] = useState("");
    const [observacao, setObservacao] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!arquivo) {
            alert("Selecione um arquivo.");
            return;
        }

        if (!tipoDocumento) {
            alert("Selecione o tipo do documento.");
            return;
        }

        setEnviando(true);

        try {

            // =====================================================
            // 1. ENVIA IMAGEM PARA O CLOUDINARY
            // =====================================================

            const formData = new FormData();

            formData.append("file", arquivo);

            formData.append(
                "upload_preset",
                import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
            );

            const cloudinaryResponse = await fetch(
                `https://api.cloudinary.com/v1_1/${
                    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
                }/image/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!cloudinaryResponse.ok) {
                throw new Error(
                    "Erro ao enviar imagem para o Cloudinary."
                );
            }

            const cloudinaryData =
                await cloudinaryResponse.json();

            if (!cloudinaryData.secure_url) {
                throw new Error(
                    "Cloudinary não retornou a URL da imagem."
                );
            }


            // =====================================================
            // 2. MONTA O DOCUMENTO
            // =====================================================

            const documento = {

                tipoDocumento,

                categoria,

                nomeArquivo: arquivo.name,

                arquivoUrl:
                    cloudinaryData.secure_url,

                observacao

            };


            // =====================================================
            // 3. ENVIA A URL PARA O BACKEND
            // =====================================================

            let response;

            if (categoria === "PESSOA") {

                response = await fetch(
                    `${API_URL}/documentos/usuario/${usuarioId}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(documento)
                    }
                );

            } else {

                response = await fetch(
                    `${API_URL}/documentos/espaco/${espacoId}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(documento)
                    }
                );
            }


            if (!response.ok) {

                throw new Error(
                    "Erro ao salvar documento no backend."
                );

            }


            const documentoSalvo =
                await response.json();


            alert(
                "Documento enviado para análise com sucesso!"
            );


            // Limpa formulário

            setArquivo(null);

            setTipoDocumento("");

            setObservacao("");


            if (onEnviado) {
                onEnviado(documentoSalvo);
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

        <div className="enviar-documento">

            <h3>
                Enviar documento
            </h3>


            <form onSubmit={handleSubmit}>

                <div>

                    <label>
                        Tipo do documento
                    </label>

                    <select
                        value={tipoDocumento}
                        onChange={(e) =>
                            setTipoDocumento(e.target.value)
                        }
                    >

                        <option value="">
                            Selecione
                        </option>

                        {categoria === "PESSOA" ? (
                            <>
                                <option value="CPF">
                                    CPF
                                </option>

                                <option value="RG">
                                    RG
                                </option>

                                <option value="COMPROVANTE_ENDERECO">
                                    Comprovante de endereço
                                </option>
                            </>
                        ) : (
                            <>
                                <option value="DOCUMENTO_ESPACO">
                                    Documento do espaço
                                </option>

                                <option value="COMPROVANTE_ENDERECO">
                                    Comprovante de endereço
                                </option>

                                <option value="COMPROVANTE_PROPRIEDADE">
                                    Comprovante de propriedade
                                </option>
                            </>
                        )}

                    </select>

                </div>


                <div>

                    <label>
                        Imagem do documento
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setArquivo(e.target.files[0])
                        }
                    />

                </div>


                <div>

                    <label>
                        Observação
                    </label>

                    <textarea
                        value={observacao}
                        onChange={(e) =>
                            setObservacao(e.target.value)
                        }
                        placeholder="Observações, se necessário"
                    />

                </div>


                <button
                    type="submit"
                    disabled={enviando}
                >

                    {enviando
                        ? "Enviando..."
                        : "Enviar documento"
                    }

                </button>

            </form>

        </div>

    );
}

export default EnviarDocumento;