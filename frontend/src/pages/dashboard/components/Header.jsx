import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext"; // ajuste o caminho se necessário

export default function Header() {
    const { usuarioLogado, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (typeof logout === "function") {
            logout();
        } else {
            console.error("A função de logout não está disponível no AuthContext.");
        }
    };

    return (
        <header className="header">
            <h2 className="logo cursor-pointer" onClick={() => navigate("/home")}>
                LocaFesta
            </h2>
            <div className="user-menu">
                <span>Olá, <strong>{usuarioLogado?.nome || "Usuário"}</strong>!</span>
                
                <button 
                    type="button" 
                    onClick={() => navigate("/home")} 
                    className="btn btn-cancelar"
                >
                    Home
                </button>
                
                <button 
                    type="button" 
                    onClick={handleLogout} 
                    className="logout-btn"
                >
                    Sair
                </button>
            </div>
        </header>
    );
}