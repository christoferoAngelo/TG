import React from "react";
import { useAuth } from "../../../contexts/AuthContext"; // ajuste o caminho se necessário

export default function Header() {
    const { usuarioLogado, logout } = useAuth();

    return (
        <header className="header">
            <h2 className="logo">LocaFesta</h2>
            <div className="user-menu">
                <span>Olá, <strong>{usuarioLogado?.nome}</strong>!</span>
                <button onClick={logout} className="logout-btn">Sair</button>
            </div>
        </header>
    );
}