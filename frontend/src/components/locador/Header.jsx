import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header({ usuarioLogado, logout }) {
    const navigate = useNavigate();

    return (
        <header className="header">
            <h2 className="logo cursor-pointer" onClick={() => navigate("/home")}>
                LocaFesta - Área do Anunciante
            </h2>
            <div className="user-menu header-actions">
                <span>Olá, <strong>{usuarioLogado?.nome}</strong>!</span>
                
                <button onClick={() => navigate("/dashboard")} className="btn btn-cancelar">
                    Voltar ao Painel
                </button>
                <button onClick={logout} className="logout-btn">Sair</button>
            </div>
        </header>
    );
}