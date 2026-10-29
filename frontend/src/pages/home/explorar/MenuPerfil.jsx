import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export default function MenuPerfil() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuarioLogado, logout } = useAuth();
    const [aberto, setAberto] = useState(false);
    const caixaRef = useRef(null);

    const nome = usuarioLogado?.nome || usuarioLogado?.email || "Conta";
    const inicial = nome.trim().charAt(0).toUpperCase() || "L";
    const locador = Boolean(usuarioLogado?.locador || usuarioLogado?.isLocador);

    useEffect(() => {
        if (!aberto) return undefined;
        const fechar = (evento) => {
            if (!caixaRef.current?.contains(evento.target)) setAberto(false);
        };
        const tecla = (evento) => {
            if (evento.key === "Escape") setAberto(false);
        };
        document.addEventListener("mousedown", fechar);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", fechar);
            document.removeEventListener("keydown", tecla);
        };
    }, [aberto]);

    const ir = (rota) => {
        setAberto(false);
        if (rota === "/login") {
            navigate(rota, {
                state: { fundo: { pathname: location.pathname, search: location.search, hash: location.hash } }
            });
            return;
        }
        navigate(rota);
    };

    const sair = async () => {
        setAberto(false);
        try {
            await logout();
        } catch (erro) {
            console.error(erro);
        }
        navigate("/home");
    };

    if (!usuarioLogado) {
        return (
            <div className="hm-perfil" ref={caixaRef}>
                <button type="button" className="hm-entrar" onClick={() => ir("/login")}>
                    Entrar
                </button>
            </div>
        );
    }

    return (
        <div className="hm-perfil" ref={caixaRef}>
            <button
                type="button"
                className="hm-perfil-botao"
                aria-expanded={aberto}
                aria-haspopup="menu"
                aria-label={`Menu de ${nome}`}
                onClick={() => setAberto((atual) => !atual)}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7.5h14M5 12h14M5 16.5h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="hm-avatar" aria-hidden="true">
                    {usuarioLogado.fotoUrl ? <img src={usuarioLogado.fotoUrl} alt="" /> : inicial}
                </span>
            </button>

            {aberto && (
                <div className="hm-perfil-menu" role="menu">
                    <div className="hm-perfil-grupo">
                        <button type="button" role="menuitem" onClick={() => ir("/favoritos")}>Favoritos</button>
                        <button type="button" role="menuitem" onClick={() => ir("/perfil")}>Meu perfil</button>
                        <button type="button" role="menuitem" onClick={() => ir("/minhas-reservas")}>Minhas reservas</button>
                    </div>
                    <div className="hm-perfil-grupo">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => ir(locador ? "/perfil_locador" : "/cadastro-locador")}
                        >
                            {locador ? "Meu negócio" : "Vou anunciar"}
                        </button>
                    </div>
                    <div className="hm-perfil-grupo">
                        <button type="button" role="menuitem" onClick={sair}>Sair</button>
                    </div>
                </div>
            )}
        </div>
    );
}
