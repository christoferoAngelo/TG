import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OverviewTab() {
  // Estados de Filtro
  const [presetPeriodo, setPresetPeriodo] = useState('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estados de Dados e Carregamento
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

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

  // Carrega os usuários para cálculo dos relatórios
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
      console.error("Erro ao carregar dados do overview:", err);
      setErro("Não foi possível carregar os dados métricos.");
    } finally {
      setLoading(false);
    }
  };

  // Cálculo memoizado de métricas
  const metricas = useMemo(() => {
    const usuariosComuns = usuarios.filter(u => !(u.isAdmin || u.admin));
    const totalUsuarios = usuariosComuns.length;

    const locadoresCount = usuarios.filter(u => u.isLocador || u.locador).length;
    const locatariosCount = usuarios.filter(u => u.isLocatario || u.locatario).length;
    const adminsCount = usuarios.filter(u => u.admin || u.isAdmin).length;

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

  return (
    <div>
      {/* BARRA DE FILTROS */}
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

      {/* CARDS DE MÉTRICAS */}
      <div className="grid-cards">
        <div className="card">
          <span className="card-icon">👥</span>
          <div>
            <h3 className="card-value">{loading ? '...' : metricas.totalUsuarios}</h3>
            <p className="card-label">Total de Usuários</p>
          </div>
        </div>
        <div className="card card-blue">
          <span className="card-icon">🏡</span>
          <div>
            <h3 className="card-value">{loading ? '...' : metricas.locadoresCount}</h3>
            <p className="card-label">Locadores</p>
          </div>
        </div>
        <div className="card card-green">
          <span className="card-icon">🎉</span>
          <div>
            <h3 className="card-value">{loading ? '...' : metricas.locatariosCount}</h3>
            <p className="card-label">Locatários</p>
          </div>
        </div>
        <div className="card card-yellow">
          <span className="card-icon">🆕</span>
          <div>
            <h3 className="card-value">{loading ? '...' : metricas.novosNoPeriodo}</h3>
            <p className="card-label">Novos no Período</p>
          </div>
        </div>
        <div className="card card-purple">
          <span className="card-icon">⚡</span>
          <div>
            <h3 className="card-value">{loading ? '...' : metricas.ativosNoPeriodo}</h3>
            <p className="card-label">Ativos no Período</p>
          </div>
        </div>
      </div>

      {/* PAINEL RESUMO */}
      <div className="content-box">
        <h3>Resumo Geral do Sistema</h3>
        <p>• <strong>Locadores:</strong> {metricas.locadoresCount} ({((metricas.locadoresCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
        <p>• <strong>Locatários:</strong> {metricas.locatariosCount} ({((metricas.locatariosCount / (metricas.totalUsuarios || 1)) * 100).toFixed(0)}% do total)</p>
        <p>• <strong>Administradores:</strong> {metricas.adminsCount}</p>
        {erro && <p className="error-message">⚠️ {erro}</p>}
      </div>
    </div>
  );
}