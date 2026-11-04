import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ModalCriarLocador from "../../components/locador/ModalCriarLocador";
import { useEffect, useState } from "react";
import "../dashboard/Dashboard.css";
import "./DashboardLocador.css";
import "./LocadorLayout.css";

const API = "http://localhost:8080/api";

const ABAS = [
    { to: "/locador", fim: true, rotulo: "Painel" },
    { to: "/locador/reservas", rotulo: "Reservas", badgePendentes: true },
    { to: "/locador/espacos", rotulo: "Meus espaços" },
    { to: "/locador/financeiro", rotulo: "Financeiro" },
];

export default function LocadorLayout() {
    const { usuarioLogado, carregando, atualizarUsuario } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [modalLocadorAberto, setModalLocadorAberto] = useState(false);
    const [pendentes, setPendentes] = useState(0);

    const ehLocador = Boolean(usuarioLogado?.isLocador || usuarioLogado?.locador);
    const ehLocatario = Boolean(usuarioLogado?.isLocatario || usuarioLogado?.locatario);
    const naAbaReservas = location.pathname.startsWith("/locador/reservas");

    useEffect(() => {
        if (!usuarioLogado?.id || !ehLocador) return undefined;
        // Na aba Reservas a lista é a fonte do selo (evita corrida com o painel).
        if (naAbaReservas) return undefined;
        let ativo = true;
        fetch(`${API}/locador/painel/resumo`, {
            headers: { "Usuario-Id": usuarioLogado.id },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((dados) => {
                if (!ativo || !dados) return;
                setPendentes(Number(dados?.kpis?.pedidosAguardando) || 0);
            })
            .catch(() => {
                if (ativo) setPendentes(0);
            });
        return () => {
            ativo = false;
        };
    }, [usuarioLogado?.id, ehLocador, naAbaReservas]);

    if (carregando) {
        return (
            <div className="dashboard lc-page">
                <main className="lc-container">
                    <p className="lc-vazio">Verificando sua conta…</p>
                </main>
            </div>
        );
    }

    if (!usuarioLogado) {
        return <Navigate to="/login" replace />;
    }

    if (!ehLocador) {
        return (
            <div className="dashboard lc-page">
                <main className="lc-container">
                    <section className="lc-aviso" role="status">
                        {ehLocatario ? (
                            <>
                                <h1 className="lc-aviso-titulo">Crie sua conta de locador</h1>
                                <p className="lc-aviso-texto">
                                    Para anunciar espaços e receber pedidos, você precisa de uma conta de locador.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="lc-aviso-titulo">Complete seu cadastro primeiro</h1>
                                <p className="lc-aviso-texto">
                                    Para virar locador, complete antes o cadastro de locatário no perfil.
                                </p>
                            </>
                        )}
                        <div className="lc-aviso-acoes">
                            {ehLocatario ? (
                                <button
                                    type="button"
                                    className="lc-btn lc-btn--primary lc-btn--lg"
                                    onClick={() => setModalLocadorAberto(true)}
                                >
                                    Criar conta de locador
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="lc-btn lc-btn--primary lc-btn--lg"
                                    onClick={() => navigate("/perfil")}
                                >
                                    Completar cadastro
                                </button>
                            )}
                            <button
                                type="button"
                                className="lc-btn lc-btn--ghost lc-btn--lg"
                                onClick={() => navigate("/home")}
                            >
                                Voltar para a Home
                            </button>
                        </div>
                    </section>
                </main>
                {modalLocadorAberto && ehLocatario && (
                    <ModalCriarLocador
                        usuarioLogado={usuarioLogado}
                        onCriado={async () => {
                            if (atualizarUsuario) await atualizarUsuario();
                        }}
                        onClose={() => setModalLocadorAberto(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="dashboard lc-page">
            <main className="lc-container">
                <div className="lc-nav-barra">
                    <nav className="lc-nav" aria-label="Área do locador">
                        {ABAS.map((aba) => (
                            <NavLink
                                key={aba.to}
                                to={aba.to}
                                end={Boolean(aba.fim)}
                                className={({ isActive }) => `lc-nav-item${isActive ? " is-ativo" : ""}`}
                            >
                                <span>{aba.rotulo}</span>
                                {aba.badgePendentes && pendentes > 0 && (
                                    <span className="lc-nav-badge" aria-label={`${pendentes} pedidos pendentes`}>
                                        {pendentes > 99 ? "99+" : pendentes}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <Outlet context={{ pendentes, setPendentes }} />
            </main>
        </div>
    );
}
