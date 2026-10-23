import React, { useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

import DocumentoUpload from "../../components/documento/DocumentoUpload";
import DocumentoCard from "../../components/documento/DocumentoCard";

import {
    criarDocumentoUsuario,
    listarDocumentosUsuario
} from "../../services/documentoService";

import "./DocumentosUsuario.css";

function contarPorStatus(documentos, status) {
    return documentos.filter(
        (documento) => (documento.status || "").toUpperCase() === status
    ).length;
}

function Stat({ label, valor, dica, alerta }) {
    return (
        <div className={`doc-stat${alerta ? " doc-stat--alerta" : ""}`}>
            <span className="doc-stat-label">{label}</span>
            <strong className="doc-stat-valor">{valor}</strong>
            {dica && <span className="doc-stat-dica">{dica}</span>}
        </div>
    );
}

export default function DocumentosUsuario() {
    const { usuarioLogado } = useAuth();

    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const usuarioId = usuarioLogado?.id;

    const carregarDocumentos = async () => {
        if (!usuarioId) {
            setCarregando(false);
            return;
        }

        try {
            setCarregando(true);
            setErro("");

            const dados = await listarDocumentosUsuario(usuarioId);
            setDocumentos(Array.isArray(dados) ? dados : []);
        } catch (error) {
            console.error(error);
            setErro("Não foi possível carregar seus documentos.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDocumentos();
    }, [usuarioId]);

    const handleDocumentoEnviado = async (documento) => {
        try {
            await criarDocumentoUsuario(usuarioLogado.id, documento);

            const documentosAtualizados = await listarDocumentosUsuario(usuarioLogado.id);
            setDocumentos(Array.isArray(documentosAtualizados) ? documentosAtualizados : []);

            alert("Documento enviado para validação.");
        } catch (error) {
            console.error("Erro ao cadastrar documento:", error);
            throw error;
        }
    };

    const pendentes = contarPorStatus(documentos, "PENDENTE");
    const aprovados = contarPorStatus(documentos, "APROVADO");
    const atencao =
        contarPorStatus(documentos, "REJEITADO") +
        contarPorStatus(documentos, "CORRECAO_SOLICITADA");
    const valor = (n) => (carregando ? "—" : n);

    return (
        <div className="doc-page">
            <main className="doc-container">
                <header className="doc-topo">
                    <div>
                        <h1 className="doc-titulo">Meus documentos</h1>
                        <p className="doc-subtitulo">
                            Envie os documentos necessários para validar sua conta e acompanhe a análise de cada um.
                        </p>
                    </div>
                </header>

                <section className="doc-stats" aria-label="Resumo dos documentos">
                    <Stat label="Enviados" valor={valor(documentos.length)} dica="Total na sua conta" />
                    <Stat label="Em análise" valor={valor(pendentes)} dica="Aguardando o admin" />
                    <Stat label="Aprovados" valor={valor(aprovados)} dica="Validados" />
                    <Stat
                        label="Precisam de ação"
                        valor={valor(atencao)}
                        dica="Rejeitados ou com correção"
                        alerta={!carregando && atencao > 0}
                    />
                </section>

                <div className="doc-grid">
                    <section className="doc-card">
                        <DocumentoUpload
                            categoria="PESSOA"
                            usuarioId={usuarioId}
                            onDocumentoEnviado={handleDocumentoEnviado}
                        />
                    </section>

                    <section className="doc-card">
                        <div className="doc-card-cab">
                            <h2 className="doc-card-titulo">
                                Documentos enviados
                                {!carregando && !erro && (
                                    <span className="doc-card-contador">{documentos.length}</span>
                                )}
                            </h2>
                        </div>

                        {carregando && <p className="doc-vazio">Carregando documentos…</p>}

                        {erro && <p className="doc-erro">{erro}</p>}

                        {!carregando && !erro && documentos.length === 0 && (
                            <p className="doc-vazio">
                                Você ainda não enviou documentos. Use o formulário para enviar o primeiro.
                            </p>
                        )}

                        {!carregando && !erro && documentos.length > 0 && (
                            <div className="doc-lista">
                                {documentos.map((documento) => (
                                    <DocumentoCard key={documento.id} documento={documento} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
