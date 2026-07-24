import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./login/auth";
import Dashboard from "./Dashboard/Dashboard";
import CadastroLocador from "./Login/CadastroLocador"; // Ajuste o caminho se necessário
import DashboardLocador from "./DashboardLocador"; // <-- 1. IMPORTAÇÃO DO NOVO PAINEL
import CaracteristicasPage from "./CaracteristicasPage"; // <-- 3. IMPORTAÇÃO DA PÁGINA DE CARACTERÍSTICAS

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

export default function AppRoutes() {
    const { usuarioLogado } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                {/* Rota de Login */}
                <Route 
                    path="/login" 
                    element={usuarioLogado ? <Navigate to="/dashboard" replace /> : <Auth />} 
                />

                {/* Rota Privada do Painel Principal (Cliente) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <RouteProtegida>
                            <Dashboard />
                        </RouteProtegida>
                    } 
                />

                {/* Rota Privada para Cadastro de Locador */}
                <Route 
                    path="/cadastro-locador" 
                    element={
                        <RouteProtegida>
                            <CadastroLocador />
                        </RouteProtegida>
                    } 
                />

                {/* --- 2. NOVA ROTA PROTEGIDA: PAINEL DO LOCADOR --- */}
                <Route 
                    path="/dashboard-locador" 
                    element={
                        <RouteProtegida>
                            <DashboardLocador />
                        </RouteProtegida>
                    } 
                />
                {/* ------------------------------------------------- */}

                {/* --- 3. NOVA ROTA PROTEGIDA: Adicionar caracteristica (provisorio) --- */}
                <Route 
                    path="/admin-caracteristicas" 
                    element={
                        <RouteProtegida>
                            <CaracteristicasPage/>
                        </RouteProtegida>
                    } 
                />
                {/* ------------------------------------------------- */}

                {/* Qualquer rota inválida redireciona para o lugar correto baseado no login */}
                <Route 
                    path="*" 
                    element={<Navigate to={usuarioLogado ? "/dashboard" : "/login"} replace />} 
                />
            </Routes>
        </BrowserRouter>
    );
}