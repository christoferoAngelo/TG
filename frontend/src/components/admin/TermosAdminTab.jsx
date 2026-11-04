import { useCallback, useEffect, useState } from "react";
import { termoService } from "../../services/termoService";
import { rotuloVersaoTermo } from "../apresentacao/termos";
import "./TermosAdminTab.css";

const ABAS = [
    { id: "LOCADOR", label: "Locadores" },
    { id: "LOCATARIO", label: "Locatários" },
];

function statusRotulo(status) {
    if (status === "PUBLICADO") return "Publicado";
    if (status === "RASCUNHO") return "Rascunho";
    if (status === "ARQUIVADO") return "Arquivado";
    return status || "—";
}

export default function TermosAdminTab() {
    const [tipo, setTipo] = useState("LOCADOR");
    const [lista, setLista] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [toast, setToast] = useState(null);

    const [editorAberto, setEditorAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [confirmarPublicar, setConfirmarPublicar] = useState(false);
    const [verHistorico, setVerHistorico] = useState(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const dados = await termoService.listarAdmin(tipo);
            setLista(Array.isArray(dados) ? dados : []);
        } catch (e) {
            console.error(e);
            setErro(e.message || "Não foi possível carregar os termos.");
            setLista([]);
        } finally {
            setCarregando(false);
        }
    }, [tipo]);

    useEffect(() => {
        carregar();
        setEditorAberto(false);
        setEditando(null);
        setVerHistorico(null);
    }, [carregar]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const vigente = lista.find((t) => t.status === "PUBLICADO") || null;

    const abrirNovaVersao = async () => {
        setSalvando(true);
        setErro(null);
        try {
            const criado = await termoService.criarRascunho({
                tipo,
                titulo: vigente?.titulo || "",
                conteudo: "",
            });
            setEditando(criado);
            setTitulo(criado.titulo || "");
            setConteudo(criado.conteudo || "");
            setEditorAberto(true);
            setToast("Rascunho criado.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Falha ao criar rascunho.");
        } finally {
            setSalvando(false);
        }
    };

    const abrirEdicao = (termo) => {
        if (termo.status !== "RASCUNHO") {
            setVerHistorico(termo);
            return;
        }
        setEditando(termo);
        setTitulo(termo.titulo || "");
        setConteudo(termo.conteudo || "");
        setEditorAberto(true);
        setVerHistorico(null);
    };

    const salvarRascunho = async () => {
        if (!editando?.id) return;
        setSalvando(true);
        try {
            const atualizado = await termoService.atualizarRascunho(editando.id, {
                titulo,
                conteudo,
            });
            setEditando(atualizado);
            setToast("Rascunho salvo.");
            await carregar();
        } catch (e) {
            setErro(e.message || "Falha ao salvar.");
        } finally {
            setSalvando(false);
        }
    };

    const publicar = async () => {
        if (!editando?.id) return;
        setSalvando(true);
        setConfirmarPublicar(false);
        try {
            await termoService.atualizarRascunho(editando.id, { titulo, conteudo });
            await termoService.publicar(editando.id);
            setToast("Versão publicada.");
            setEditorAberto(false);
            setEditando(null);
            await carregar();
        } catch (e) {
            setErro(e.message || "Falha ao publicar.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="adm-termos">
            {toast && (
                <div className="adm-termos-toast" role="status">
                    {toast}
                </div>
            )}

            <div className="adm-termos-abas" role="tablist" aria-label="Audiência dos termos">
                {ABAS.map((aba) => (
                    <button
                        key={aba.id}
                        type="button"
                        role="tab"
                        aria-selected={tipo === aba.id}
                        className={`adm-termos-aba${tipo === aba.id ? " ativa" : ""}`}
                        onClick={() => setTipo(aba.id)}
                    >
                        {aba.label}
                    </button>
                ))}
            </div>

            {erro && (
                <div className="adm-termos-erro" role="alert">
                    <p>{erro}</p>
                    <button type="button" className="btn" onClick={carregar}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {carregando ? (
                <div className="adm-termos-skeleton" aria-busy="true">
                    <div className="sk" />
                    <div className="sk" />
                    <div className="sk curto" />
                </div>
            ) : (
                <>
                    <section className="adm-painel adm-termos-vigente">
                        <div className="adm-termos-cab">
                            <div>
                                <h3>Versão vigente</h3>
                                {vigente ? (
                                    <p>{rotuloVersaoTermo(vigente)}</p>
                                ) : (
                                    <p>Nenhuma versão publicada para esta audiência.</p>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn btn-destaque"
                                onClick={abrirNovaVersao}
                                disabled={salvando}
                            >
                                Criar nova versão
                            </button>
                        </div>
                        {vigente && (
                            <pre className="adm-termos-previa">{vigente.conteudo?.slice(0, 600)}
                                {vigente.conteudo?.length > 600 ? "…" : ""}
                            </pre>
                        )}
                    </section>

                    {editorAberto && editando && (
                        <section className="adm-painel adm-termos-editor">
                            <div className="adm-termos-cab">
                                <div>
                                    <h3>Editor — versão {editando.versao}</h3>
                                    <p>Rascunho. Publique para valer nos novos cadastros.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setEditorAberto(false);
                                        setEditando(null);
                                    }}
                                >
                                    Fechar
                                </button>
                            </div>
                            <label className="adm-termos-campo" htmlFor="termo-titulo">
                                Título
                                <input
                                    id="termo-titulo"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    maxLength={200}
                                />
                            </label>
                            <label className="adm-termos-campo" htmlFor="termo-conteudo">
                                Conteúdo
                                <textarea
                                    id="termo-conteudo"
                                    rows={16}
                                    value={conteudo}
                                    onChange={(e) => setConteudo(e.target.value)}
                                />
                                <span className="adm-termos-contador">
                                    {conteudo.length.toLocaleString("pt-BR")} caracteres
                                </span>
                            </label>
                            <div className="adm-termos-acoes">
                                <button
                                    type="button"
                                    className="btn"
                                    disabled={salvando}
                                    onClick={salvarRascunho}
                                >
                                    Salvar rascunho
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-destaque"
                                    disabled={salvando || conteudo.trim().length < 40}
                                    onClick={() => setConfirmarPublicar(true)}
                                >
                                    Publicar
                                </button>
                            </div>
                        </section>
                    )}

                    <section className="adm-painel">
                        <h3>Histórico</h3>
                        <p className="section-description">Versões por status e data.</p>
                        {lista.length === 0 ? (
                            <p>Nenhuma versão ainda.</p>
                        ) : (
                            <div className="adm-termos-tabela-wrap">
                                <table className="adm-termos-tabela">
                                    <thead>
                                        <tr>
                                            <th>Versão</th>
                                            <th>Status</th>
                                            <th>Criado em</th>
                                            <th>Publicado em</th>
                                            <th>Autor</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lista.map((t) => (
                                            <tr key={t.id}>
                                                <td>{t.versao}</td>
                                                <td>
                                                    <span className={`adm-termos-badge status-${(t.status || "").toLowerCase()}`}>
                                                        {statusRotulo(t.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {t.criadoEm
                                                        ? new Date(t.criadoEm).toLocaleString("pt-BR")
                                                        : "—"}
                                                </td>
                                                <td>
                                                    {t.publicadoEm
                                                        ? new Date(t.publicadoEm).toLocaleString("pt-BR")
                                                        : "—"}
                                                </td>
                                                <td>{t.criadoPorNome || "—"}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        onClick={() => abrirEdicao(t)}
                                                    >
                                                        {t.status === "RASCUNHO" ? "Editar" : "Ver"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {verHistorico && (
                <div
                    className="adm-termos-modal-fundo"
                    role="presentation"
                    onMouseDown={() => setVerHistorico(null)}
                >
                    <div
                        className="adm-termos-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="termo-hist-titulo"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <header>
                            <h3 id="termo-hist-titulo">
                                Versão {verHistorico.versao} — {statusRotulo(verHistorico.status)}
                            </h3>
                            <button type="button" className="btn" onClick={() => setVerHistorico(null)}>
                                Fechar
                            </button>
                        </header>
                        <p className="adm-termos-meta">{rotuloVersaoTermo(verHistorico)}</p>
                        <pre className="adm-termos-previa">{verHistorico.conteudo}</pre>
                    </div>
                </div>
            )}

            {confirmarPublicar && (
                <div
                    className="adm-termos-modal-fundo"
                    role="presentation"
                    onMouseDown={() => !salvando && setConfirmarPublicar(false)}
                >
                    <div
                        className="adm-termos-modal adm-termos-modal--curto"
                        role="dialog"
                        aria-modal="true"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <h3>Publicar esta versão?</h3>
                        <p>
                            Esta versão passará a valer para novos cadastros e será pedida de novo aos
                            usuários atuais.
                        </p>
                        <div className="adm-termos-acoes">
                            <button
                                type="button"
                                className="btn"
                                disabled={salvando}
                                onClick={() => setConfirmarPublicar(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-destaque"
                                disabled={salvando}
                                onClick={publicar}
                            >
                                Confirmar publicação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
