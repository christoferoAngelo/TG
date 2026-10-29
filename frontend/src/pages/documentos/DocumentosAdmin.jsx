import React, { useEffect, useMemo, useState } from "react";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from "firebase/auth";

import DocumentoCard from "../../components/documento/DocumentoCard";
import {
    listarTodosDocumentosAdmin,
    listarDocumentosUsuario,
    aprovarDocumento,
    rejeitarDocumento,
    solicitarCorrecao
} from "../../services/documentoService";
import { rotuloDocumento } from "../../components/documento/rotulosDocumento";

import "./DocumentosAdmin.css";

function agruparPorChave(lista, chaveDe, rotuloDe) {
    const mapa = new Map();
    lista.forEach((doc) => {
        const chave = chaveDe(doc);
        if (!mapa.has(chave)) {
            mapa.set(chave, { chave, rotulo: rotuloDe(doc), docs: [] });
        }
        mapa.get(chave).docs.push(doc);
    });
    return [...mapa.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

function ordenarPorEnvio(docs) {
    return [...docs].sort((a, b) => {
        const da = a.dataEnvio ? new Date(a.dataEnvio).getTime() : 0;
        const db = b.dataEnvio ? new Date(b.dataEnvio).getTime() : 0;
        return db - da;
    });
}

function textoBusca(doc) {
    return [
        doc.usuarioNome,
        doc.usuarioEmail,
        doc.espacoTitulo,
        doc.nomeArquivo,
        doc.tipoDocumento,
        rotuloDocumento(doc.tipoDocumento),
        doc.categoria,
        rotuloDocumento(doc.categoria),
        doc.status,
        String(doc.usuarioId || ""),
        String(doc.espacoId || ""),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export default function DocumentosAdmin({ embutido = false, filtroUsuario = null, onLimparFiltroUsuario }) {
    const [documentos, setDocumentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [alvo, setAlvo] = useState(null);
    const [acao, setAcao] = useState("");
    const [motivo, setMotivo] = useState("");
    const [erro, setErro] = useState("");
    const [liberados, setLiberados] = useState(() => new Set());
    const [senhaModal, setSenhaModal] = useState(null);
    const [senha, setSenha] = useState("");
    const [erroSenha, setErroSenha] = useState("");
    const [validandoSenha, setValidandoSenha] = useState(false);
    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState(filtroUsuario ? "TODOS" : "PENDENTE");
    const [filtroCategoria, setFiltroCategoria] = useState("TODOS");

    const documentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return ordenarPorEnvio(
            documentos.filter((doc) => {
                const status = String(doc.status || "").toUpperCase();
                const categoria = String(doc.categoria || "").toUpperCase();
                if (filtroStatus !== "TODOS" && status !== filtroStatus) return false;
                if (filtroCategoria !== "TODOS" && categoria !== filtroCategoria) return false;
                if (termo && !textoBusca(doc).includes(termo)) return false;
                return true;
            })
        );
    }, [documentos, busca, filtroStatus, filtroCategoria]);

    const gruposUsuario = useMemo(
        () => agruparPorChave(
            documentosFiltrados.filter((d) => String(d.categoria || "").toUpperCase() === "PESSOA"),
            (d) => `u-${d.usuarioId || d.usuarioEmail || d.id}`,
            (d) => d.usuarioNome || d.usuarioEmail || `Usuário #${d.usuarioId || "?"}`
        ),
        [documentosFiltrados]
    );

    const gruposEspaco = useMemo(
        () => agruparPorChave(
            documentosFiltrados.filter((d) => String(d.categoria || "").toUpperCase() === "ESPACO"),
            (d) => `e-${d.espacoId || d.id}`,
            (d) => {
                const espaco = d.espacoTitulo || `Espaço #${d.espacoId || "?"}`;
                const dono = d.usuarioNome ? ` · ${d.usuarioNome}` : "";
                return `${espaco}${dono}`;
            }
        ),
        [documentosFiltrados]
    );

    const contagemPendentes = useMemo(
        () => documentos.filter((d) => String(d.status || "").toUpperCase() === "PENDENTE").length,
        [documentos]
    );

    const atualizarDocumento = (id, patch) => {
        setDocumentos((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
    };

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
                atualizarDocumento(alvo.id, {
                    status: "REJEITADO",
                    motivoRejeicao: motivo.trim(),
                    dataAnalise: new Date().toISOString(),
                });
            } else {
                await solicitarCorrecao(alvo.id, motivo.trim());
                atualizarDocumento(alvo.id, {
                    status: "CORRECAO_SOLICITADA",
                    motivoRejeicao: motivo.trim(),
                    dataAnalise: new Date().toISOString(),
                });
            }
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
            setErro("");
            if (filtroUsuario?.id) {
                const data = await listarDocumentosUsuario(filtroUsuario.id);
                setDocumentos(Array.isArray(data) ? data : []);
            } else {
                const data = await listarTodosDocumentosAdmin();
                setDocumentos(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
            setErro(filtroUsuario
                ? "Erro ao carregar o histórico de documentos deste usuário."
                : "Erro ao carregar o histórico de documentos.");
            setDocumentos([]);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        setFiltroStatus(filtroUsuario ? "TODOS" : "PENDENTE");
        setBusca("");
        setFiltroCategoria("TODOS");
        carregarDocumentos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroUsuario?.id]);

    const handleAprovar = async (documento) => {
        if (!window.confirm(`Deseja aprovar o documento "${rotuloDocumento(documento.tipoDocumento)}"?`)) {
            return;
        }
        try {
            setProcessando(true);
            await aprovarDocumento(documento.id);
            atualizarDocumento(documento.id, {
                status: "APROVADO",
                motivoRejeicao: null,
                dataAnalise: new Date().toISOString(),
            });
        } catch (error) {
            console.error(error);
            setErro(error.message || "Erro ao aprovar documento.");
        } finally {
            setProcessando(false);
        }
    };

    const pedirSenhaParaVer = (documento) => {
        if (liberados.has(documento.id)) {
            window.open(documento.arquivoUrl, "_blank", "noopener,noreferrer");
            return;
        }
        setSenhaModal(documento);
        setSenha("");
        setErroSenha("");
    };

    const liberarDocumento = (documento) => {
        setLiberados((prev) => new Set(prev).add(documento.id));
        window.open(documento.arquivoUrl, "_blank", "noopener,noreferrer");
        setSenhaModal(null);
        setSenha("");
    };

    const confirmarSenha = async (evento) => {
        evento.preventDefault();
        if (!senhaModal || !senha.trim()) return;
        setValidandoSenha(true);
        setErroSenha("");
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user?.email) throw new Error("Sessão de administrador inválida.");
            const cred = EmailAuthProvider.credential(user.email, senha);
            await reauthenticateWithCredential(user, cred);
            liberarDocumento(senhaModal);
        } catch (error) {
            const codigo = error.code || "";
            if (codigo === "auth/wrong-password" || codigo === "auth/invalid-credential") {
                setErroSenha("Senha incorreta.");
            } else if (codigo === "auth/user-mismatch" || codigo.includes("password")) {
                setErroSenha("Esta conta precisa ter senha cadastrada para abrir documentos.");
            } else {
                setErroSenha(error.message || "Não foi possível confirmar a senha.");
            }
        } finally {
            setValidandoSenha(false);
        }
    };

    const renderListaDocs = (docs) => (
        <div className="documentos-lista documentos-lista--compacta">
            {ordenarPorEnvio(docs).map((documento) => (
                <DocumentoCard
                    key={documento.id}
                    compacto
                    documento={{
                        ...documento,
                        arquivoUrl: liberados.has(documento.id) ? documento.arquivoUrl : null,
                    }}
                    modoAdmin
                    onAprovar={handleAprovar}
                    onRejeitar={(item) => abrirMotivo(item, "rejeitar")}
                    onCorrecao={(item) => abrirMotivo(item, "correcao")}
                    onVisualizar={() => pedirSenhaParaVer(documento)}
                    forcarBotaoVisualizar={Boolean(documento.arquivoUrl)}
                />
            ))}
        </div>
    );

    const renderGrupo = (grupo) => (
        <div key={grupo.chave} className="docs-admin-grupo">
            <h3 className="docs-admin-grupo-titulo">
                {grupo.rotulo}
                <span className="docs-admin-grupo-qtd">{grupo.docs.length}</span>
            </h3>
            {renderListaDocs(grupo.docs)}
        </div>
    );

    const renderSecao = (grupos, titulo, id) => {
        if (filtroCategoria !== "TODOS") {
            const cat = titulo.includes("usuários") ? "PESSOA" : "ESPACO";
            if (filtroCategoria !== cat) return null;
        }
        return (
            <section className="docs-admin-secao" aria-labelledby={`docs-${id}`}>
                <h2 id={`docs-${id}`} className="docs-admin-secao-titulo">{titulo}</h2>
                {grupos.length === 0 ? (
                    <p className="docs-admin-vazio">Nenhum documento nesta categoria com os filtros atuais.</p>
                ) : (
                    <div className="docs-admin-grupos">{grupos.map(renderGrupo)}</div>
                )}
            </section>
        );
    };

    return (
        <div className="documentos-admin">
            {!embutido && (
                <header className="adm-topo">
                    <h1>Documentos</h1>
                    <p>
                        Histórico completo de arquivos enviados. Por padrão mostra pendentes
                        ({contagemPendentes}). Para abrir um arquivo, confirme a senha da sua conta.
                    </p>
                </header>
            )}

            {filtroUsuario && (
                <div className="docs-filtro-usuario">
                    <p>
                        Histórico de <strong>{filtroUsuario.nome || filtroUsuario.email}</strong>
                        {filtroUsuario.email ? ` (${filtroUsuario.email})` : ""}
                    </p>
                    <button type="button" className="btn btn-cancelar" onClick={onLimparFiltroUsuario}>
                        Voltar ao histórico geral
                    </button>
                </div>
            )}

            <div className="docs-admin-toolbar">
                <label className="docs-admin-busca">
                    <span className="sr-only">Pesquisar documentos</span>
                    <input
                        type="search"
                        placeholder="Buscar por nome, e-mail, tipo, espaço…"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </label>

                <div className="docs-admin-filtros">
                    <label>
                        Status
                        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                            <option value="TODOS">Todos</option>
                            <option value="PENDENTE">Pendentes</option>
                            <option value="APROVADO">Aprovados</option>
                            <option value="REJEITADO">Rejeitados</option>
                            <option value="CORRECAO_SOLICITADA">Correção</option>
                        </select>
                    </label>
                    <label>
                        Categoria
                        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                            <option value="TODOS">Todas</option>
                            <option value="PESSOA">Usuários</option>
                            <option value="ESPACO">Espaços</option>
                        </select>
                    </label>
                    <button type="button" className="btn btn-cancelar" onClick={carregarDocumentos} disabled={carregando}>
                        Atualizar
                    </button>
                </div>
            </div>

            <p className="docs-admin-contador" aria-live="polite">
                {carregando
                    ? "Carregando…"
                    : `${documentosFiltrados.length} documento(s) · ${documentos.length} no total`}
            </p>

            {erro && !alvo && <p className="val-erro" role="alert">{erro}</p>}

            {carregando ? (
                <div className="adm-vazio">
                    <p>{filtroUsuario ? "Carregando histórico…" : "Carregando documentos…"}</p>
                </div>
            ) : documentos.length === 0 ? (
                <div className="adm-vazio">
                    <strong>{filtroUsuario ? "Nenhum documento deste usuário" : "Nenhum documento cadastrado"}</strong>
                    <p>{filtroUsuario ? "Esta conta ainda não enviou arquivos." : "Ainda não há envios para analisar."}</p>
                </div>
            ) : documentosFiltrados.length === 0 ? (
                <div className="adm-vazio">
                    <strong>Nenhum resultado</strong>
                    <p>Ajuste a busca ou os filtros para ver o histórico.</p>
                </div>
            ) : (
                <>
                    {alvo && (
                        <form className="val-motivo" onSubmit={confirmarMotivo}>
                            <p>
                                {acao === "rejeitar" ? "Recusar" : "Pedir correção de"}{" "}
                                <strong>{rotuloDocumento(alvo.tipoDocumento)}</strong>
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
                            <div className="adm-acoes">
                                <button type="button" className="btn btn-cancelar" onClick={() => setAlvo(null)} disabled={processando}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-destaque" disabled={processando}>
                                    {processando ? "Salvando…" : "Confirmar"}
                                </button>
                            </div>
                        </form>
                    )}

                    {filtroUsuario ? (
                        renderListaDocs(documentosFiltrados)
                    ) : (
                        <>
                            {renderSecao(gruposUsuario, "Documentos de usuários", "usuarios")}
                            {renderSecao(gruposEspaco, "Documentos de espaços", "espacos")}
                        </>
                    )}
                </>
            )}

            {senhaModal && (
                <div className="docs-senha-modal" role="presentation" onMouseDown={() => setSenhaModal(null)}>
                    <form
                        className="docs-senha-caixa"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="docs-senha-titulo"
                        onMouseDown={(e) => e.stopPropagation()}
                        onSubmit={confirmarSenha}
                    >
                        <h3 id="docs-senha-titulo">Confirme sua senha</h3>
                        <p>
                            Por segurança, digite a senha da conta de administrador para visualizar o documento.
                            O login com Google não libera o arquivo sozinho.
                        </p>
                        <label htmlFor="docs-senha">Senha</label>
                        <input
                            id="docs-senha"
                            type="password"
                            autoFocus
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            autoComplete="current-password"
                        />
                        {erroSenha && <p className="val-erro" role="alert">{erroSenha}</p>}
                        <div className="adm-acoes">
                            <button type="button" className="btn btn-cancelar" onClick={() => setSenhaModal(null)} disabled={validandoSenha}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-destaque" disabled={validandoSenha || !senha}>
                                {validandoSenha ? "Verificando…" : "Ver documento"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
