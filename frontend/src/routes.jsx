import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// --- IMPORTS DAS PÁGINAS ---
import Auth from "./pages/login/Auth";
import CadastroLocador from "./pages/login/CadastroLocador";
import DashboardLocador from "./pages/locador/DashboardLocador";
import CaracteristicasPage from "./pages/locador/CaracteristicasPage";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Dashboard from "./pages/cliente/Dashboard";
import Home from "./pages/home/Home";

/**
 * Componente Wrapper para proteger rotas privadas.
 * Se o usuário não estiver logado, manda ele de volta para a tela de login.
 */
function RouteProtegida({ children }) {
    const { usuarioLogado, carregando } = useAuth();

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

    return children;
}

// Função para saber a rota padrão do usuário baseado na Role
function getRotaPorRole(usuario) {
    if (!usuario) return "/login";
    
    // 1. Se o seu backend tiver o campo 'admin' (boolean)
    if (usuario.admin) {
        return "/dashboard-admin";
    }

    // 2. Se for Locador
    if (usuario.locador) {
        return "/dashboard-locador";
    }

    // 3. Padrão: Cliente / Locatário
    return "/dashboard";
}

export default function AppRoutes() {
    const { usuarioLogado } = useAuth();
    console.log("=== USUÁRIO LOGADO ===", usuarioLogado);
    // 1. Pega a rota correta baseada no perfil do usuário logado
    const rotaInicial = getRotaPorRole(usuarioLogado);

    return (
        <BrowserRouter>
            <Routes>
                {/* Rota Pública de Login: Se já estiver logado, manda para a rota do perfil dele */}
                <Route 
                    path="/login" 
                    element={usuarioLogado ? <Navigate to={rotaInicial} replace /> : <Auth />} 
                />

                {/* Rota Privada: Painel Principal (Cliente/Locatário) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <RouteProtegida>
                            <Dashboard />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada: Adicionar Características */}
                <Route 
                    path="/home" 
                    element={
                        <RouteProtegida>
                            <Home />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada: Cadastro de Locador */}
                <Route 
                    path="/cadastro-locador" 
                    element={
                        <RouteProtegida>
                            <CadastroLocador />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada: Painel do Locador */}
                <Route 
                    path="/dashboard-locador" 
                    element={
                        <RouteProtegida>
                            <DashboardLocador />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada: Adicionar Características */}
                <Route 
                    path="/admin-caracteristicas" 
                    element={
                        <RouteProtegida>
                            <CaracteristicasPage />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada: Painel do Administrador */}
                <Route 
                    path="/dashboard-admin" 
                    element={
                        <RouteProtegida>
                            <DashboardAdmin />
                        </RouteProtegida>
                    } 
                />

                {/* Qualquer rota inválida redireciona baseado na role do usuário */}
                <Route 
                    path="*" 
                    element={<Navigate to={usuarioLogado ? rotaInicial : "/login"} replace />} 
                />
            </Routes>
        </BrowserRouter>
    );
}