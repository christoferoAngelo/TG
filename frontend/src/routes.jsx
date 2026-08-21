import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// =====================================================
// IMPORTS DAS PÁGINAS
// =====================================================

import Auth from "./pages/login/Auth";
import CadastroLocador from "./pages/login/CadastroLocador";

import DashboardLocador from "./pages/locador/DashboardLocador";
import CaracteristicasPage from "./pages/locador/CaracteristicasPage";

import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Dashboard from "./pages/dashboard/Dashboard";

import Home from "./pages/home/Home";

import DetalhesEspaco from "./pages/detalhes espaco/DetalhesEspaco";

// =====================================================
// DOCUMENTOS
// =====================================================

import DocumentosUsuario from "./pages/documentos/DocumentosUsuario";
import DocumentosEspaco from "./pages/documentos/DocumentosEspaco";
import DocumentosAdmin from "./pages/documentos/DocumentosAdmin";


// =====================================================
// COMPONENTE PARA PROTEGER ROTAS
// =====================================================

function RouteProtegida({ children }) {

    const { usuarioLogado, carregando } = useAuth();

    if (carregando) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontFamily: "sans-serif"
                }}
            >
                <p>Verificando credenciais...</p>
            </div>
        );
    }

    if (!usuarioLogado) {
        return <Navigate to="/home" replace />;
    }

    return children;
}


// =====================================================
// DEFINIR ROTA INICIAL DE ACORDO COM O PERFIL
// =====================================================

function getRotaPorRole(usuario) {

    if (!usuario) {
        return "/login";
    }

    // Administrador
    if (usuario.admin) {
        return "/dashboard-admin";
    }

    // Locador
    if (usuario.locador) {
        return "/dashboard-locador";
    }

    // Cliente / Locatário
    return "/home";
}


// =====================================================
// ROTAS DA APLICAÇÃO
// =====================================================

export default function AppRoutes() {

    const { usuarioLogado } = useAuth();

    console.log("=== USUÁRIO LOGADO ===", usuarioLogado);

    const rotaInicial = getRotaPorRole(usuarioLogado);

    return (
        <BrowserRouter>

            <Routes>

                {/* =====================================================
                    LOGIN
                ===================================================== */}

                <Route
                    path="/login"
                    element={
                        usuarioLogado
                            ? <Navigate to={rotaInicial} replace />
                            : <Auth />
                    }
                />


                {/* =====================================================
                    HOME
                ===================================================== */}

                <Route
                    path="/home"
                    element={<Home />}
                />


                {/* =====================================================
                    DASHBOARD DO CLIENTE / LOCATÁRIO
                ===================================================== */}

                <Route
                    path="/dashboard"
                    element={
                        <RouteProtegida>
                            <Dashboard />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    CADASTRO DE LOCADOR
                ===================================================== */}

                <Route
                    path="/cadastro-locador"
                    element={
                        <RouteProtegida>
                            <CadastroLocador />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    DASHBOARD DO LOCADOR
                ===================================================== */}

                <Route
                    path="/dashboard-locador"
                    element={
                        <RouteProtegida>
                            <DashboardLocador />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    CARACTERÍSTICAS
                ===================================================== */}

                <Route
                    path="/admin-caracteristicas"
                    element={
                        <RouteProtegida>
                            <CaracteristicasPage />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    DASHBOARD DO ADMINISTRADOR
                ===================================================== */}

                <Route
                    path="/dashboard-admin"
                    element={
                        <RouteProtegida>
                            <DashboardAdmin />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    DETALHES DO ESPAÇO
                ===================================================== */}

                <Route
                    path="/espaco/:id"
                    element={<DetalhesEspaco />}
                />


                {/* =====================================================
                    DOCUMENTOS DO USUÁRIO
                ===================================================== */}

                <Route
                    path="/documentos/usuario"
                    element={
                        <RouteProtegida>
                            <DocumentosUsuario />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    DOCUMENTOS DO ESPAÇO
                ===================================================== */}

                <Route
                    path="/documentos/espaco/:id"
                    element={
                        <RouteProtegida>
                            <DocumentosEspaco />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    DOCUMENTOS DO ADMIN
                ===================================================== */}

                <Route
                    path="/documentos-admin"
                    element={
                        <RouteProtegida>
                            <DocumentosAdmin />
                        </RouteProtegida>
                    }
                />


                {/* =====================================================
                    ROTA NÃO ENCONTRADA
                    DEVE FICAR SEMPRE POR ÚLTIMO
                ===================================================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to={usuarioLogado ? rotaInicial : "/home"}
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}