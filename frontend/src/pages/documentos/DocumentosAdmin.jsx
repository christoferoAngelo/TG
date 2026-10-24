import React, { useEffect, useState } from "react";

import DocumentoCard from "../../components/documento/DocumentoCard";

import {
    listarDocumentosPendentes,
    aprovarDocumento,
    rejeitarDocumento,
    solicitarCorrecao
} from "../../services/documentoService";

import "./DocumentosAdmin.css";


export default function DocumentosAdmin() {

    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [alvo, setAlvo] = useState(null);
    const [acao, setAcao] = useState("");
    const [motivo, setMotivo] = useState("");
    const [erro, setErro] = useState("");

    const abrirMotivo = (documento, tipo) => {
        setAlvo(documento);
        setAcao(tipo);
        setMotivo("");
        setErro("");
    };

    const confirmarMotivo = async (evento) => {
        evento.preventDefault();
        if (!alvo || !motivo.trim()) {
            setErro("Informe o motivo.");
            return;
        }
        try {
            setProcessando(true);
            setErro("");
            if (acao === "rejeitar") {
                await rejeitarDocumento(alvo.id, motivo.trim());
            } else {
                await solicitarCorrecao(alvo.id, motivo.trim());
            }
            setDocumentos((prev) => prev.filter((item) => item.id !== alvo.id));
            setAlvo(null);
            setMotivo("");
        } catch (error) {
            setErro(error.message || "Não foi possível concluir a análise.");
        } finally {
            setProcessando(false);
        }
    };


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
                <>
                    {alvo && (
                        <form className="val-motivo" onSubmit={confirmarMotivo}>
                            <p>
                                {acao === "rejeitar" ? "Rejeitar" : "Pedir correção de"}{" "}
                                <strong>{alvo.tipoDocumento}</strong>
                            </p>
                            <label htmlFor="val-motivo">Motivo</label>
                            <textarea
                                id="val-motivo"
                                value={motivo}
                                maxLength={500}
                                rows={3}
                                onChange={(evento) => setMotivo(evento.target.value)}
                            />
                            {erro && <p className="val-erro" role="alert">{erro}</p>}
                            <div>
                                <button type="submit" disabled={processando}>
                                    {processando ? "Salvando…" : "Confirmar"}
                                </button>
                                <button type="button" onClick={() => setAlvo(null)} disabled={processando}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                <div className="documentos-lista">

                    {documentos.map((documento) => (

                        <DocumentoCard
                            key={documento.id}
                            documento={documento}
                            modoAdmin
                            onAprovar={handleAprovar}
                            onRejeitar={(documento) => abrirMotivo(documento, "rejeitar")}
                            onCorrecao={(documento) => abrirMotivo(documento, "correcao")}
                        />

                    ))}

                </div>
                </>
            )}


            {processando && (
                <p>
                    Processando análise...
                </p>
            )}

        </div>
    );
}