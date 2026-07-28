import React from 'react';
import './Sidebar.css';

export default function Sidebar({ 
  sidebarExpandida, 
  setSidebarExpandida, 
  menuAtivo, 
  setMenuAtivo, 
  usuariosCount, 
  espacosCount, 
  handleLogout 
}) {
  return (
    <aside className={`sidebar ${sidebarExpandida ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button 
          className="btn-toggle-sidebar"
          onClick={() => setSidebarExpandida(!sidebarExpandida)}
          title={sidebarExpandida ? "Recolher menu" : "Expandir menu"}
        >
          ☰
        </button>
        {sidebarExpandida && <span className="sidebar-logo">LocaFesta Admin</span>}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          {sidebarExpandida && <span className="group-title">Métricas & Dados</span>}
          <button 
            className={`nav-item ${menuAtivo === 'overview' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('overview')} 
            title="Visão Geral"
          >
            <span className="nav-icon">📊</span>
            {sidebarExpandida && <span className="nav-label">Visão Geral</span>}
          </button>
          
          <button 
            className={`nav-item ${menuAtivo === 'usuarios' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('usuarios')} 
            title="Lista de Usuários"
          >
            <span className="nav-icon">👥</span>
            {sidebarExpandida && <span className="nav-label">Usuários ({usuariosCount})</span>}
          </button>
          
          <button 
            className={`nav-item ${menuAtivo === 'espacos' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('espacos')} 
            title="Lista de Espaços"
          >
            <span className="nav-icon">🏡</span>
            {sidebarExpandida && <span className="nav-label">Espaços ({espacosCount})</span>}
          </button>
        </div>

        <div className="nav-group">
          {sidebarExpandida && <span className="group-title">Validação & Moderação</span>}
          <button 
            className={`nav-item ${menuAtivo === 'documentos' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('documentos')} 
            title="Aprovação de Alvarás e RG/CNH"
          >
            <span className="nav-icon">🛡️</span>
            {sidebarExpandida && <span className="nav-label">Aprovar Documentos</span>}
            <span className="badge-alert">!</span>
          </button>
          
          <button 
            className={`nav-item ${menuAtivo === 'moderacao_espacos' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('moderacao_espacos')} 
            title="Aprovar novos espaços"
          >
            <span className="nav-icon">📋</span>
            {sidebarExpandida && <span className="nav-label">Anúncios Pendentes</span>}
          </button>
        </div>

        <div className="nav-group">
          {sidebarExpandida && <span className="group-title">Gestão Interna</span>}
          <button 
            className={`nav-item ${menuAtivo === 'novo_admin' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('novo_admin')} 
            title="Cadastrar Novo Administrador"
          >
            <span className="nav-icon">➕</span>
            {sidebarExpandida && <span className="nav-label">Novo Administrador</span>}
          </button>
          
          <button 
            className={`nav-item ${menuAtivo === 'financeiro' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('financeiro')} 
            title="Transações e Reservas"
          >
            <span className="nav-icon">💳</span>
            {sidebarExpandida && <span className="nav-label">Reservas & Repasses</span>}
          </button>
          
          <button 
            className={`nav-item ${menuAtivo === 'denuncias' ? 'active' : ''}`} 
            onClick={() => setMenuAtivo('denuncias')} 
            title="Suporte e Denúncias"
          >
            <span className="nav-icon">🚩</span>
            {sidebarExpandida && <span className="nav-label">Suporte & Denúncias</span>}
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" title="Configurações">
          <span className="nav-icon">⚙️</span>
          {sidebarExpandida && <span className="nav-label">Configurações</span>}
        </button>
        <button className="nav-item btn-logout" title="Sair do Sistema" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          {sidebarExpandida && <span className="nav-label">Sair</span>}
        </button>
      </div>
    </aside>
  );
}