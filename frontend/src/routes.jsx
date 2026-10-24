import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// IMPORTS DAS PÁGINAS
import Auth from "./pages/login/Auth";
import RedefinirSenha from "./pages/login/RedefinirSenha";
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

// IMPORT DO NOVO LAYOUT DA SIDEBAR
import SidebarLayout from "./components/sidebar/SidebarLayout";
import NovoEspaco from "./pages/novo espaco/NovoEspaco";
import Favoritos from "./pages/favoritos/Favoritos";


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

                {/* ===================================================== */}
                {/* ROTAS PÚBLICAS COM SIDEBAR (ACESSÍVEIS SEM LOGIN)       */}
                {/* ===================================================== */}
                <Route element={<SidebarLayout />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/espaco/:id" element={<DetalhesEspaco />} />
                </Route>

                {/* Tela de Login (Redireciona para o painel se já estiver logado) */}
                <Route
                    path="/login"
                    element={usuarioLogado ? <Navigate to={rotaInicial} replace /> : <Auth />}
                />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />

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

                {/* ===================================================== */}
                {/* ROTAS PROTEGIDAS COM SIDEBAR (EXIGEM LOGIN)           */}
                {/* ===================================================== */}
                <Route
                    element={
                        <RouteProtegida>
                            <SidebarLayout />
                        </RouteProtegida>
                    }
                >
                    <Route path="/locador/espacos/novo" element={<NovoEspaco />} />
                    <Route path="/locador/espacos/:id/editar" element={<NovoEspaco />} />
                    <Route path="/perfil" element={<Dashboard />} />
                    <Route path="/minhas-reservas" element={<MinhasReservas />} />
                    <Route path="/favoritos" element={<Favoritos />} />
                    <Route path="/pagamento" element={<PagamentoPage />} />
                    <Route path="/cadastro-locador" element={<CadastroLocador />} />
                    <Route path="/perfil_locador" element={<DashboardLocador />} />
                    <Route path="/admin-caracteristicas" element={<CaracteristicasPage />} />
                    <Route path="/documentos/usuario" element={<DocumentosUsuario />} />
                    <Route path="/documentos/espaco/:id" element={<DocumentosEspaco />} />
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