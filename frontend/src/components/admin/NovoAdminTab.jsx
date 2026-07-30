import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../../config/firebaseConfig";
import './NovoAdminTab.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function NovoAdminTab() {
  // --------------------------------------------------------------------------
  // ESTADOS
  // --------------------------------------------------------------------------
  const [admins, setAdmins] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  
  // Controle do modo de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [adminEmEdicao, setAdminEmEdicao] = useState(null);

  // --------------------------------------------------------------------------
  // EFEITOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    carregarAdmins();
  }, []);

  const carregarAdmins = async () => {
    setLoadingList(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const todosUsuarios = Array.isArray(response.data) ? response.data : (response.data.content || []);
      
      // Filtra apenas os usuários que são admins
      const apenasAdmins = todosUsuarios.filter(u => u.admin || u.isAdmin);
      setAdmins(apenasAdmins);
    } catch (err) {
      console.error("Erro ao carregar lista de administradores:", err);
      setErro("Não foi possível carregar a lista de administradores.");
    } finally {
      setLoadingList(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS DE FORMULÁRIO (CRIAR E EDITAR)
  // --------------------------------------------------------------------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    setAdminEmEdicao(null);
    setFormData({ nome: '', email: '', telefone: '', senha: '' });
    setMensagem(null);
    setErro(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);
    setErro(null);

    try {
      if (isEditing) {
        // --- FLUXO DE EDIÇÃO ---
        // Nota: A atualização de e-mail/senha geralmente exige integração com o Admin SDK no backend.
        // Aqui estamos atualizando os dados do perfil no Spring Boot.
        const id = adminEmEdicao.id || adminEmEdicao.firebaseUid;
        
        await axios.put(`${API_BASE_URL}/api/users/${id}`, {
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email 
        });

        setMensagem(`Administrador "${formData.nome}" atualizado com sucesso!`);
        cancelarEdicao();

      } else {
        // --- FLUXO DE CRIAÇÃO (Seu código original) ---
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.senha
        );
        
        const user = userCredential.user;
        const uidDoFirebase = user.uid;

        await axios.post(`${API_BASE_URL}/api/users/admin`, {
          firebaseUid: uidDoFirebase,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        });

        setMensagem(`Administrador "${formData.nome}" cadastrado com sucesso!`);
        setFormData({ nome: '', email: '', telefone: '', senha: '' });
      }
      
      // Atualiza a lista após salvar
      carregarAdmins();

    } catch (err) {
      console.error("Erro ao salvar administrador:", err);
      
      if (err.code === 'auth/email-already-in-use') {
        setErro("Este e-mail já está em uso no sistema.");
      } else if (err.code === 'auth/weak-password') {
         setErro("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/invalid-email') { 
         setErro("O formato do e-mail é inválido. Digite um e-mail correto (ex: nome@empresa.com).");
      } else {
        setErro(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} o administrador. Verifique o console.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS DA TABELA (EDITAR E EXCLUIR)
  // --------------------------------------------------------------------------
  const handleEditClick = (admin) => {
    setIsEditing(true);
    setAdminEmEdicao(admin);
    setFormData({
      nome: admin.nome || '',
      email: admin.email || '',
      telefone: admin.telefone || '',
      senha: '' // Deixamos vazio pois não vamos editar a senha por aqui
    });
    setMensagem(null);
    setErro(null);
    
    // Rola a página para o formulário
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteClick = async (admin) => {
    if (admins.length <= 1) {
      alert("⚠️ Operação Negada: O sistema não pode ficar sem administradores. Cadastre outro admin antes de excluir este.");
      return;
    }

    const confirmar = window.confirm(`Tem certeza que deseja excluir o administrador "${admin.nome || admin.email}"? Esta ação não pode ser desfeita.`);
    if (!confirmar) return;

    try {
      const id = admin.id || admin.firebaseUid;
      // Certifique-se de que este endpoint DELETE existe no seu Spring Boot
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      
      setMensagem("Administrador excluído com sucesso!");
      carregarAdmins();
    } catch (err) {
      console.error("Erro ao excluir administrador:", err);
      setErro("Erro ao excluir administrador. Verifique o console.");
    }
  };

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // --------------------------------------------------------------------------
  return (
    <div className="admin-form-container">
      {/* SEÇÃO 1: LISTA DE ADMINISTRADORES */}
      <div className="content-box" style={{ marginBottom: '30px' }}>
        <h3>🛡️ Administradores do Sistema</h3>
        <p className="section-description">Gerencie as contas com privilégios de acesso administrativo.</p>
        
        {loadingList ? (
          <p>⏳ Carregando lista de administradores...</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Nome</th>
                  <th className="admin-th">E-mail</th>
                  <th className="admin-th">Telefone</th>
                  <th className="admin-th">Ações</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => (
                  <tr key={adm.id || adm.firebaseUid}>
                    <td className="admin-td"><strong>{adm.nome || 'N/I'}</strong></td>
                    <td className="admin-td">{adm.email}</td>
                    <td className="admin-td">{adm.telefone || 'N/I'}</td>
                    <td className="admin-td action-buttons">
                      <button 
                        className="btn-sm btn-edit" 
                        onClick={() => handleEditClick(adm)}
                        style={{ marginRight: '8px' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-sm btn-delete" 
                        onClick={() => handleDeleteClick(adm)}
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
      </div>

      {/* SEÇÃO 2: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
      <div className="content-box">
        <h3>{isEditing ? '✏️ Editar Administrador' : '➕ Cadastrar Novo Administrador'}</h3>
        <p className="section-description">
          {isEditing 
            ? 'Atualize os dados de contato do administrador selecionado.' 
            : 'Conceda privilégios de acesso administrativo para novos membros da equipe.'}
        </p>
        
        {mensagem && <div className="alert-success">✨ {mensagem}</div>}
        {erro && <div className="alert-error">⚠️ {erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="filter-label">Nome Completo:</label>
            <input 
              type="text" 
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Maria Silva" 
              className="date-input" 
              required
            />
          </div>

          <div className="form-group">
            <label className="filter-label">E-mail Corporativo:</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@locafesta.com" 
              className="date-input" 
              required
              disabled={isEditing} // O ideal é não mudar o e-mail se estiver usando Firebase
              title={isEditing ? "Não é possível alterar o e-mail de uma conta existente." : ""}
            />
          </div>

          <div className="form-group">
            <label className="filter-label">Telefone:</label>
            <input 
              type="text" 
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999" 
              className="date-input" 
            />
          </div>

          {/* Só exibe o campo de senha se for CRIAÇÃO */}
          {!isEditing && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="filter-label">Senha Temporária:</label>
              <input 
                type="password" 
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Mínimo de 6 caracteres" 
                className="date-input" 
                required={!isEditing}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-refresh" disabled={loading}>
              {loading 
                ? 'Processando...' 
                : (isEditing ? '💾 Salvar Alterações' : 'Cadastrar Administrador')
              }
            </button>

            {isEditing && (
              <button 
                type="button" 
                className="btn-refresh" 
                style={{ backgroundColor: '#6c757d' }} 
                onClick={cancelarEdicao}
              >
                ❌ Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}