import { useEffect, useMemo, useRef, useState } from "react";
import {
    cancelarDocumento,
    criarDocumentoUsuario,
    listarDocumentosUsuario,
    uploadDocumentoCloudinary,
} from "../../../services/documentoService";
import {
    ehDocumentoIdentidade,
    ladosIdentidade,
    rotuloDocumento,
    TIPO_COMPROVANTE,
} from "../../../components/documento/rotulosDocumento";
import PorQueDocumentos from "../../../components/documento/PorQueDocumentos";

const TIPOS_ID_OPCOES = [
    { value: "RG", label: "RG (frente e verso)" },
    { value: "CIN", label: "CIN (frente e verso)" },
    { value: "CNH", label: "CNH (frente e verso)" },
];

function statusDoc(docs) {
    if (!docs.length) return null;
    if (docs.every((d) => d.status === "APROVADO")) return "APROVADO";
    if (docs.some((d) => d.status === "REJEITADO" || d.status === "CORRECAO_SOLICITADA")) {
        return docs.find((d) => d.status === "REJEITADO" || d.status === "CORRECAO_SOLICITADA")?.status;
    }
    return "PENDENTE";
}

function mensagemStatus({ identidade, comprovante }) {
    const idOk = identidade.length > 0 && identidade.every((d) => d.status === "APROVADO");
    const compOk = comprovante.length > 0 && comprovante.every((d) => d.status === "APROVADO");
    if (idOk && compOk) return { tipo: "ok", texto: "Toda documentação aprovada." };
    if (idOk) return { tipo: "parcial", texto: "Documento de identidade aprovado." };
    if (compOk) return { tipo: "parcial", texto: "Comprovante de residência aprovado." };
    return null;
}

