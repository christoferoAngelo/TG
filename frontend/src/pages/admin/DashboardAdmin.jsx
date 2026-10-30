import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmacaoSair from "../../components/ConfirmacaoSair";
import Sidebar from "../../components/admin/Sidebar";
import OverviewTab from "../../components/admin/OverviewTab";
import UsuariosTab from "../../components/admin/UsuariosTab";
import NovoAdminTab from "../../components/admin/NovoAdminTab";
import EspacosTab from "../../components/admin/EspacosTab";
import DocumentosAdmin from "../documentos/DocumentosAdmin";
import CaracteristicasPage from "../locador/CaracteristicasPage";
import "./DashboardAdmin.css";

const SECOES = {
    overview: ["Visão geral", "Acompanhe o movimento de contas no período."],
    usuarios: ["Usuários", "Locadores e locatários — consulte dados, documentos e remova contas quando necessário."],
    espacos: ["Espaços", "Analise anúncios pendentes, aprovados e recusados."],
    documentos: ["Documentos", "Revise arquivos enviados por pessoas e espaços."],
    caracteristicas: ["Características", "Itens que o locador pode marcar no anúncio."],
    novo_admin: ["Administradores", "Contas com acesso a este painel."],
};

export default function DashboardAdmin() {
    const { logout } = useAuth();
    const [sidebarExpandida, setSidebarExpandida] = useState(false);
    const [menuAtivo, setMenuAtivo] = useState("overview");
    const [filtroDocsUsuario, setFiltroDocsUsuario] = useState(null);
    const [confirmarSair, setConfirmarSair] = useState(false);
    const [saindo, setSaindo] = useState(false);

    const handleLogout = async () => {
        setSaindo(true);
        try {
            await logout();
            setConfirmarSair(false);
            window.location.href = "/login";
        } catch (error) {
            console.error("Erro ao sair:", error);
            setSaindo(false);
        }
    };

    const irParaDocumentosDoUsuario = (usuario) => {
        setFiltroDocsUsuario(usuario);
        setMenuAtivo("documentos");
    };

    const renderConteudoAtivo = () => {
        switch (menuAtivo) {
            case "usuarios":
                return <UsuariosTab onVerDocumentos={irParaDocumentosDoUsuario} />;
            case "espacos":
            case "moderacao_espacos":
                return <EspacosTab />;
            case "documentos":
                return (
                    <DocumentosAdmin
                        embutido
                        filtroUsuario={filtroDocsUsuario}
                        onLimparFiltroUsuario={() => setFiltroDocsUsuario(null)}
                    />
                );
            case "caracteristicas":
                return <CaracteristicasPage embutido />;
            case "novo_admin":
                return <NovoAdminTab />;
            default:
                return <OverviewTab />;
        }
    };

    const [titulo, subtitulo] = SECOES[menuAtivo] || SECOES.overview;

    return (
        <div className="adm">
            <Sidebar
                sidebarExpandida={sidebarExpandida}
                setSidebarExpandida={setSidebarExpandida}
                menuAtivo={menuAtivo}
                setMenuAtivo={(id) => {
                    if (id !== "documentos") setFiltroDocsUsuario(null);
                    setMenuAtivo(id);
                }}
                handleLogout={() => setConfirmarSair(true)}
            />

            <main className="adm-main">
                <header className="adm-topo">
                    <h1>{titulo}</h1>
                    <p>
                        {menuAtivo === "documentos" && filtroDocsUsuario
                            ? `Histórico de documentos de ${filtroDocsUsuario.nome || filtroDocsUsuario.email}.`
                            : subtitulo}
                    </p>
                </header>
                {renderConteudoAtivo()}
            </main>

            <ConfirmacaoSair
                aberto={confirmarSair}
                saindo={saindo}
                onCancelar={() => !saindo && setConfirmarSair(false)}
                onConfirmar={handleLogout}
            />
        </div>
    );
}
