import { IconeAdmin } from "./AdminIcons";
import "./Sidebar.css";

const GRUPOS = [
    {
        titulo: "Painel",
        itens: [
            { id: "overview", label: "Visão geral", icone: "visao" },
            { id: "usuarios", label: "Usuários", icone: "usuarios" },
            { id: "espacos", label: "Espaços", icone: "espacos" },
        ],
    },
    {
        titulo: "Análise",
        itens: [
            { id: "documentos", label: "Documentos", icone: "documentos" },
            { id: "caracteristicas", label: "Características", icone: "caracteristicas" },
        ],
    },
    {
        titulo: "Equipe",
        itens: [
            { id: "novo_admin", label: "Administradores", icone: "admin" },
        ],
    },
];

export default function Sidebar({
    sidebarExpandida,
    setSidebarExpandida,
    menuAtivo,
    setMenuAtivo,
    handleLogout,
}) {
    return (
        <aside className={`adm-side ${sidebarExpandida ? "aberta" : "recolhida"}`}>
            <div className="adm-side-topo">
                {sidebarExpandida && (
                    <div className="adm-marca">
                        <strong>LocaFesta</strong>
                        <span>Admin</span>
                    </div>
                )}
                <button
                    type="button"
                    className="adm-recolher"
                    onClick={() => setSidebarExpandida(!sidebarExpandida)}
                    title={sidebarExpandida ? "Recolher menu" : "Expandir menu"}
                    aria-expanded={sidebarExpandida}
                    aria-label={sidebarExpandida ? "Recolher menu" : "Expandir menu"}
                >
                    <IconeAdmin nome="menu" />
                </button>
            </div>

            <nav className="adm-side-nav" aria-label="Menu do administrador">
                {GRUPOS.map((grupo) => (
                    <div className="adm-grupo" key={grupo.titulo}>
                        {sidebarExpandida && <span className="adm-grupo-titulo">{grupo.titulo}</span>}
                        {grupo.itens.map((item) => {
                            const ativo = menuAtivo === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`adm-item ${ativo ? "ativo" : ""}`}
                                    onClick={() => setMenuAtivo(item.id)}
                                    title={sidebarExpandida ? undefined : item.label}
                                    aria-current={ativo ? "page" : undefined}
                                >
                                    <span className="adm-item-ico">
                                        <IconeAdmin nome={item.icone} />
                                    </span>
                                    {sidebarExpandida && <span className="adm-item-label">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="adm-side-rodape">
                <button
                    type="button"
                    className="adm-item sair"
                    title={sidebarExpandida ? undefined : "Sair"}
                    onClick={handleLogout}
                >
                    <span className="adm-item-ico">
                        <IconeAdmin nome="sair" />
                    </span>
                    {sidebarExpandida && <span className="adm-item-label">Sair</span>}
                </button>
            </div>
        </aside>
    );
}