export default function DocumentosPerfil({ usuarioId, onMudanca, variante = "locatario" }) {
    const [docs, setDocs] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [tipoId, setTipoId] = useState("RG");
    const [enviando, setEnviando] = useState("");
    const [erro, setErro] = useState("");
    const [confirmarCancelar, setConfirmarCancelar] = useState(null);
    const refFrente = useRef(null);
    const refVerso = useRef(null);
    const refComprovante = useRef(null);

    const carregar = async () => {
        if (!usuarioId) return;
        setCarregando(true);
        try {
            const lista = await listarDocumentosUsuario(usuarioId);
            setDocs(Array.isArray(lista) ? lista : []);
            onMudanca?.(Array.isArray(lista) ? lista : []);
        } catch (falha) {
            setErro(falha.message || "Não foi possível carregar os documentos.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId]);

    const identidade = useMemo(
        () => docs.filter((d) => ehDocumentoIdentidade(d.tipoDocumento)),
        [docs]
    );
    const comprovante = useMemo(
        () => docs.filter((d) => String(d.tipoDocumento).toUpperCase() === TIPO_COMPROVANTE),
        [docs]
    );

    const resumo = mensagemStatus({ identidade, comprovante });
    const statusId = statusDoc(identidade);
    const statusComp = statusDoc(comprovante);
    const lados = ladosIdentidade(tipoId);

    const enviarArquivo = async (tipoDocumento, arquivo) => {
        if (!arquivo || !usuarioId) return;
        setEnviando(tipoDocumento);
        setErro("");
        try {
            const upload = await uploadDocumentoCloudinary(arquivo);
            await criarDocumentoUsuario(usuarioId, {
                tipoDocumento,
                nomeArquivo: upload.nomeArquivo,
                arquivoUrl: upload.url,
            });
            await carregar();
        } catch (falha) {
            setErro(falha.message || "Falha ao enviar o documento.");
        } finally {
            setEnviando("");
        }
    };

    const cancelar = async (doc) => {
        setErro("");
        try {
            await cancelarDocumento(doc.id);
            setConfirmarCancelar(null);
            await carregar();
        } catch (falha) {
            setErro(falha.message || "Não foi possível cancelar a análise.");
        }
    };

    const podeVer = (doc) => doc.status !== "APROVADO" && Boolean(doc.arquivoUrl);
    const podeCancelar = (doc) => doc.status !== "APROVADO";

    const renderDocLinha = (doc) => (
        <div key={doc.id} className="pf-doc-linha">
            <div>
                <strong>{rotuloDocumento(doc.tipoDocumento)}</strong>
                <span className={`pf-chip pf-chip--${doc.status === "APROVADO" ? "ok" : doc.status === "PENDENTE" ? "warn" : "muted"}`}>
                    {doc.status === "PENDENTE" ? "Em análise" : doc.status === "APROVADO" ? "Aprovado" : doc.status === "REJEITADO" ? "Rejeitado" : "Correção solicitada"}
                </span>
                {(doc.status === "REJEITADO" || doc.status === "CORRECAO_SOLICITADA") && doc.motivoRejeicao && (
                    <p className="pf-doc-motivo">{doc.motivoRejeicao}</p>
                )}
            </div>
            <div className="pf-doc-acoes">
                {podeVer(doc) && (
                    <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" onClick={() => window.open(doc.arquivoUrl, "_blank", "noopener,noreferrer")}>
                        Ver arquivo
                    </button>
                )}
                {podeCancelar(doc) && (
                    <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" onClick={() => setConfirmarCancelar(doc)}>
                        Cancelar análise
                    </button>
                )}
            </div>
        </div>
    );

    const campoUpload = (tipo, rotulo, inputRef) => (
        <div className="pf-doc-upload" key={tipo}>
            <button
                type="button"
                className="pf-btn pf-btn--ghost pf-btn--sm"
                disabled={Boolean(enviando)}
                onClick={() => inputRef?.current?.click()}
            >
                {enviando === tipo ? "Enviando…" : rotulo}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hidden
                onChange={(evento) => {
                    const arquivo = evento.target.files?.[0];
                    evento.target.value = "";
                    if (arquivo) enviarArquivo(tipo, arquivo);
                }}
            />
        </div>
    );

    const idAprovado = statusId === "APROVADO";
    const compAprovado = statusComp === "APROVADO";
    const nomeDoc = tipoId === "CIN" ? "CIN" : tipoId === "CNH" ? "CNH" : "RG";

    return (
        <section className="pf-card" aria-labelledby="pf-docs-titulo">
            <header className="pf-card-cab">
                <h2 className="pf-card-titulo" id="pf-docs-titulo">Documentos</h2>
            </header>

            <PorQueDocumentos variante={variante} />

            {erro && <p className="pf-doc-erro" role="alert">{erro}</p>}
            {resumo && (
                <p className={`pf-doc-resumo pf-doc-resumo--${resumo.tipo}`} role="status">
                    {resumo.texto}
                </p>
            )}

            {carregando ? (
                <p className="pf-doc-intro">Carregando documentos…</p>
            ) : (
                <div className="pf-doc-blocos">
                    <div className="pf-doc-bloco">
                        <h3>Documento de identidade</h3>
                        {identidade.length > 0 ? identidade.map(renderDocLinha) : (
                            <p className="pf-vazio">Nenhum documento enviado ainda.</p>
                        )}
                        {!idAprovado && (
                            <div className="pf-doc-form">
                                <label className="pf-doc-tipo">
                                    Tipo
                                    <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                                        {TIPOS_ID_OPCOES.map((op) => (
                                            <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="pf-doc-uploads">
                                    {campoUpload(lados.frente, `Enviar frente do ${nomeDoc}`, refFrente)}
                                    {campoUpload(lados.verso, `Enviar verso do ${nomeDoc}`, refVerso)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pf-doc-bloco">
                        <h3>Comprovante de residência</h3>
                        {comprovante.length > 0 ? comprovante.map(renderDocLinha) : (
                            <p className="pf-vazio">Nenhum comprovante enviado ainda.</p>
                        )}
                        {!compAprovado && campoUpload("COMPROVANTE_RESIDENCIA", "Enviar comprovante", refComprovante)}
                    </div>
                </div>
            )}

            {confirmarCancelar && (
                <div className="pf-doc-confirm" role="dialog" aria-modal="true">
                    <p>
                        Cancelar a análise de <strong>{rotuloDocumento(confirmarCancelar.tipoDocumento)}</strong>?
                        Você poderá enviar outro arquivo depois.
                    </p>
                    <div className="pf-doc-acoes">
                        <button type="button" className="pf-btn pf-btn--ghost pf-btn--sm" onClick={() => setConfirmarCancelar(null)}>
                            Voltar
                        </button>
                        <button type="button" className="pf-btn pf-btn--primario pf-btn--sm" onClick={() => cancelar(confirmarCancelar)}>
                            Confirmar cancelamento
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
