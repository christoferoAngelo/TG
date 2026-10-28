import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IconeAdmin } from './AdminIcons';
import GlideSelect from '../bits/GlideSelect';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [pendenteExcluir, setPendenteExcluir] = useState(null);

  // Estado para Modal de Edição
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', tipoUsuario: 'LOCATARIO' });

  const ADMIN_MASTER = 'locafesta.suporte@gmail.com';
  const ehMaster = (usuario) => (usuario?.email || '').toLowerCase() === ADMIN_MASTER;

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
  const pedirExclusao = (usuario) => {
    setErro(null);
    setSucesso(null);
    if (ehMaster(usuario)) {
      setErro('O administrador master não pode ser excluído.');
      return;
    }
    setPendenteExcluir(usuario);
  };

  const confirmarExclusao = async () => {
    if (!pendenteExcluir) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${pendenteExcluir.id}`);
      setUsuarios(prev => prev.filter(u => u.id !== pendenteExcluir.id));
      setSucesso('Usuário removido com sucesso.');
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      const msg = err.response?.data?.message || err.response?.data || 'Erro ao excluir usuário. Verifique se existem dependências vinculadas.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao excluir usuário.');
    } finally {
      setPendenteExcluir(null);
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
      setSucesso('Usuário atualizado com sucesso.');
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      setErro('Falha ao salvar as alterações do usuário.');
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
      <div className="adm-toolbar">
        <label className="adm-busca">
          <IconeAdmin nome="busca" />
          <input
            type="search"
            placeholder="Buscar por nome ou e-mail"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            aria-label="Buscar usuários"
          />
        </label>
      </div>

      {erro && <p className="error-message" role="alert">{erro}</p>}
      {sucesso && <p className="adm-sucesso" role="status">{sucesso}</p>}

      {loading ? (
        <div className="adm-vazio"><p>Carregando usuários…</p></div>
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
                  <td colSpan="5">
                    <div className="adm-vazio">
                      <strong>Nenhum usuário encontrado</strong>
                      <p>Tente outro nome ou e-mail.</p>
                    </div>
                  </td>
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
                      <div className="action-buttons">
                        <button type="button" className="btn-sm btn-edit" onClick={() => handleAbrirEdicao(u)}>
                          Editar
                        </button>
                        {!ehMaster(u) && (
                          <button type="button" className="btn-sm btn-delete" onClick={() => pedirExclusao(u)}>
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pendenteExcluir && (
        <div className="adm-confirm" role="dialog" aria-modal="true">
          <div className="adm-confirm-caixa">
            <h4>Excluir usuário?</h4>
            <p>Remover “{pendenteExcluir.nome || pendenteExcluir.email}” do sistema.</p>
            <div className="adm-confirm-acoes">
              <button type="button" className="btn" onClick={() => setPendenteExcluir(null)}>Cancelar</button>
              <button type="button" className="btn btn-delete" onClick={confirmarExclusao}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {usuarioEmEdicao && (
        <div className="modal-overlay" onClick={() => setUsuarioEmEdicao(null)}>
          <div className="modal-content" onClick={(evento) => evento.stopPropagation()}>
            <h3>Editar usuário</h3>
            <p className="modal-desc">Conta #{usuarioEmEdicao.id}</p>
            <form onSubmit={handleSalvarEdicao}>
              <div className="adm-campo-grupo">
                <label htmlFor="adm-user-nome">Nome</label>
                <input
                  id="adm-user-nome"
                  className="adm-campo"
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="adm-campo-grupo">
                <label htmlFor="adm-user-email">E-mail</label>
                <input
                  id="adm-user-email"
                  className="adm-campo"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="adm-campo-grupo">
                <label htmlFor="adm-user-perfil">Tipo de perfil</label>
                <GlideSelect
                  id="adm-user-perfil"
                  className="glide-select--bloco"
                  ariaLabel="Tipo de perfil"
                  size="lg"
                  menuWidth={220}
                  value={formData.tipoUsuario}
                  options={[
                    { value: "LOCATARIO", label: "Locatário" },
                    { value: "LOCADOR", label: "Locador" }
                  ]}
                  onChange={(valor) => setFormData({ ...formData, tipoUsuario: valor })}
                />
              </div>

              <div className="adm-modal-acoes">
                <button type="button" onClick={() => setUsuarioEmEdicao(null)} className="btn btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-destaque">
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