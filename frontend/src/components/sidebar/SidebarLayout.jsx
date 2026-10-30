import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import WarmTooltip, { WarmTooltipGroup } from "../bits/WarmTooltip";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmacaoSair from "../ConfirmacaoSair";
import "./SidebarLayout.css";
import HeaderHome from "../../pages/home/components/HeaderHome";

import iconCalendario from "../../assets/calendario_icon.png";
import iconChave from "../../assets/chave_icon.png";
import iconDocumentos from "../../assets/documentos_icons.png";
import iconSair from "../../assets/sair_icon.png";
import iconMenu from "../../assets/tres_barras_icon.png";

function IconeInicio() {
    return (
        <svg
            className="sidebar-icon-svg"
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
    );
}

function IconeFavoritos() {
    return (
        <svg className="sidebar-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconeMenu({ src, alt = "" }) {
    return <img src={src} alt={alt} className="sidebar-icon-img" />;
}

export default function SidebarLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, usuarioLogado } = useAuth();

    const [fixada, setFixada] = useState(false);
    const [confirmarSair, setConfirmarSair] = useState(false);
    const [saindo, setSaindo] = useState(false);
    const retraida = !fixada;
    const reduzirMovimento = useReducedMotion();
    const naHome = location.pathname === "/home";
    const mola = reduzirMovimento
        ? { duration: 0 }
        : { type: "spring", stiffness: 160, damping: 28, mass: 1 };
    const varianteItem = {
        oculto: { opacity: reduzirMovimento ? 1 : 0, x: reduzirMovimento ? 0 : -12 },
        visivel: {
            opacity: 1,
            x: 0,
            transition: mola
        }
    };

    const menuItems = [
        { label: "Início", path: "/home", icon: "inicio" },
        { label: "Favoritos", path: "/favoritos", icon: "favoritos" },
        { label: "Minhas Reservas", path: "/minhas-reservas", iconSrc: iconCalendario },
        { label: "Painel do Locador", path: "/perfil_locador", iconSrc: iconChave },
        { label: "Documentos", path: "/documentos/usuario", iconSrc: iconDocumentos },
    ];

    const handleLogout = async () => {
        setSaindo(true);
        try {
            await logout();
            setConfirmarSair(false);
            navigate("/home");
        } catch (error) {
            console.error("Erro ao sair:", error);
        } finally {
            setSaindo(false);
        }
    };

    const renderIcone = (item) => {
        if (item.icon === "inicio") {
            return <IconeInicio />;
        }
        if (item.icon === "favoritos") {
            return <IconeFavoritos />;
        }
        return <IconeMenu src={item.iconSrc} />;
    };

    return (
        <div className={`app-layout ${retraida ? "sidebar-collapsed" : ""}${naHome ? " app-layout--home" : ""}`}>
            {!naHome && (
            <motion.aside
                className={`sidebar ${retraida ? "collapsed" : ""}`}
                initial={false}
                animate={{
                    width: retraida ? 76 : 252,
                    paddingLeft: retraida ? 10 : 14,
                    paddingRight: retraida ? 10 : 14
                }}
                transition={mola}
            >
                <div className="sidebar-header">
                    <AnimatePresence initial={false}>
                        {!retraida && (
                            <motion.button
                                key="marca"
                                type="button"
                                className="sidebar-marca"
                                onClick={() => navigate("/home")}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={reduzirMovimento ? { duration: 0 } : { duration: 0.18 }}
                            >
                                LocaFesta
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <button
                        type="button"
                        className="toggle-btn"
                        onClick={() => setFixada((aberta) => !aberta)}
                        title={fixada ? "Recolher menu" : "Expandir menu"}
                        aria-expanded={fixada}
                        aria-label={fixada ? "Recolher menu" : "Expandir menu"}
                    >
                        <motion.span
                            className="sidebar-toggle-icone"
                            animate={{ rotate: retraida ? 90 : 0 }}
                            transition={mola}
                        >
                            <IconeMenu src={iconMenu} alt="" />
                        </motion.span>
                    </button>
                </div>

                <WarmTooltipGroup delay={280}>
                <motion.nav
                    className="sidebar-nav"
                    aria-label="Menu principal"
                    initial="oculto"
                    animate="visivel"
                    variants={{
                        oculto: {},
                        visivel: {
                            transition: {
                                staggerChildren: reduzirMovimento ? 0 : 0.045,
                                delayChildren: reduzirMovimento ? 0 : 0.04
                            }
                        }
                    }}
                >
                    {menuItems.map((item) => {
                        const ativo = location.pathname === item.path;
                        return (
                            <motion.div key={item.path} variants={varianteItem} style={{ width: "100%" }}>
                            <WarmTooltip
                                content={item.label}
                                side="right"
                                disabled={!retraida}
                                surfaceColor="#130501"
                                inkColor="#FEFBE6"
                            >
                            <motion.button
                                type="button"
                                className={`sidebar-item ${ativo ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                                title={retraida ? item.label : undefined}
                            >
                                {ativo && (
                                    <motion.span
                                        layoutId="sidebar-indicador"
                                        className="sidebar-indicador"
                                        transition={mola}
                                    />
                                )}
                                <motion.span
                                    className="sidebar-icon"
                                    whileHover={reduzirMovimento ? undefined : { scale: 1.08 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                >
                                    {renderIcone(item)}
                                </motion.span>
                                <AnimatePresence initial={false}>
                                    {!retraida && (
                                        <motion.span
                                            key="rotulo"
                                            className="sidebar-label"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={reduzirMovimento ? { duration: 0 } : { duration: 0.16 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            </WarmTooltip>
                            </motion.div>
                        );
                    })}
                </motion.nav>
                </WarmTooltipGroup>

                {usuarioLogado && (
                    <div className="sidebar-footer">
                        <motion.button
                            type="button"
                            onClick={() => setConfirmarSair(true)}
                            className="sidebar-item logout"
                            title={retraida ? "Sair" : undefined}
                            initial={{ opacity: reduzirMovimento ? 1 : 0, y: reduzirMovimento ? 0 : 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                                reduzirMovimento
                                    ? { duration: 0 }
                                    : { ...mola, delay: 0.2 }
                            }
                        >
                            <span className="sidebar-icon">
                                <IconeMenu src={iconSair} />
                            </span>
                            <AnimatePresence initial={false}>
                                {!retraida && (
                                    <motion.span
                                        key="rotulo-sair"
                                        className="sidebar-label"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={reduzirMovimento ? { duration: 0 } : { duration: 0.16 }}
                                    >
                                        Sair
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                )}
            </motion.aside>
            )}

            <main className="sidebar-content">
                {!naHome && <HeaderHome />}
                <Outlet />
            </main>

            <ConfirmacaoSair
                aberto={confirmarSair}
                saindo={saindo}
                onCancelar={() => !saindo && setConfirmarSair(false)}
                onConfirmar={handleLogout}
            />
        </div>
    );
}
