import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./login/auth";
import Dashboard from "./Dashboard/Dashboard";

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

                {/* Rota Privada do Painel */}
                <Route 
                    path="/dashboard" 
                    element={
                        <RouteProtegida>
                            <Dashboard />
                        </RouteProtegida>
                    } 
                />

                {/* --- AQUI ENTRA A NOVA ROTA PROTEGIDA --- */}
                <Route 
                    path="/cadastro-locador" 
                    element={
                        <RouteProtegida>
                            <CadastroLocador />
                        </RouteProtegida>
                    } 
                />
                {/* --------------------------------------- */}

                {/* Qualquer rota inválida redireciona para o lugar correto baseado no login */}
                <Route 
                    path="*" 
                    element={<Navigate to={usuarioLogado ? "/dashboard" : "/login"} replace />} 
                />
            </Routes>
        </BrowserRouter>
    );
}