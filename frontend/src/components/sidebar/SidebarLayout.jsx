import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./SidebarLayout.css";
import HeaderHome from "../../pages/home/components/HeaderHome";

export default function SidebarLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    
    const [retraida, setRetraida] = useState(false);

    const menuItems = [
        { label: "Início", path: "/home", icon: "🏠" },
        { label: "Minhas Reservas", path: "/minhas-reservas", icon: "📅" },
        { label: "Painel do Locador", path: "/perfil_locador", icon: "🔑" },
        { label: "Reservas", path: "/locador/reservas", icon: "📋" },
        { label: "Documentos", path: "/documentos/usuario", icon: "📁" },
    ];

    // NOVA FUNÇÃO DE LOGOUT COM REDIRECIONAMENTO EXPLÍCITO
    const handleLogout = async () => {
        try {
            await logout();       // Limpa o Firebase e o estado global
            navigate("/home");    // Leva explicitamente para a Home sem estar logado
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    return (
        <div className={`app-layout ${retraida ? "sidebar-collapsed" : ""}`}>
            <aside className={`sidebar ${retraida ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    {!retraida && (
                        <h2 className="sidebar-logo" onClick={() => navigate("/home")}>
                            LOCAFESTA
                        </h2>
                    )}
                    <button 
                        className="toggle-btn" 
                        onClick={() => setRetraida(!retraida)}
                        title={retraida ? "Expandir Menu" : "Recolher Menu"}
                    >
                        {retraida ? "➡️" : "⬅️"}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const ativo = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                className={`sidebar-item ${ativo ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                                title={retraida ? item.label : ""}
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                {!retraida && <span className="sidebar-label">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {/* Alterado de onClick={logout} para onClick={handleLogout} */}
                    <button onClick={handleLogout} className="sidebar-item logout" title={retraida ? "Sair" : ""}>
                        <span className="sidebar-icon">🚪</span>
                        {!retraida && <span className="sidebar-label">Sair</span>}
                    </button>
                </div>
            </aside>

            <main className="sidebar-content">
                <HeaderHome />
                <Outlet />
            </main>
        </div>
    );
}