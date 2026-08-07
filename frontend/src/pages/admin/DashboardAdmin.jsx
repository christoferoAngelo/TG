import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import NovoAdminTab from '../../components/admin/NovoAdminTab';
import EspacosTab from '../../components/admin/EspacosTab';
import HistoricoAuditoria from '../../components/admin/HistoricoAuditoria';
// Se tiver uma aba/componente separado para Usuários, importe-o aqui.
import './DashboardAdmin.css';

export default function DashboardAdmin() {
  const { logout } = useAuth();
  
  // Estados de UI (Apenas controle do layout)
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState('overview');

  const handleLogout = async () => {
    try {
      await logout(); 
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Erro ao sair do sistema:", error);
    }
  };

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO DA ABA ATIVA
  // --------------------------------------------------------------------------
  const renderConteudoAtivo = () => {
    switch (menuAtivo) {
      case 'overview':
        return <OverviewPlaceholder />; // Ou seu <OverviewTab /> se isolado em um arquivo
      
      case 'usuarios':
        return <UsuariosPlaceholder />; // Idealmente mover a tabela de usuários para <UsuariosTab />

      case 'espacos':
      case 'moderacao_espacos':
        // A própria EspacosTab busca os espaços via API ao ser montada
        return <EspacosTab />;

      case 'auditoria':
        // A própria HistoricoAuditoria faz o GET /api/logs-auditoria ao ser montada
        return <HistoricoAuditoria />;

      case 'novo_admin':
        return <NovoAdminTab />;

      case 'documentos':
        return (
          <div className="content-box">
            <h3>🛡️ Validação de Documentos e Alvarás</h3>
            <p className="section-description">Análise de RG/CNH e comprovação de propriedade/alvará de espaços.</p>
            <div className="placeholder-box">
              <p>📄 Documentos pendentes de verificação aparecerão aqui.</p>
            </div>
          </div>
        );

      case 'financeiro':
        return (
          <div className="content-box">
            <h3>💳 Gestão de Reservas e Repasses</h3>
            <p className="section-description">Acompanhamento de transações e taxas da plataforma.</p>
          </div>
        );

      case 'denuncias':
        return (
          <div className="content-box">
            <h3>🚩 Central de Suporte & Moderação</h3>
            <p className="section-description">Histórico de chamados e denúncias.</p>
          </div>
        );

      default:
        return <OverviewPlaceholder />;
    }
  };

  return (
    <div className="admin-layout">
      {/* MENU LATERAL */}
      <Sidebar 
        sidebarExpandida={sidebarExpandida}
        setSidebarExpandida={setSidebarExpandida}
        menuAtivo={menuAtivo}
        setMenuAtivo={setMenuAtivo}
        handleLogout={handleLogout}
      />

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="main-content">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Painel Administrativo</h1>
            <p className="admin-subtitle">Gestão do ecossistema LocaFesta</p>
          </div>
        </header>

        {/* Renderiza dinamicamente o componente da aba selecionada */}
        {renderConteudoAtivo()}
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------
// PLACEHOLDERS / COMPONENTES AUXILIARES
// --------------------------------------------------------------------------
function OverviewPlaceholder() {
  return (
    <div className="content-box">
      <h3>Visão Geral do Sistema</h3>
      <p>Métricas consolidadas e relatórios estatísticos.</p>
    </div>
  );
}

function UsuariosPlaceholder() {
  return (
    <div className="content-box">
      <h3>Lista Geral de Usuários</h3>
      <p>Gerenciamento e controle de perfis de usuário.</p>
    </div>
  );
}