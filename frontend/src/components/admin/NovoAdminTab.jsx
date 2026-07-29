import React, { useState } from 'react';
import axios from 'axios';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Importe do Firebase
import { auth } from "../../config/firebaseConfig";
import './NovoAdminTab.css';

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
      // 1. CRIAR A CONTA NO FIREBASE PRIMEIRO
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.senha
      );
      
      const user = userCredential.user;
      const uidDoFirebase = user.uid; // Pegamos o UID gerado pelo Firebase!

      // 2. ENVIAR PARA O SEU BACKEND COM O UID INCLUSO
      await axios.post('http://localhost:8080/api/users/admin', {
        firebaseUid: uidDoFirebase, // AGORA SIM O BACKEND VAI ACEITAR!
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone
      });

      setMensagem(`Administrador "${formData.nome}" cadastrado com sucesso!`);
      setFormData({ nome: '', email: '', telefone: '', senha: '' });
      
} catch (err) {
      console.error("Erro ao cadastrar administrador:", err);
      
      // Tratamento amigável de erros do Firebase
      if (err.code === 'auth/email-already-in-use') {
        setErro("Este e-mail já está em uso no sistema.");
      } else if (err.code === 'auth/weak-password') {
         setErro("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/invalid-email') { // <-- ADICIONE ESTA LINHA
         setErro("O formato do e-mail é inválido. Digite um e-mail correto (ex: nome@empresa.com).");
      } else {
        setErro("Erro ao cadastrar o administrador. Verifique o console.");
      }
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