import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./SidebarLayout.css";
import HeaderHome from "../../pages/home/components/HeaderHome";

import iconCalendario from "../../assets/calendario_icon.png";
import iconChave from "../../assets/chave_icon.png";
import iconDocumentos from "../../assets/documentos_icons.png";
import iconSair from "../../assets/sair_icon.png";
import iconMenu from "../../assets/tres_barras_icon.png";

function IconeInicio() {
    return (
        <svg
            className="sidebar-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconeFavoritos() {
    return (
        <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconeMenu({ src, alt = "" }) {
    return <img src={src} alt={alt} className="sidebar-icon-img" />;
}

export default function SidebarLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, usuarioLogado } = useAuth();

    const [retraida, setRetraida] = useState(false);
    const naHome = location.pathname === "/home";

    const menuItems = [
        { label: "Início", path: "/home", icon: "inicio" },
        { label: "Favoritos", path: "/favoritos", icon: "favoritos" },
        { label: "Minhas Reservas", path: "/minhas-reservas", iconSrc: iconCalendario },
        { label: "Painel do Locador", path: "/perfil_locador", iconSrc: iconChave },
        { label: "Documentos", path: "/documentos/usuario", iconSrc: iconDocumentos },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/home");
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    const renderIcone = (item) => {
        if (item.icon === "inicio") {
            return <IconeInicio />;
        }
        if (item.icon === "favoritos") {
            return <IconeFavoritos />;
        }
        return <IconeMenu src={item.iconSrc} />;
    };

    return (
        <div className={`app-layout ${retraida ? "sidebar-collapsed" : ""}`}>
            <aside className={`sidebar ${retraida ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    {!retraida && (
                        <button
                            type="button"
                            className="sidebar-marca"
                            onClick={() => navigate("/home")}
                        >
                            LocaFesta
                        </button>
                    )}
                    <button
                        type="button"
                        className="toggle-btn"
                        onClick={() => setRetraida(!retraida)}
                        title={retraida ? "Expandir menu" : "Recolher menu"}
                        aria-expanded={!retraida}
                        aria-label={retraida ? "Expandir menu" : "Recolher menu"}
                    >
                        <IconeMenu src={iconMenu} alt="" />
                    </button>
                </div>

                <nav className="sidebar-nav" aria-label="Menu principal">
                    {menuItems.map((item) => {
                        const ativo = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                type="button"
                                className={`sidebar-item ${ativo ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                                title={retraida ? item.label : undefined}
                            >
                                <span className="sidebar-icon">{renderIcone(item)}</span>
                                {!retraida && <span className="sidebar-label">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {usuarioLogado && (
                    <div className="sidebar-footer">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="sidebar-item logout"
                            title={retraida ? "Sair" : undefined}
                        >
                            <span className="sidebar-icon">
                                <IconeMenu src={iconSair} />
                            </span>
                            {!retraida && <span className="sidebar-label">Sair</span>}
                        </button>
                    </div>
                )}
            </aside>

            <main className="sidebar-content">
                {!naHome && <HeaderHome />}
                <Outlet />
            </main>
        </div>
    );
}
