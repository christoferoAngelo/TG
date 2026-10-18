import React, { useEffect, useState } from "react";

import DocumentoUpload from "./DocumentoUpload";
import DocumentoCard from "./DocumentoCard";

import { criarDocumentoEspaco } from "../../services/documentoService";

import "./DocumentacaoEspacoModal.css";

export default function DocumentacaoEspacoModal({ espaco, onClose, onConcluir }) {
    const [documentos, setDocumentos] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState("");

    // Esc fecha o modal e a página de trás não rola enquanto ele está aberto
    useEffect(() => {
        const aoTeclar = (e) => {
            if (e.key === "Escape" && !enviando) onClose?.();
        };
        window.addEventListener("keydown", aoTeclar);

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = overflowAnterior;
        };
    }, [enviando, onClose]);

    if (!espaco) {
        return null;
    }

    const handleEnviar = async (documento) => {
        try {
            setEnviando(true);
            setAviso("");

            const novoDocumento = await criarDocumentoEspaco(espaco.id, documento);

            setDocumentos((prev) => [...prev, novoDocumento]);
            setAviso("Documento enviado para análise.");
        } catch (error) {
            console.error("Erro ao cadastrar documento do espaço:", error);
            alert(error.message || "Erro ao enviar documento.");
            // O DocumentoUpload usa a rejeição para saber que o envio falhou
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
        <div className="docm-overlay">
            <div
                className="docm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="docm-titulo"
            >
                <header className="docm-cab">
                    <h2 id="docm-titulo">Documentação do espaço</h2>
                    <p className="docm-espaco">{espaco.titulo}</p>
                    <p className="docm-texto">
                        Envie os documentos necessários para validar o anúncio. Você também
                        pode fazer isso depois, pelo painel.
                    </p>
                </header>

                <div className="docm-corpo">
                    <DocumentoUpload
                        categoria="ESPACO"
                        espacoId={espaco.id}
                        onDocumentoEnviado={handleEnviar}
                    />

                    {aviso && (
                        <p className="docm-aviso" role="status">
                            {aviso}
                        </p>
                    )}

                    {documentos.length > 0 && (
                        <section className="docm-lista">
                            <h3>Documentos adicionados ({documentos.length})</h3>
                            {documentos.map((documento) => (
                                <DocumentoCard key={documento.id} documento={documento} />
                            ))}
                        </section>
                    )}
                </div>

                <footer className="docm-rodape">
                    <button
                        type="button"
                        className="docm-btn docm-btn--ghost"
                        onClick={onClose}
                        disabled={enviando}
                    >
                        Fazer depois
                    </button>
                    <button
                        type="button"
                        className="docm-btn docm-btn--primario"
                        onClick={handleConcluir}
                        disabled={enviando}
                    >
                        {enviando ? "Enviando…" : "Concluir documentação"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
