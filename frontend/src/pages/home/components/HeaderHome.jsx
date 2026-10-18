import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export default function HeaderHome() {
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();
    
    const isLocador = usuarioLogado?.locador;

    const handleAnunciarClick = () => {
        if (!usuarioLogado) {
            navigate("/login");
        } else if (isLocador) {
            navigate("/perfil_locador");
        } else {
            navigate("/perfil");
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

            <div className="nav-buttons">
                <button onClick={handleAnunciarClick} className="btn-nav btn-highlight">
                    {textoBotaoAnunciar}
                </button>
                
                <button 
                    onClick={() => navigate(usuarioLogado ? "/perfil" : "/login")} 
                    className="btn-nav"
                >
                    👤 {usuarioLogado ? "Meu Perfil" : "Entrar"}
                </button>
            </div>
        </header>
    );
}