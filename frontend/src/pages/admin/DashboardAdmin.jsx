import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [espacos, setEspacos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('overview');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);

    try {
      // Tenta buscar a lista de usuários e de espaços simultaneamente
      const [resUsuarios, resEspacos] = await Promise.allSettled([
        axios.get('http://localhost:8080/api/users'),
        axios.get('http://localhost:8080/api/locadores/espacos/todos')
      ]);

      if (resUsuarios.status === 'fulfilled') {
        setUsuarios(resUsuarios.value.data || []);
      }
      
      if (resEspacos.status === 'fulfilled') {
        setEspacos(resEspacos.value.data || []);
      }

    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      setErro("Não foi possível carregar todas as informações do painel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER DO PAINEL */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Painel Administrativo</h1>
          <p style={styles.subtitle}>Visão geral do sistema LocaFesta</p>
        </div>
        <button onClick={carregarDados} style={styles.btnRefresh}>
          🔄 Atualizar Dados
        </button>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <div style={styles.gridCards}>
        <div style={styles.card}>
          <span style={styles.cardIcon}>👥</span>
          <div>
            <h3 style={styles.cardValue}>{loading ? '...' : usuarios.length}</h3>
            <p style={styles.cardLabel}>Usuários Cadastrados</p>
          </div>
        </div>

        <div style={styles.card}>
          <span style={styles.cardIcon}>🏰</span>
          <div>
            <h3 style={styles.cardValue}>{loading ? '...' : espacos.length}</h3>
            <p style={styles.cardLabel}>Espaços Cadastrados</p>
          </div>
        </div>

        <div style={styles.card}>
          <span style={styles.cardIcon}>📅</span>
          <div>
            <h3 style={styles.cardValue}>--</h3>
            <p style={styles.cardLabel}>Reservas (Em Breve)</p>
          </div>
        </div>
      </div>

      {/* NAUVEGAÇÃO DE ABAS */}
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
        <div style={styles.loadingBox}>Carregando informações do servidor...</div>
      ) : (
        <div style={styles.contentBox}>
          
          {/* ABA: VISÃO GERAL */}
          {abaAtiva === 'overview' && (
            <div>
              <h3>Status do Sistema</h3>
              <p> Servidor Backend: <strong>http://localhost:8080</strong></p>
              <p> Módulo de Reservas: <strong>Pendente de integração</strong></p>
              {erro && <p style={{ color: 'red' }}>⚠️ {erro}</p>}
            </div>
          )}

          {/* ABA: USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div>
              <h3>Lista de Usuários</h3>
              {usuarios.length === 0 ? (
                <p>Nenhum usuário encontrado ou endpoint <code>GET /api/users</code> não implementado no backend.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id || u.firebaseUid}>
                        <td style={styles.td}>{u.id}</td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{u.admin ? 'Administrador' : 'Usuário Comum'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ABA: ESPAÇOS */}
          {abaAtiva === 'espacos' && (
            <div>
              <h3>Lista de Espaços</h3>
              {espacos.length === 0 ? (
                <p>Nenhum espaço encontrado ou endpoint <code>GET /api/locadores/espacos/todos</code> não implementado.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nome do Espaço</th>
                      <th style={styles.th}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espacos.map((e) => (
                      <tr key={e.id}>
                        <td style={styles.td}>{e.id}</td>
                        <td style={styles.td}>{e.nome || 'Sem nome'}</td>
                        <td style={styles.td}>
                          <button style={styles.btnAction}>Ver Detalhes</button>
                        </td>
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

// ESTILOS EM JSOBJECT (Simples e sem dependência de bibliotecas CSS externas)
const styles = {
  container: { padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { margin: 0, color: '#1a1a1a' },
  subtitle: { margin: '5px 0 0 0', color: '#666' },
  btnRefresh: { padding: '10px 15px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { display: 'flex', alignItems: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  cardIcon: { fontSize: '30px', marginRight: '15px' },
  cardValue: { margin: 0, fontSize: '24px', color: '#111827' },
  cardLabel: { margin: 0, color: '#6b7280', fontSize: '14px' },
  tabsContainer: { display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' },
  tab: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b7280' },
  tabActive: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid #4F46E5', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#4F46E5' },
  contentBox: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' },
  loadingBox: { padding: '40px', textAlign: 'center', color: '#666' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb' },
  btnAction: { padding: '6px 12px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};