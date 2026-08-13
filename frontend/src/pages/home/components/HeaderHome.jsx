import React from "react";
import { useNavigate } from "react-router-dom";
// Opcional: Você pode importar o Home.css aqui ou direto na Home.jsx

export default function HeaderHome() {
    const navigate = useNavigate();

    return (
        <header className="header-home">
            {/* Logo */}
            <div className="logo-container" onClick={() => navigate("/home")}>
                <h2 className="logo">LocaFesta</h2>
            </div>

            {/* Barra de Pesquisa (Apenas visual por enquanto) */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar por cidade, salão, chácara..."
                    className="search-input"
                />
                <button className="search-btn" title="Pesquisar">
                    🔍
                </button>
            </div>

            {/* Ações do Usuário */}
            <div className="nav-buttons">
                <button onClick={() => navigate("/dashboard")} className="btn-nav">
                    👤 Meu Perfil
                </button>
                <button onClick={() => navigate("/dashboard-locador")} className="btn-nav btn-highlight">
                    🏠 Anunciar Espaço
                </button>
            </div>
        </header>
    );
}