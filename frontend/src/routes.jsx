import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// IMPORTS DAS PÁGINAS
import Auth from "./pages/login/Auth";
import CadastroLocador from "./pages/login/CadastroLocador";
import DashboardLocador from "./pages/locador/DashboardLocador";
import CaracteristicasPage from "./pages/locador/CaracteristicasPage";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Dashboard from "./pages/dashboard/Dashboard";
import MinhasReservas from "./pages/dashboard/components/MinhasReservas";
import Home from "./pages/home/Home";
import DetalhesEspaco from "./pages/detalhes espaco/DetalhesEspaco";
import { PagamentoPage } from "./pages/pagamento/PagamentoPage";

// DOCUMENTOS
import DocumentosUsuario from "./pages/documentos/DocumentosUsuario";
import DocumentosEspaco from "./pages/documentos/DocumentosEspaco";
import DocumentosAdmin from "./pages/documentos/DocumentosAdmin";
import GestaoReservas from "./components/locador/GestaoReservas";

// IMPORT DO NOVO LAYOUT DA SIDEBAR
import SidebarLayout from "./components/sidebar/SidebarLayout";
import NovoEspaco from "./pages/novo espaco/NovoEspaco";


// =====================================================
// COMPONENTE PARA PROTEGER ROTAS
// =====================================================
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

function getRotaPorRole(usuario) {
    if (!usuario) return "/login";
    if (usuario.admin) return "/dashboard-admin";
    if (usuario.locador) return "/perfil_locador";
    return "/home";
}

export default function AppRoutes() {
    const { usuarioLogado } = useAuth();
    const rotaInicial = getRotaPorRole(usuarioLogado);

    return (
        <BrowserRouter>
            <Routes>
                {/* Rota inicial / padrão */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Rotas Públicas (acessíveis com ou sem login) */}
                <Route path="/home" element={<Home />} />
                <Route path="/espaco/:id" element={<DetalhesEspaco />} />

                {/* Tela de Login (Redireciona para o painel se já estiver logado) */}
                <Route
                    path="/login"
                    element={usuarioLogado ? <Navigate to={rotaInicial} replace /> : <Auth />}
                />

                {/* Dashboard do Admin (Protegida) */}
                <Route
                    path="/dashboard-admin"
                    element={
                        <RouteProtegida>
                            <DashboardAdmin />
                        </RouteProtegida>
                    }
                />
                <Route
                    path="/documentos-admin"
                    element={
                        <RouteProtegida>
                            <DocumentosAdmin />
                        </RouteProtegida>
                    }
                />

                {/* ROTAS PROTEGIDAS COM SIDEBAR (REQUEREM LOGIN) */}
                <Route
                    element={
                        <RouteProtegida>
                            <SidebarLayout />
                        </RouteProtegida>
                    }
                >
                    <Route path="/locador/espacos/novo" element={<NovoEspaco />} />
                    <Route path="/perfil" element={<Dashboard />} />
                    <Route path="/minhas-reservas" element={<MinhasReservas />} />
                    <Route path="/pagamento" element={<PagamentoPage />} />
                    <Route path="/cadastro-locador" element={<CadastroLocador />} />
                    <Route path="/perfil_locador" element={<DashboardLocador />} />
                    <Route path="/admin-caracteristicas" element={<CaracteristicasPage />} />
                    <Route path="/documentos/usuario" element={<DocumentosUsuario />} />
                    <Route path="/documentos/espaco/:id" element={<DocumentosEspaco />} />
                    <Route path="/locador/reservas" element={<GestaoReservas />} />
                </Route>

                {/* Rota genérica para caminhos não encontrados */}
                <Route
                    path="*"
                    element={<Navigate to="/home" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}