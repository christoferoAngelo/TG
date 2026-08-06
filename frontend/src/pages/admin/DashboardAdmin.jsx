import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import NovoAdminTab from '../../components/admin/NovoAdminTab';
import EspacosTab from '../../components/admin/EspacosTab';
import './DashboardAdmin.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function DashboardAdmin() {
  const { logout } = useAuth();
  
  // Estados de UI
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados de Dados
  const [usuarios, setUsuarios] = useState([]);
  const [espacos, setEspacos] = useState([]);

  // Estados de Filtro
  const [presetPeriodo, setPresetPeriodo] = useState('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // --------------------------------------------------------------------------
  // EFEITOS
  // --------------------------------------------------------------------------
  
  // Atualiza as datas de início e fim com base no preset escolhido
  useEffect(() => {
    if (presetPeriodo === 'all') {
      setDataInicio('');
      setDataFim('');
      return;
    }

    if (presetPeriodo !== 'custom') {
      const hoje = new Date();
      const dias = parseInt(presetPeriodo, 10);
      const inicio = new Date();
      inicio.setDate(hoje.getDate() - dias);

      setDataInicio(inicio.toISOString().split('T')[0]);
      setDataFim(hoje.toISOString().split('T')[0]);
    }
  }, [presetPeriodo]);

  // Carrega os dados iniciais ao montar o componente
  useEffect(() => {
    carregarDados();
  }, []);

  // --------------------------------------------------------------------------
  // FUNÇÕES DE BUSCA E AÇÕES
  // --------------------------------------------------------------------------

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      const [resUsuarios, resEspacos] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/users`),
        axios.get(`${API_BASE_URL}/api/locadores/espacos/todos`)
      ]);

      if (resUsuarios.status === 'fulfilled') {
        const dados = resUsuarios.value.data;
        // Trata o retorno caso venha paginado do Spring (dados.content) ou em lista
        setUsuarios(Array.isArray(dados) ? dados : (dados.content || []));
      }
      
      if (resEspacos.status === 'fulfilled') {
        const dadosEspacos = resEspacos.value.data;
        setEspacos(Array.isArray(dadosEspacos) ? dadosEspacos : (dadosEspacos.content || []));
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      setErro("Não foi possível carregar todas as informações do painel.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); 
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleExcluirUsuario = (usuarioAlvo) => {
    const isAdmin = usuarioAlvo.admin || usuarioAlvo.isAdmin;
    const totalAdmins = usuarios.filter(u => u.admin || u.isAdmin).length;

    if (isAdmin && totalAdmins <= 1) {
      alert("⚠️ Operação Negada: O sistema não pode ficar sem administradores. Cadastre outro admin antes de excluir este.");
      return;
    }

    alert(`[A fazer] Ação de excluir o usuário "${usuarioAlvo.nome || usuarioAlvo.email}". Aguardando endpoint do backend.`);
  };

  const handleEditarUsuario = (usuarioAlvo) => {
    alert(`[A fazer] Ação de editar o usuário "${usuarioAlvo.nome || usuarioAlvo.email}". Aguardando endpoints do backend.`);
  };

  // --------------------------------------------------------------------------
  // CÁLCULO DE MÉTRICAS (Memoizado para performance)
  // --------------------------------------------------------------------------

  const metricas = useMemo(() => {
    const usuariosComuns = usuarios.filter(u => !(u.isAdmin || u.admin));
    const totalUsuarios = usuariosComuns.length;

    const locadoresCount = usuarios.filter(u => u.isLocador || u.locador).length;
    const locatariosCount = usuarios.filter(u => u.isLocatario || u.locatario).length;
    const adminsCount = usuarios.filter(u => u.admin || u.isAdmin).length;

    // Converte datas para Timestamp para comparação segura
    const inicioTs = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null;
    const fimTs = dataFim ? new Date(`${dataFim}T23:59:59`).getTime() : null;

    const novosNoPeriodo = usuariosComuns.filter(u => {
      if (!u.dataCadastro) return false;
      const dt = new Date(u.dataCadastro).getTime();
      if (inicioTs && dt < inicioTs) return false;
      if (fimTs && dt > fimTs) return false;
      return true;
    }).length;

    const ativosNoPeriodo = usuariosComuns.filter(u => {
      const dataReferencia = u.dataAtivo || u.dataCadastro;
      if (!dataReferencia) return false;
      const dt = new Date(dataReferencia).getTime();
      if (inicioTs && dt < inicioTs) return false;
      if (fimTs && dt > fimTs) return false;
      return true;
    }).length;

    return { 
      totalUsuarios, 
      locadoresCount, 
      locatariosCount, 
      adminsCount, 
      novosNoPeriodo, 
      ativosNoPeriodo 
    };
  }, [usuarios, dataInicio, dataFim]);

  // --------------------------------------------------------------------------
  // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO (Sub-views)
  // --------------------------------------------------------------------------

  const renderOverview = () => (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">📅 Período de Análise:</label>
          <select 
            value={presetPeriodo} 
            onChange={(e) => setPresetPeriodo(e.target.value)} 
            className="select-input"
          >
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo o Período</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">De:</label>
          <input 
            type="date" 
            value={dataInicio} 
            onChange={(e) => { setDataInicio(e.target.value); setPresetPeriodo('custom'); }} 
            className="date-input" 
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Até:</label>
          <input 
            type="date" 
            value={dataFim} 
            onChange={(e) => { setDataFim(e.target.value); setPresetPeriodo('custom'); }} 
            className="date-input" 
          />
        </div>
      </div>

      <div className="grid-cards">
        <div className="card"><span className="card-icon">👥</span><div><h3 className="card-value">{loading ? '...' : metricas.totalUsuarios}</h3><p className="card-label">Total de Usuários</p></div></div>
        <div className="card card-blue"><span className="card-icon">🏡</span><div><h3 className="card-value">{loading ? '...' : metricas.locadoresCount}</h3><p className="card-label">Locadores</p></div></div>
        <div className="card card-green"><span className="card-icon">🎉</span><div><h3 className="card-value">{loading ? '...' : metricas.locatariosCount}</h3><p className="card-label">Locatários</p></div></div>
        <div className="card card-yellow"><span className="card-icon">🆕</span><div><h3 className="card-value">{loading ? '...' : metricas.novosNoPeriodo}</h3><p className="card-label">Novos no Período</p></div></div>
        <div className="card card-purple"><span className="card-icon">⚡</span><div><h3 className="card-value">{loading ? '...' : metricas.ativosNoPeriodo}</h3><p className="card-label">Ativos no Período</p></div></div>
      </div>

      <div className="content-box">
        <h3>Resumo Geral do Sistema</h3>
        <p>• <strong>Locadores:</strong> {metricas.locadoresCount} ({((metricas.locadoresCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
        <p>• <strong>Locatários:</strong> {metricas.locatariosCount} ({((metricas.locatariosCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
        <p>• <strong>Administradores:</strong> {metricas.adminsCount}</p>
        {erro && <p className="error-message">⚠️ {erro}</p>}
      </div>
    </div>
  );

  const renderUsuarios = () => (
    <div className="content-box">
      <h3>Lista Geral de Usuários</h3>
      <p className="section-description">Gerenciamento de contas de usuários, perfis e permissões.</p>
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">ID</th>
              <th className="admin-th">Nome</th>
              <th className="admin-th">Email</th>
              <th className="admin-th">Perfis</th>
              <th className="admin-th">Data Cadastro</th>
              <th className="admin-th">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id || u.firebaseUid}>
                <td className="admin-td">{u.id}</td>
                <td className="admin-td"><strong>{u.nome || 'Sem Nome'}</strong></td>
                <td className="admin-td">{u.email}</td>
                <td className="admin-td">
                  {(u.admin || u.isAdmin) && <span className="badge-admin">Admin</span>}
                  {(u.locador || u.isLocador) && <span className="badge-locador">Locador</span>}
                  {(u.locatario || u.isLocatario) && <span className="badge-locatario">Locatário</span>}
                </td>
                <td className="admin-td">
                  {u.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString('pt-BR') : 'N/I'}
                </td>
                <td className="admin-td action-buttons">
                  <button 
                    className="btn-sm btn-edit" 
                    onClick={() => handleEditarUsuario(u)}
                    title="Editar Usuário"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-sm btn-delete" 
                    onClick={() => handleExcluirUsuario(u)}
                    title="Excluir Usuário"
                    style={{ marginLeft: '6px' }}
                  >
                    🗑️ Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEspacos = () => (
    <div className="content-box">
      <h3>Lista de Espaços Cadastrados</h3>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">ID</th>
              <th className="admin-th">Título / Nome do Espaço</th>
              <th className="admin-th">Valor Diária</th>
            </tr>
          </thead>
          <tbody>
            {espacos.map((e) => (
              <tr key={e.id}>
                <td className="admin-td">{e.id}</td>
                <td className="admin-td">{e.titulo || e.nome || 'Sem nome'}</td>
                <td className="admin-td">
                  R$ {e.valorDiaria ? e.valorDiaria.toFixed(2).replace('.', ',') : '0,00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConteudoAtivo = () => {
    switch (menuAtivo) {
      case 'overview': return renderOverview();
      case 'usuarios': return renderUsuarios();
      case 'espacos': return renderEspacos();
      case 'novo_admin': return <NovoAdminTab />;
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
      case 'moderacao_espacos':
        return <EspacosTab />;
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
        return renderOverview();
    }
  };

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO PRINCIPAL
  // --------------------------------------------------------------------------

  return (
    <div className="admin-layout">
      {/* MENU LATERAL ISOLADO */}
      <Sidebar 
        sidebarExpandida={sidebarExpandida}
        setSidebarExpandida={setSidebarExpandida}
        menuAtivo={menuAtivo}
        setMenuAtivo={setMenuAtivo}
        usuariosCount={usuarios.length}
        espacosCount={espacos.length}
        handleLogout={handleLogout}
      />

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="main-content">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Painel Administrativo</h1>
            <p className="admin-subtitle">Gestão do ecossistema LocaFesta</p>
          </div>
          <button 
            onClick={carregarDados} 
            className="btn-refresh" 
            disabled={loading}
          >
            {loading ? '⏳ Atualizando...' : '🔄 Atualizar Dados'}
          </button>
        </header>

        {/* Renderiza dinamicamente o conteúdo com base na aba selecionada */}
        {renderConteudoAtivo()}

      </main>
    </div>
  );
}