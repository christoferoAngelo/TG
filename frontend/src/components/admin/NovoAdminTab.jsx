import React, { useState } from 'react';
import axios from 'axios';
import './NovoAdminTab.css'; // Importando o estilo isolado

export default function NovoAdminTab() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);
    setErro(null);

    try {
      await axios.post('http://localhost:8080/api/users/admin', {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        isAdmin: true
      });

      setMensagem(`Administrador "${formData.nome}" cadastrado com sucesso!`);
      setFormData({ nome: '', email: '', telefone: '', senha: '' });
    } catch (err) {
      console.error("Erro ao cadastrar administrador:", err);
      setErro("Não foi possível cadastrar o novo administrador. Verifique os dados ou o endpoint do backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <h3>➕ Cadastrar Novo Administrador</h3>
      <p className="section-description">Conceda privilégios de acesso administrativo para novos membros da equipe.</p>
      
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

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="filter-label">Senha Temporária:</label>
          <input 
            type="password" 
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            placeholder="Mínimo de 6 caracteres" 
            className="date-input" 
            required
          />
        </div>

        <button type="submit" className="btn-refresh" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Administrador'}
        </button>
      </form>
    </div>
  );
}