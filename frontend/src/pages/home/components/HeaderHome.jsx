import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export default function HeaderHome({ onSearch }) { // Recebendo a função onSearch
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();
    
    // 👇 Estado para a barra de pesquisa
    const [termoPesquisa, setTermoPesquisa] = useState("");

    const isLocador = usuarioLogado?.locador;

    const handleAnunciarClick = () => {
        if (!usuarioLogado) {
            navigate("/login");
        } else if (isLocador) {
            navigate("/dashboard-locador");
        } else {
            navigate("/dashboard");
        }
    };

    // 👇 Função que dispara a busca ao clicar na lupa ou apertar Enter
    const handleBuscar = () => {
        if (onSearch) {
            onSearch(termoPesquisa);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBuscar();
        }
    };

    const textoBotaoAnunciar = !usuarioLogado 
        ? "🏠 Anunciar Espaço" 
        : isLocador 
            ? "🏠 Painel de Anúncios" 
            : "🏠 Criar Perfil de Anunciante";

    return (
        <header className="header-home">
            <div className="logo-container" onClick={() => navigate("/home")}>
                <h2 className="logo">LocaFesta</h2>
            </div>

            {/* Barra de Pesquisa */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar por cidade, salão, chácara..."
                    className="search-input"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    onKeyDown={handleKeyDown} // Busca ao dar Enter
                />
                <button onClick={handleBuscar} className="search-btn" title="Pesquisar">
                    🔍
                </button>
            </div>

            <div className="nav-buttons">
                <button onClick={handleAnunciarClick} className="btn-nav btn-highlight">
                    {textoBotaoAnunciar}
                </button>
                <button 
                    onClick={() => navigate(usuarioLogado ? "/dashboard" : "/login")} 
                    className="btn-nav"
                >
                    👤 {usuarioLogado ? "Meu Perfil" : "Entrar"}
                </button>
            </div>
        </header>
    );
}