import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import NovoAdminTab from '../../components/admin/NovoAdminTab';
import './DashboardAdmin.css';

export default function DashboardAdmin() {
  const { logout } = useAuth();
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState('overview');

  const [usuarios, setUsuarios] = useState([]);
  const [espacos, setEspacos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [presetPeriodo, setPresetPeriodo] = useState('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      const [resUsuarios, resEspacos] = await Promise.allSettled([
        axios.get('http://localhost:8080/api/users'),
        axios.get('http://localhost:8080/api/locadores/espacos/todos')
      ]);

      if (resUsuarios.status === 'fulfilled') {
        const dados = resUsuarios.value.data;
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

    alert(`[A fazer] Ação de excluir o usuário "${usuarioAlvo.nome || usuarioAlvo.email}". Aguardando finalização do backend pelo colega.`);
  };

  const handleEditarUsuario = (usuarioAlvo) => {
    alert(`[A fazer] Ação de editar o usuário "${usuarioAlvo.nome || usuarioAlvo.email}". Aguardando endpoints do backend.`);
  };

  const metricas = useMemo(() => {
    const usuariosComuns = usuarios.filter(u => !(u.isAdmin || u.admin));
    const totalUsuarios = usuariosComuns.length;

    const locadoresCount = usuarios.filter(u => u.isLocador || u.locador).length;
    const locatariosCount = usuarios.filter(u => u.isLocatario || u.locatario).length;
    const adminsCount = usuarios.filter(u => u.admin || u.isAdmin).length;

    const inicioTs = dataInicio ? new Date(dataInicio + 'T00:00:00').getTime() : null;
    const fimTs = dataFim ? new Date(dataFim + 'T23:59:59').getTime() : null;

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

    return { totalUsuarios, locadoresCount, locatariosCount, adminsCount, novosNoPeriodo, ativosNoPeriodo };
  }, [usuarios, dataInicio, dataFim]);

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
          <button onClick={carregarDados} className="btn-refresh">
            🔄 Atualizar Dados
          </button>
        </header>

        {menuAtivo === 'overview' && (
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <label className="filter-label">📅 Período de Análise:</label>
                <select value={presetPeriodo} onChange={(e) => setPresetPeriodo(e.target.value)} className="select-input">
                  <option value="30">Últimos 30 dias</option>
                  <option value="60">Últimos 60 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="all">Todo o Período</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">De:</label>
                <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPresetPeriodo('custom'); }} className="date-input" />
              </div>
              <div className="filter-group">
                <label className="filter-label">Até:</label>
                <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPresetPeriodo('custom'); }} className="date-input" />
              </div>
            </div>

            <div className="grid-cards">
              <div className="card"><span className="card-icon">👥</span><div><h3 className="card-value">{loading ? '...' : metricas.totalUsuarios}</h3><p className="card-label">Total de Usuários</p></div></div>
              <div className="card card-blue"><span className="card-icon">🏡</span><div><h3 className="card-value">{loading ? '...' : metricas.locadoresCount}</h3><p className="card-label">Locadores (Proprietários)</p></div></div>
              <div className="card card-green"><span className="card-icon">🎉</span><div><h3 className="card-value">{loading ? '...' : metricas.locatariosCount}</h3><p className="card-label">Locatários (Clientes)</p></div></div>
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
        )}

        {menuAtivo === 'usuarios' && (
          <div className="content-box">
            <h3>Lista Geral de Usuários</h3>
            <p className="section-description">Gerenciamento de contas de usuários, perfis e permissões.</p>
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
                    <td className="admin-td">{u.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString('pt-BR') : 'N/I'}</td>
                    <td className="admin-td">
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
        )}

        {menuAtivo === 'espacos' && (
          <div className="content-box">
            <h3>Lista de Espaços Cadastrados</h3>
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
                    <td className="admin-td">R$ {e.valorDiaria ? e.valorDiaria.toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {menuAtivo === 'documentos' && (
          <div className="content-box">
            <h3>🛡️ Validação de Documentos e Alvarás</h3>
            <p className="section-description">Análise de RG/CNH de usuários e comprovação de propriedade / alvará de espaços.</p>
            <div className="placeholder-box">
              <p>📄 Aqui serão exibidos os documentos pendentes de verificação enviados pelos locadores e locatários.</p>
            </div>
          </div>
        )}

{menuAtivo === 'novo_admin' && (
          <NovoAdminTab />
        )}

        {menuAtivo === 'moderacao_espacos' && (
          <div className="content-box">
            <h3>📋 Moderação de Anúncios de Espaços</h3>
            <p className="section-description">Revise novos locais cadastrados por locadores antes de irem para a busca do app.</p>
          </div>
        )}

        {menuAtivo === 'financeiro' && (
          <div className="content-box">
            <h3>💳 Gestão de Reservas e Repasses</h3>
            <p className="section-description">Acompanhamento das transações, taxas de serviço da plataforma e liberação de pagamentos.</p>
          </div>
        )}

        {menuAtivo === 'denuncias' && (
          <div className="content-box">
            <h3>🚩 Central de Suporte & Moderação</h3>
            <p className="section-description">Histórico de chamados, denúncias de anúncios e desacordos nas reservas.</p>
          </div>
        )}
      </main>
    </div>
  );
}