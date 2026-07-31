import React from "react";
import { useNavigate } from "react-router-dom";

export default function MeusPerfis({ usuarioLogado, setModalAberto }) {
    const navigate = useNavigate();

    return (
        <div className="card">
            <h4 className="card-title card-title-spaced">Meus Perfis na Plataforma:</h4>

            {/* Perfil de Locatário */}
            <div className="perfil-row">
                <div>
                    <strong className="perfil-title">Perfil de Locatário (Alugar Espaços)</strong>
                    <span className="perfil-desc">
                        {usuarioLogado?.isLocatario ? "Você já pode alugar salões para suas festas." : "Necessário para poder alugar salões."}
                    </span>
                </div>
                <div>
                    {usuarioLogado?.isLocatario ? (
                        <span className="badge badge-ativo">Ativo</span>
                    ) : (
                        <button onClick={() => setModalAberto('locatario')} className="btn btn-acao">
                            Completar Cadastro (CPF)
                        </button>
                    )}
                </div>
            </div>

            <hr className="divisor" />

            {/* Perfil de Locador */}
            <div className="perfil-row">
                <div>
                    <strong className="perfil-title">Perfil de Locador (Anunciar Festas)</strong>
                    <span className="perfil-desc">
                        {usuarioLogado?.isLocador ? "Você é um anunciante parceiro do LocaFesta!" : "Ganhe dinheiro alugando seu espaço ou salão."}
                    </span>
                </div>
                <div>
                    {usuarioLogado?.isLocador ? (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span className="badge badge-locador">Anunciante Ativo</span>
                            <button onClick={() => navigate("/dashboard-locador")} className="btn btn-destaque">
                                Acessar Painel do Locador
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setModalAberto('locador')} className="btn btn-destaque">
                            Quero Anunciar Meu Espaço
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}