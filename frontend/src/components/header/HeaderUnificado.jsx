import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Ajuste o caminho se necessário
import "../header/HeaderUnificado.css"; // Se você tiver um CSS global para o header

export default function HeaderUnificado() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();

    // Descobre se o usuário é locador para direcionar o botão de perfil corretamente
    const irParaPerfil = () => {
        if (usuarioLogado?.locador) {
            navigate("/perfil_locador");
        } else {
            navigate("/perfil");
        }
    };

    return (
        <header className="header-unificado">
            <div className="header-saudacao">
                <span>Olá, <strong>{usuarioLogado?.nome || "Usuário"}</strong>! 👋</span>
            </div>

            <div className="header-acoes-direita">
                <button 
                    type="button" 
                    onClick={irParaPerfil} 
                    className="btn-perfil-topo"
                >
                    👤 Meu Perfil
                </button>
            </div>
        </header>
    );
}