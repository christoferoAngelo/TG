import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import OverviewTab from '../../components/admin/OverviewTab'; // <--- Import do novo componente
import NovoAdminTab from '../../components/admin/NovoAdminTab';
import EspacosTab from '../../components/admin/EspacosTab';
import HistoricoAuditoria from '../../components/admin/HistoricoAuditoria';
import './DashboardAdmin.css';

export default function DashboardAdmin() {
  const { logout } = useAuth();
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState('overview');

  const handleLogout = async () => {
    try {
      await logout(); 
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const renderConteudoAtivo = () => {
    switch (menuAtivo) {
      case 'overview':
        return <OverviewTab />; // <--- Renderiza a Visão Geral isolada

      case 'espacos':
      case 'moderacao_espacos':
        return <EspacosTab />;

      case 'auditoria':
        return <HistoricoAuditoria />;

      case 'novo_admin':
        return <NovoAdminTab />;

      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar 
        sidebarExpandida={sidebarExpandida}
        setSidebarExpandida={setSidebarExpandida}
        menuAtivo={menuAtivo}
        setMenuAtivo={setMenuAtivo}
        handleLogout={handleLogout}
      />

      <main className="main-content">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Painel Administrativo</h1>
            <p className="admin-subtitle">Gestão do ecossistema LocaFesta</p>
          </div>
        </header>

        {renderConteudoAtivo()}
      </main>
    </div>
  );
}