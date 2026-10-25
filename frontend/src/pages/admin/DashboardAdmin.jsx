import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
    usuarios: ["Usuários", "Busque, edite ou remova contas da plataforma."],
    espacos: ["Espaços", "Analise anúncios pendentes, aprovados e recusados."],
    documentos: ["Documentos", "Revise arquivos enviados por pessoas e espaços."],
    caracteristicas: ["Características", "Itens que o locador pode marcar no anúncio."],
    novo_admin: ["Administradores", "Contas com acesso a este painel."],
};

export default function DashboardAdmin() {
    const { logout } = useAuth();
    const [sidebarExpandida, setSidebarExpandida] = useState(false);
    const [menuAtivo, setMenuAtivo] = useState("overview");

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    const renderConteudoAtivo = () => {
        switch (menuAtivo) {
            case "usuarios":
                return <UsuariosTab />;
            case "espacos":
            case "moderacao_espacos":
                return <EspacosTab />;
            case "documentos":
                return <DocumentosAdmin embutido />;
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
                setMenuAtivo={setMenuAtivo}
                handleLogout={handleLogout}
            />

            <main className="adm-main">
                <header className="adm-topo">
                    <h1>{titulo}</h1>
                    <p>{subtitulo}</p>
                </header>
                {renderConteudoAtivo()}
            </main>
        </div>
    );
}
