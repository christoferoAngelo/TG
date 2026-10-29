import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import CaixaAvisos from "../../../components/notificacao/CaixaAvisos";
import MenuPerfil from "../explorar/MenuPerfil";
import "../Home.css";
import "../HomeExplorar.css";

export default function HeaderHome() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuarioLogado } = useAuth();

    const isLocador = Boolean(usuarioLogado?.locador || usuarioLogado?.isLocador);

    const handleAnunciarClick = () => {
        if (!usuarioLogado) {
            navigate("/login", {
                state: { fundo: { pathname: location.pathname, search: location.search, hash: location.hash } },
            });
            return;
        }
        navigate(isLocador ? "/perfil_locador" : "/cadastro-locador");
    };

    return (
        <header className="header-home">
            <div className="logo-container" onClick={() => navigate("/home")}>
                <h2 className="logo">LocaFesta</h2>
            </div>

            <div className="nav-buttons header-home-acoes">
                <button type="button" className="hm-cta-anunciar" onClick={handleAnunciarClick}>
                    {isLocador ? "Meu negócio" : "Vou anunciar"}
                </button>

                {usuarioLogado ? <CaixaAvisos usuarioId={usuarioLogado.id} /> : null}

                {usuarioLogado ? (
                    <button
                        type="button"
                        className="hm-listas"
                        aria-label="Favoritos"
                        onClick={() => navigate("/favoritos")}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z" />
                        </svg>
                    </button>
                ) : null}

                <MenuPerfil />
            </div>
        </header>
    );
}
