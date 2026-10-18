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
import { PagamentoPage } from "./pages/pagamento/PagamentoPage"; // <--- NOVO IMPORT

// DOCUMENTOS
import DocumentosUsuario from "./pages/documentos/DocumentosUsuario";
import DocumentosEspaco from "./pages/documentos/DocumentosEspaco";
import DocumentosAdmin from "./pages/documentos/DocumentosAdmin";
import GestaoReservas from "./components/locador/GestaoReservas";

// IMPORT DO NOVO LAYOUT DA SIDEBAR
import SidebarLayout from "./components/sidebar/SidebarLayout";

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
        return <Navigate to="/home" replace />;
    }

    return children;
}

function getRotaPorRole(usuario) {
    if (!usuario) return "/login";
    if (usuario.admin) return "/dashboard-admin";
    if (usuario.locador) return "/dashboard-locador";
    return "/home";
}

export default function AppRoutes() {
    const { usuarioLogado } = useAuth();
    const rotaInicial = getRotaPorRole(usuarioLogado);

    return (
        <BrowserRouter>
            <Routes>
                {/* Rotas Públicas / Sem Sidebar */}
                <Route
                    path="/login"
                    element={usuarioLogado ? <Navigate to={rotaInicial} replace /> : <Auth />}
                />
                
                <Route path="/espaco/:id" element={<DetalhesEspaco />} />

                {/* Dashboard do Admin */}
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

                {/* ROTAS COM A SIDEBAR (CLIENTE E LOCADOR) */}
                <Route
                    element={
                        <RouteProtegida>
                            <SidebarLayout />
                        </RouteProtegida>
                    }
                >
                    <Route path="/home" element={<Home />} />
                    <Route path="/perfil" element={<Dashboard />} />
                    <Route path="/minhas-reservas" element={<MinhasReservas />} />
                    <Route path="/pagamento" element={<PagamentoPage />} /> {/* <--- NOVA ROTA DE PAGAMENTO */}
                    <Route path="/cadastro-locador" element={<CadastroLocador />} />
                    <Route path="/perfil_locador" element={<DashboardLocador />} />
                    <Route path="/admin-caracteristicas" element={<CaracteristicasPage />} />
                    <Route path="/documentos/usuario" element={<DocumentosUsuario />} />
                    <Route path="/documentos/espaco/:id" element={<DocumentosEspaco />} />
                    <Route path="/locador/reservas" element={<GestaoReservas />} />
                </Route>

                {/* Rota não encontrada */}
                <Route
                    path="*"
                    element={<Navigate to={usuarioLogado ? rotaInicial : "/home"} replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}