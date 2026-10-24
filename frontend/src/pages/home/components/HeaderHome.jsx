import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import CaixaAvisos from "../../../components/notificacao/CaixaAvisos";
import userIcon from "../../../assets/user_icon.png";

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
        ? "Anunciar Espaço"
        : isLocador
            ? "Painel de Anúncios"
            : "Criar Perfil de Anunciante";

    return (
        <header className="header-home">
            <div className="logo-container" onClick={() => navigate("/home")}>
                <h2 className="logo">LocaFesta</h2>
            </div>

            <div className="nav-buttons">
                <CaixaAvisos usuarioId={usuarioLogado?.id} />
                <button onClick={handleAnunciarClick} className="btn-nav btn-highlight">
                    <svg
                        className="btn-nav-icone"
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
                    {textoBotaoAnunciar}
                </button>
                
                <button 
                    onClick={() => navigate(usuarioLogado ? "/perfil" : "/login")} 
                    className="btn-nav"
                >
                    {usuarioLogado?.fotoUrl ? (
                        <img src={usuarioLogado.fotoUrl} alt="" className="btn-nav-icone btn-nav-foto" />
                    ) : (
                        <img src={userIcon} alt="" className="btn-nav-icone" />
                    )}
                    {usuarioLogado ? "Meu Perfil" : "Entrar"}
                </button>
            </div>
        </header>
    );
}