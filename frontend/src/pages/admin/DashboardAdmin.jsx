import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [espacos, setEspacos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('overview');

  // --- FILTROS DE PERÍODO (ESTILO LOOKER STUDIO) ---
  const [presetPeriodo, setPresetPeriodo] = useState('30'); // '30', '60', '90', 'all', 'custom'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Ajusta automaticamente as datas de início/fim de acordo com o atalho selecionado
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
      // Garante que pegamos o array mesmo se vier envelopado (ex: paginação PageImpl)
      const dados = resUsuarios.value.data;
      const listaUsuarios = Array.isArray(dados) ? dados : (dados.content || []);
      
      console.log("Usuários carregados do backend:", listaUsuarios);
      setUsuarios(listaUsuarios);
    }
    
    if (resEspacos.status === 'fulfilled') {
      const dadosEspacos = resEspacos.value.data;
      const listaEspacos = Array.isArray(dadosEspacos) ? dadosEspacos : (dadosEspacos.content || []);
      setEspacos(listaEspacos);
    }

  } catch (err) {
    console.error("Erro ao carregar dados do admin:", err);
    setErro("Não foi possível carregar todas as informações do painel.");
  } finally {
    setLoading(false);
  }
};

const metricas = useMemo(() => {
  // 1. Filtra apenas quem NÃO é administrador
  const usuariosComuns = usuarios.filter(u => !(u.isAdmin || u.admin));
  
  // Total de usuários reais do sistema (ex: 2)
  const totalUsuarios = usuariosComuns.length;

  const locadoresCount = usuarios.filter(u => u.isLocador || u.locador).length;
  const locatariosCount = usuarios.filter(u => u.isLocatario || u.locatario).length;
  const adminsCount = usuarios.filter(u => u.isAdmin || u.admin).length;

  const inicioTs = dataInicio ? new Date(dataInicio + 'T00:00:00').getTime() : null;
  const fimTs = dataFim ? new Date(dataFim + 'T23:59:59').getTime() : null;

  // Novos Cadastros no período (apenas usuários comuns)
  const novosNoPeriodo = usuariosComuns.filter(u => {
    if (!u.dataCadastro) return false;
    const dt = new Date(u.dataCadastro).getTime();
    if (inicioTs && dt < inicioTs) return false;
    if (fimTs && dt > fimTs) return false;
    return true;
  }).length;

  // Ativos no período (apenas usuários comuns)
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

  return (
    <div style={styles.container}>
      {/* HEADER DO PAINEL */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel Administrativo</h1>
          <p style={styles.subtitle}>Métricas e gestão do ecossistema LocaFesta</p>
        </div>
        <button onClick={carregarDados} style={styles.btnRefresh}>
          🔄 Atualizar Dados
        </button>
      </header>

      {/* PAINEL DE FILTRO DE DATA (LOOKER STUDIO STYLE) */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>📅 Período de Análise:</label>
          <select 
            value={presetPeriodo} 
            onChange={(e) => setPresetPeriodo(e.target.value)}
            style={styles.selectInput}
          >
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo o Período</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {/* DATAS DE/ATÉ EXIBIDAS QUANDO SELECIONADO OU PERSONALIZADO */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>De:</label>
          <input 
            type="date" 
            value={dataInicio} 
            onChange={(e) => { setDataInicio(e.target.value); setPresetPeriodo('custom'); }}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Até:</label>
          <input 
            type="date" 
            value={dataFim} 
            onChange={(e) => { setDataFim(e.target.value); setPresetPeriodo('custom'); }}
            style={styles.dateInput}
          />
        </div>
      </div>

      {/* CARDS DE MÉTRICAS DETALHADAS */}
      <div style={styles.gridCards}>
        <div style={styles.card}>
          <span style={styles.cardIcon}>👥</span>
          <div>
            <h3 style={styles.cardValue}>{loading ? '...' : metricas.totalUsuarios}</h3>
            <p style={styles.cardLabel}>Total de Usuários</p>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #3B82F6' }}>
          <span style={styles.cardIcon}>🏡</span>
          <div>
            <h3 style={{ ...styles.cardValue, color: '#1E40AF' }}>{loading ? '...' : metricas.locadoresCount}</h3>
            <p style={styles.cardLabel}>Locadores (Proprietários)</p>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #10B981' }}>
          <span style={styles.cardIcon}>🎉</span>
          <div>
            <h3 style={{ ...styles.cardValue, color: '#065F46' }}>{loading ? '...' : metricas.locatariosCount}</h3>
            <p style={styles.cardLabel}>Locatários (Clientes)</p>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #F59E0B' }}>
          <span style={styles.cardIcon}>🆕</span>
          <div>
            <h3 style={{ ...styles.cardValue, color: '#D97706' }}>{loading ? '...' : metricas.novosNoPeriodo}</h3>
            <p style={styles.cardLabel}>Novos no Período</p>
          </div>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #8B5CF6' }}>
          <span style={styles.cardIcon}>⚡</span>
          <div>
            <h3 style={{ ...styles.cardValue, color: '#5B21B6' }}>{loading ? '...' : metricas.ativosNoPeriodo}</h3>
            <p style={styles.cardLabel}>Ativos no Período</p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div style={styles.tabsContainer}>
        <button 
          style={abaAtiva === 'overview' ? styles.tabActive : styles.tab}
          onClick={() => setAbaAtiva('overview')}
        >
          Visão Geral
        </button>
        <button 
          style={abaAtiva === 'usuarios' ? styles.tabActive : styles.tab}
          onClick={() => setAbaAtiva('usuarios')}
        >
          Usuários ({usuarios.length})
        </button>
        <button 
          style={abaAtiva === 'espacos' ? styles.tabActive : styles.tab}
          onClick={() => setAbaAtiva('espacos')}
        >
          Espaços ({espacos.length})
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {loading ? (
        <div style={styles.loadingBox}>Carregando informações do banco de dados...</div>
      ) : (
        <div style={styles.contentBox}>
          
          {/* ABA: VISÃO GERAL */}
          {abaAtiva === 'overview' && (
            <div>
              <h3>Resumo da Base de Dados</h3>
              <p>• <strong>Locadores:</strong> {metricas.locadoresCount} ({((metricas.locadoresCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
              <p>• <strong>Locatários:</strong> {metricas.locatariosCount} ({((metricas.locatariosCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
              <p>• <strong>Administradores:</strong> {metricas.adminsCount}</p>
              {erro && <p style={{ color: 'red' }}>⚠️ {erro}</p>}
            </div>
          )}

          {/* ABA: USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div>
              <h3>Lista Geral de Usuários</h3>
              {usuarios.length === 0 ? (
                <p>Nenhum usuário encontrado.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Perfis</th>
                      <th style={styles.th}>Data Cadastro</th>
                      <th style={styles.th}>Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => {
                      const isLocador = u.locador || u.isLocador;
                      const isLocatario = u.locatario || u.isLocatario;

                      return (
                        <tr key={u.id || u.firebaseUid}>
                          <td style={styles.td}>{u.id}</td>
                          <td style={styles.td}><strong>{u.nome || 'Sem Nome'}</strong></td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>
                            {u.admin && <span style={styles.badgeAdmin}>Admin</span>}
                            {isLocador && <span style={styles.badgeLocador}>Locador</span>}
                            {isLocatario && <span style={styles.badgeLocatario}>Locatário</span>}
                            {!u.admin && !isLocador && !isLocatario && <span style={styles.badgeComum}>Sem Perfil</span>}
                          </td>
                          <td style={styles.td}>
                            {u.dataCadastro ? new Date(u.dataCadastro).toLocaleDateString('pt-BR') : 'N/I'}
                          </td>
                          <td style={styles.td}>
                            {u.dataAtivo ? new Date(u.dataAtivo).toLocaleString('pt-BR') : 'Nunca'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ABA: ESPAÇOS */}
          {abaAtiva === 'espacos' && (
            <div>
              <h3>Lista de Espaços Cadastrados</h3>
              {espacos.length === 0 ? (
                <p>Nenhum espaço encontrado no banco.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Título / Nome do Espaço</th>
                      <th style={styles.th}>Valor Diária</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espacos.map((e) => (
                      <tr key={e.id}>
                        <td style={styles.td}>{e.id}</td>
                        <td style={styles.td}>{e.titulo || e.nome || 'Sem nome'}</td>
                        <td style={styles.td}>R$ {e.valorDiaria ? e.valorDiaria.toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ESTILOS VISUAIS
const styles = {
  container: { padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1280px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, color: '#0f172a' },
  subtitle: { margin: '5px 0 0 0', color: '#64748b' },
  btnRefresh: { padding: '10px 16px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  
  // FILTRO ESTILO LOOKER STUDIO
  filterBar: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  filterGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  filterLabel: { fontSize: '14px', fontWeight: 'bold', color: '#334155' },
  selectInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '14px' },
  dateInput: { padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },

  // CARDS DE MÉTRICAS
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '15px', marginBottom: '25px' },
  card: { display: 'flex', alignItems: 'center', padding: '18px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  cardIcon: { fontSize: '28px', marginRight: '12px' },
  cardValue: { margin: 0, fontSize: '22px', color: '#0f172a' },
  cardLabel: { margin: 0, color: '#64748b', fontSize: '13px' },
  
  // NAVEGAÇÃO E TABELAS
  tabsContainer: { display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' },
  tab: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#64748b' },
  tabActive: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid #4F46E5', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', color: '#4F46E5' },
  contentBox: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  loadingBox: { padding: '40px', textAlign: 'center', color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px' },
  td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },

  // BADGES DE TIPO
  badgeAdmin: { backgroundColor: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' },
  badgeLocador: { backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' },
  badgeLocatario: { backgroundColor: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' },
  badgeComum: { backgroundColor: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }
};