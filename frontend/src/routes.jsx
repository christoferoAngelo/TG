import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import Auth from "./pages/login/Auth";
import RedefinirSenha from "./pages/login/RedefinirSenha";
import CadastroLocador from "./pages/login/CadastroLocador";
import LocadorLayout from "./pages/locador/LocadorLayout";
import LocadorPainel from "./pages/locador/LocadorPainel";
import LocadorReservas from "./pages/locador/LocadorReservas";
import LocadorEspacos from "./pages/locador/LocadorEspacos";
import LocadorFinanceiro from "./pages/locador/LocadorFinanceiro";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Dashboard from "./pages/dashboard/Dashboard";
import MinhasReservas from "./pages/dashboard/components/MinhasReservas";
import Home from "./pages/home/Home";
import Sobre from "./pages/sobre/Sobre";
import Jornada from "./pages/jornada/Jornada";
import DetalhesEspaco from "./pages/detalhes espaco/DetalhesEspaco";
import { PagamentoPage } from "./pages/pagamento/PagamentoPage";
import PagamentoResultado from "./pages/pagamento/PagamentoResultado";
import DocumentosEspaco from "./pages/documentos/DocumentosEspaco";
import DocumentosAdmin from "./pages/documentos/DocumentosAdmin";
import AppShell from "./components/layout/AppShell";
import NovoEspaco from "./pages/novo espaco/NovoEspaco";
import Favoritos from "./pages/favoritos/Favoritos";
import DevPainelPreview from "./pages/locador/DevPainelPreview";
import DevTermosPreview from "./pages/admin/DevTermosPreview";
import AceitarTermos from "./pages/termos/AceitarTermos";

function RouteProtegida() {
    const { usuarioLogado, carregando, precisaAceitarTermos } = useAuth();
    const location = useLocation();

    if (carregando) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
                <p>Verificando credenciais...</p>
            </div>
        );
    }

    if (!usuarioLogado) {
        return <Navigate to="/login" replace />;
    }

    const admin = usuarioLogado.admin || usuarioLogado.isAdmin;
    if (precisaAceitarTermos && !admin) {
        const voltar = encodeURIComponent(`${location.pathname}${location.search}`);
        return <Navigate to={`/aceitar-termos?voltar=${voltar}`} replace />;
    }

    return <Outlet />;
}

function RouteAdmin({ children }) {
    const { usuarioLogado } = useAuth();

    if (!usuarioLogado || !(usuarioLogado.admin || usuarioLogado.isAdmin)) {
        return <Navigate to="/home" replace />;
    }

    return children;
}

function getRotaPorRole(usuario) {
    if (!usuario) return "/login";
    if (usuario.admin || usuario.isAdmin) return "/dashboard-admin";
    if (usuario.locador || usuario.isLocador) return "/locador";
    return "/home";
}

function fundoDoLogin(location) {
    const fundo = location.state?.fundo;
    const caminho = fundo?.pathname || "";
    if (caminho === "/home" || caminho.startsWith("/espaco/")) return fundo;
    return { pathname: "/home", search: "", hash: "" };
}

function RotasAplicacao() {
    const location = useLocation();
    const { usuarioLogado } = useAuth();
    const rotaInicial = getRotaPorRole(usuarioLogado);
    const loginAberto = location.pathname === "/login" && !usuarioLogado;
    const localRotas = location.pathname === "/login" ? fundoDoLogin(location) : location;

    return (
        <>
            <div inert={loginAberto ? true : undefined}>
                <Routes location={localRotas}>
                    <Route path="/" element={<Navigate to="/home" replace />} />

                    <Route element={<AppShell />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/sobre" element={<Sobre />} />
                        <Route path="/espaco/:id" element={<DetalhesEspaco />} />
                    </Route>

                    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="/jornada" element={<Jornada />} />
                    <Route path="/aceitar-termos" element={<AceitarTermos />} />
                    {import.meta.env.DEV && (
                        <>
                            <Route path="/dev/painel-locador" element={<DevPainelPreview />} />
                            <Route path="/dev/termos" element={<DevTermosPreview />} />
                        </>
                    )}

                    <Route
                        path="/dashboard-admin"
                        element={
                            <RouteAdmin>
                                <DashboardAdmin />
                            </RouteAdmin>
                        }
                    />
                    <Route
                        path="/documentos-admin"
                        element={
                            <RouteAdmin>
                                <DocumentosAdmin />
                            </RouteAdmin>
                        }
                    />

                    <Route element={<RouteProtegida />}>
                        <Route element={<AppShell />}>
                            <Route path="/locador/espacos/novo" element={<NovoEspaco />} />
                            <Route path="/locador/espacos/:id/editar" element={<NovoEspaco />} />
                            <Route path="/locador" element={<LocadorLayout />}>
                                <Route index element={<LocadorPainel />} />
                                <Route path="reservas" element={<LocadorReservas />} />
                                <Route path="espacos" element={<LocadorEspacos />} />
                                <Route path="financeiro" element={<LocadorFinanceiro />} />
                            </Route>
                            <Route path="/perfil" element={<Dashboard />} />
                            <Route path="/minhas-reservas" element={<MinhasReservas />} />
                            <Route path="/favoritos" element={<Favoritos />} />
                            <Route path="/pagamento" element={<PagamentoPage />} />
                            <Route path="/pagamento/sucesso" element={<PagamentoResultado tipo="sucesso" />} />
                            <Route path="/pagamento/falha" element={<PagamentoResultado tipo="falha" />} />
                            <Route path="/pagamento/pendente" element={<PagamentoResultado tipo="pendente" />} />
                            <Route path="/reserva/sucesso" element={<Navigate to="/pagamento/sucesso" replace />} />
                            <Route path="/reserva/falha" element={<Navigate to="/pagamento/falha" replace />} />
                            <Route path="/reserva/pendente" element={<Navigate to="/pagamento/pendente" replace />} />
                            <Route path="/cadastro-locador" element={<CadastroLocador />} />
                            <Route path="/perfil_locador" element={<Navigate to="/locador" replace />} />
                            <Route path="/documentos/usuario" element={<Navigate to="/perfil" replace />} />
                            <Route path="/documentos/espaco/:id" element={<DocumentosEspaco />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </div>
            {loginAberto && <Auth />}
            {location.pathname === "/login" && usuarioLogado && (
                <Navigate to={rotaInicial} replace />
            )}
        </>
    );
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <RotasAplicacao />
        </BrowserRouter>
    );
}
