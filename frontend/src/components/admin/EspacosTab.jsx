import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NovoAdminTab.css'; // Reutilizando seu CSS de admin

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function EspacosTab() {
  // --------------------------------------------------------------------------
  // ESTADOS
  // --------------------------------------------------------------------------
  const [espacosPendentes, setEspacosPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null); // Para desabilitar o botão enquanto carrega
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);

  // --------------------------------------------------------------------------
  // EFEITOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    carregarEspacosPendentes();
  }, []);

  const carregarEspacosPendentes = async () => {
    setLoading(true);
    setMensagem(null);
    setErro(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/espacos/pendentes`);
      setEspacosPendentes(response.data);
    } catch (err) {
      console.error("Erro ao carregar espaços pendentes:", err);
      setErro("Não foi possível carregar a lista de espaços pendentes.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS (EVENTOS DE APROVAR E REJEITAR)
  // --------------------------------------------------------------------------
  const handleAprovar = async (espaco) => {
    const confirmar = window.confirm(`Tem certeza que deseja APROVAR o espaço "${espaco.titulo}"?`);
    if (!confirmar) return;

    setProcessandoId(espaco.id);
    setMensagem(null);
    setErro(null);

    try {
      await axios.patch(`${API_BASE_URL}/api/admin/espacos/${espaco.id}/aprovar`);
      setMensagem(`✅ Espaço "${espaco.titulo}" aprovado com sucesso!`);
      carregarEspacosPendentes(); // Recarrega a lista para remover o espaço aprovado da tela
    } catch (err) {
      console.error("Erro ao aprovar espaço:", err);
      setErro("Erro ao aprovar o espaço. Verifique o console.");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRejeitar = async (espaco) => {
    const confirmar = window.confirm(`Tem certeza que deseja REJEITAR o espaço "${espaco.titulo}"?`);
    if (!confirmar) return;

    setProcessandoId(espaco.id);
    setMensagem(null);
    setErro(null);

    try {
      await axios.patch(`${API_BASE_URL}/api/admin/espacos/${espaco.id}/rejeitar`);
      setMensagem(`❌ Espaço "${espaco.titulo}" rejeitado.`);
      carregarEspacosPendentes(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao rejeitar espaço:", err);
      setErro("Erro ao rejeitar o espaço. Verifique o console.");
    } finally {
      setProcessandoId(null);
    }
  };

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO
  // --------------------------------------------------------------------------
  return (
    <div className="admin-form-container">
      <div className="content-box">
        <h3>📋 Análise de Espaços Pendentes</h3>
        <p className="section-description">
          Revise os novos espaços cadastrados pelos locadores antes que eles fiquem visíveis para os clientes.
        </p>

        {/* Alertas */}
        {mensagem && <div className="alert-success" style={{ marginBottom: '15px' }}>{mensagem}</div>}
        {erro && <div className="alert-error" style={{ marginBottom: '15px' }}>⚠️ {erro}</div>}

        {loading ? (
          <p>⏳ Buscando espaços aguardando aprovação...</p>
        ) : espacosPendentes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p>🎉 Tudo limpo! Não há espaços pendentes de aprovação no momento.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Título do Espaço</th>
                  <th className="admin-th">Diária</th>
                  <th className="admin-th">Capacidade</th>
                  <th className="admin-th">Ações</th>
                </tr>
              </thead>
              <tbody>
                {espacosPendentes.map((espaco) => (
                  <tr key={espaco.id}>
                    <td className="admin-td">
                      <strong>{espaco.titulo}</strong>
                      <br/>
                      <small style={{ color: '#6c757d' }}>{espaco.endereco?.cidade} - {espaco.endereco?.estado}</small>
                    </td>
                    <td className="admin-td">
                      R$ {Number(espaco.valorDiaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="admin-td">{espaco.capacidadePessoas} pessoas</td>
                    <td className="admin-td action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-sm" 
                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none' }}
                        onClick={() => handleAprovar(espaco)}
                        disabled={processandoId === espaco.id}
                      >
                        {processandoId === espaco.id ? '⏳...' : '✔️ Aprovar'}
                      </button>
                      <button 
                        className="btn-sm" 
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                        onClick={() => handleRejeitar(espaco)}
                        disabled={processandoId === espaco.id}
                      >
                        {processandoId === espaco.id ? '⏳...' : '✖️ Rejeitar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}