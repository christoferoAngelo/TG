import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DocumentoCard from "../../components/documento/DocumentoCard";
import DocumentoUpload from "../../components/documento/DocumentoUpload";
import { useAuth } from "../../contexts/AuthContext";

import {
    listarDocumentosEspaco,
    criarDocumentoEspaco
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

export default function DocumentosEspaco() {
    const { id } = useParams();
    const { usuarioLogado } = useAuth();
    const usuarioId = usuarioLogado?.id;

    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const carregar = async () => {
        try {
            setCarregando(true);
            setErro("");

            const data = await listarDocumentosEspaco(id, usuarioId);
            setDocumentos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setErro("Não foi possível carregar a documentação do espaço.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
    }, [id, usuarioId]);

    const handleEnviar = async (documento) => {
        try {
            await criarDocumentoEspaco(id, documento, usuarioId);
            const atualizados = await listarDocumentosEspaco(id, usuarioId);
            setDocumentos(Array.isArray(atualizados) ? atualizados : []);
            alert("Documento enviado para validação.");
        } catch (error) {
            console.error("Erro ao cadastrar documento do espaço:", error);
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
                        <Link to="/locador/espacos" className="doc-voltar">
                            ← Meus espaços
                        </Link>
                        <h1 className="doc-titulo">Documentação do espaço</h1>
                        <p className="doc-subtitulo">
                            Consulte e envie os documentos necessários para validação deste espaço.
                        </p>
                    </div>
                </header>

                <section className="doc-stats" aria-label="Resumo dos documentos">
                    <Stat label="Enviados" valor={valor(documentos.length)} dica="Total deste espaço" />
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
                            categoria="ESPACO"
                            espacoId={id}
                            onDocumentoEnviado={handleEnviar}
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
                                Nenhum documento enviado ainda. Use o formulário ao lado para enviar o primeiro.
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
