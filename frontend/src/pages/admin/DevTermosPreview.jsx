import { useEffect, useState } from "react";
import TermosModal from "../../components/apresentacao/TermosModal";
import { rotuloVersaoTermo } from "../../components/apresentacao/termos";
import "../../components/admin/TermosAdminTab.css";
import "../admin/DashboardAdmin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Preview DEV para prints dos Termos (cadastro + admin).
 * ?view=cadastro|admin|historico|editor
 */
export default function DevTermosPreview() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") || "cadastro";
    const tipo = params.get("tipo") || "LOCADOR";

    const [vigente, setVigente] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        fetch(`${API}/api/termos/${tipo}/vigente`)
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text());
                return r.json();
            })
            .then(setVigente)
            .catch((e) => setErro(e.message || "Falha ao carregar"));
    }, [tipo]);

    if (erro) {
        return <p style={{ padding: 24 }}>Erro: {erro}</p>;
    }
    if (!vigente) {
        return <p style={{ padding: 24 }}>Carregando termos…</p>;
    }

    if (view === "cadastro") {
        return (
            <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
                <TermosModal
                    aberto
                    termosForcados={[vigente]}
                    onAceitar={() => {}}
                    onFechar={() => {}}
                    tipoAudiencia={tipo}
                />
            </div>
        );
    }

    // Preview só com a vigente real do seed (v1). Novas versões aparecem após "Criar nova versão" no admin autenticado.
    const historico = [
        {
            ...vigente,
            status: "PUBLICADO",
            criadoPorNome: "—",
            criadoEm: vigente.publicadoEm,
        },
    ];

    if (view === "editor") {
        return (
            <div className="adm" style={{ display: "block", height: "auto", minHeight: "100vh" }}>
                <main className="adm-main">
                    <header className="adm-topo">
                        <h1>Termos de uso</h1>
                        <p>Versões publicadas para locadores e locatários.</p>
                    </header>
                    <div className="adm-termos">
                        <section className="adm-painel adm-termos-editor">
                            <div className="adm-termos-cab">
                                <div>
                                    <h3>Editor — versão 2</h3>
                                    <p>Rascunho. Publique para valer nos novos cadastros.</p>
                                </div>
                            </div>
                            <label className="adm-termos-campo" htmlFor="dev-titulo">
                                Título
                                <input id="dev-titulo" defaultValue={vigente.titulo} readOnly />
                            </label>
                            <label className="adm-termos-campo" htmlFor="dev-conteudo">
                                Conteúdo
                                <textarea id="dev-conteudo" rows={14} defaultValue={vigente.conteudo} readOnly />
                                <span className="adm-termos-contador">
                                    {(vigente.conteudo || "").length.toLocaleString("pt-BR")} caracteres
                                </span>
                            </label>
                            <div className="adm-termos-acoes">
                                <button type="button" className="btn">
                                    Salvar rascunho
                                </button>
                                <button type="button" className="btn btn-destaque">
                                    Publicar
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="adm" style={{ display: "block", height: "auto", minHeight: "100vh" }}>
            <main className="adm-main">
                <header className="adm-topo">
                    <h1>Termos de uso</h1>
                    <p>Versões publicadas para locadores e locatários.</p>
                </header>
                <div className="adm-termos">
                    <div className="adm-termos-abas">
                        <button type="button" className={`adm-termos-aba${tipo === "LOCADOR" ? " ativa" : ""}`}>
                            Locadores
                        </button>
                        <button type="button" className={`adm-termos-aba${tipo === "LOCATARIO" ? " ativa" : ""}`}>
                            Locatários
                        </button>
                    </div>
                    <section className="adm-painel adm-termos-vigente">
                        <div className="adm-termos-cab">
                            <div>
                                <h3>Versão vigente</h3>
                                <p>{rotuloVersaoTermo(vigente)}</p>
                            </div>
                            <button type="button" className="btn btn-destaque">
                                Criar nova versão
                            </button>
                        </div>
                        <pre className="adm-termos-previa">
                            {(vigente.conteudo || "").slice(0, 600)}
                            {(vigente.conteudo || "").length > 600 ? "…" : ""}
                        </pre>
                    </section>
                    {(view === "historico" || view === "admin") && (
                        <section className="adm-painel">
                            <h3>Histórico</h3>
                            <p className="section-description">Versões por status e data.</p>
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
                                        {historico.map((t) => (
                                            <tr key={t.id}>
                                                <td>{t.versao}</td>
                                                <td>
                                                    <span
                                                        className={`adm-termos-badge status-${(t.status || "").toLowerCase()}`}
                                                    >
                                                        {t.status === "PUBLICADO"
                                                            ? "Publicado"
                                                            : t.status === "RASCUNHO"
                                                              ? "Rascunho"
                                                              : t.status}
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
                                                    <button type="button" className="btn">
                                                        {t.status === "RASCUNHO" ? "Editar" : "Ver"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
