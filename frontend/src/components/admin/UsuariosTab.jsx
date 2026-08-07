import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Estado para Modal de Edição
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', tipoUsuario: 'LOCATARIO' });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const dados = response.data;
      setUsuarios(Array.isArray(dados) ? dados : (dados.content || []));
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setErro("Falha ao carregar a lista de usuários.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // AÇÕES: EXCLUIR E EDITAR
  // --------------------------------------------------------------------------
  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${nome}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      alert('Usuário removido com sucesso.');
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert('Erro ao excluir usuário. Verifique se existem dependências vinculadas.');
    }
  };

  const handleAbrirEdicao = (usuario) => {
    setUsuarioEmEdicao(usuario);
    setFormData({
      nome: usuario.nome || usuario.name || '',
      email: usuario.email || '',
      tipoUsuario: usuario.isLocador ? 'LOCADOR' : 'LOCATARIO'
    });
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        isLocador: formData.tipoUsuario === 'LOCADOR',
        isLocatario: formData.tipoUsuario === 'LOCATARIO'
      };

      const response = await axios.put(`${API_BASE_URL}/api/users/${usuarioEmEdicao.id}`, payload);
      
      // Atualiza a lista local com os novos dados
      setUsuarios(prev => prev.map(u => u.id === usuarioEmEdicao.id ? { ...u, ...response.data } : u));
      setUsuarioEmEdicao(null);
      alert('Usuário atualizado com sucesso!');
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      alert('Falha ao salvar as alterações do usuário.');
    }
  };

  // Filtragem local por termo de busca
  const usuariosFiltrados = usuarios.filter(u => {
    const termo = termoBusca.toLowerCase();
    const nome = (u.nome || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return nome.includes(termo) || email.includes(termo);
  });

  return (
    <div className="content-box">
      <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>👥 Gerenciamento de Usuários</h3>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="search-input"
          style={{ padding: '0.5rem 1rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      {erro && <p className="error-message">⚠️ {erro}</p>}

      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.nome || u.name || 'Sem nome'}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.isAdmin || u.admin ? 'badge-admin' : u.isLocador ? 'badge-locador' : 'badge-locatario'}`}>
                        {u.isAdmin || u.admin ? 'Admin' : u.isLocador ? 'Locador' : 'Locatário'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-action btn-edit" 
                        onClick={() => handleAbrirEdicao(u)}
                        style={{ marginRight: '8px' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        onClick={() => handleExcluir(u.id, u.nome || u.email)}
                      >
                        🗑️ Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL / FORMULÁRIO SOBREPOSTO DE EDIÇÃO */}
      {usuarioEmEdicao && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div className="modal-card" style={modalContentStyle}>
            <h3>Editar Usuário #{usuarioEmEdicao.id}</h3>
            <form onSubmit={handleSalvarEdicao}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Nome:</label>
                <input 
                  type="text" 
                  value={formData.nome} 
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '0.5rem', marginTop: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label>E-mail:</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '0.5rem', marginTop: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label>Tipo de Perfil:</label>
                <select 
                  value={formData.tipoUsuario} 
                  onChange={e => setFormData({ ...formData, tipoUsuario: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '4px' }}
                >
                  <option value="LOCATARIO">Locatário</option>
                  <option value="LOCADOR">Locador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setUsuarioEmEdicao(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilização simples para o Modal caso precise inline
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  minWidth: '400px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};