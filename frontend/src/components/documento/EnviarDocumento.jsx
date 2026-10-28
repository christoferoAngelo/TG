import { useState } from "react";
import GlideSelect from "../bits/GlideSelect";
import BotaoImagem from "../ui/BotaoImagem";

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

                    <GlideSelect
                        className="glide-select--bloco"
                        ariaLabel="Tipo do documento"
                        size="lg"
                        menuWidth={320}
                        placeholder="Selecione"
                        value={tipoDocumento}
                        options={
                            categoria === "PESSOA"
                                ? [
                                    { value: "CPF", label: "CPF" },
                                    { value: "RG", label: "RG" },
                                    { value: "COMPROVANTE_ENDERECO", label: "Comprovante de endereço" }
                                ]
                                : [
                                    { value: "DOCUMENTO_ESPACO", label: "Documento do espaço" },
                                    { value: "COMPROVANTE_ENDERECO", label: "Comprovante de endereço" },
                                    { value: "COMPROVANTE_PROPRIEDADE", label: "Comprovante de propriedade" }
                                ]
                        }
                        onChange={setTipoDocumento}
                    />

                </div>


                <div>
                    <label>Imagem do documento</label>
                    <BotaoImagem
                        accept="image/*"
                        nomeArquivo={arquivo?.name || ""}
                        rotulo="Adicionar imagem"
                        rotuloTroca="Trocar imagem"
                        onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    />
                </div>


                <div>

                    <label>
                        Observação
                    </label>

                    <textarea
                        maxLength={500}
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