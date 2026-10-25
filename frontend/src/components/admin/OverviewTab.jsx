import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { IconeAdmin } from './AdminIcons';

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

  const valor = (numero) => (loading ? "…" : numero);
  const parte = (numero) => ((numero / (metricas.totalUsuarios || 1)) * 100).toFixed(0);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label" htmlFor="adm-periodo">Período</label>
          <select
            id="adm-periodo"
            value={presetPeriodo}
            onChange={(e) => setPresetPeriodo(e.target.value)}
            className="select-input"
          >
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="adm-de">De</label>
          <input
            id="adm-de"
            type="date"
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); setPresetPeriodo('custom'); }}
            className="date-input"
          />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="adm-ate">Até</label>
          <input
            id="adm-ate"
            type="date"
            value={dataFim}
            onChange={(e) => { setDataFim(e.target.value); setPresetPeriodo('custom'); }}
            className="date-input"
          />
        </div>
      </div>

      <div className="adm-metricas">
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="usuarios" /></span>
          <div>
            <strong>{valor(metricas.totalUsuarios)}</strong>
            <span>Total de usuários</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="espacos" /></span>
          <div>
            <strong>{valor(metricas.locadoresCount)}</strong>
            <span>Locadores</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="usuario" /></span>
          <div>
            <strong>{valor(metricas.locatariosCount)}</strong>
            <span>Locatários</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="novos" /></span>
          <div>
            <strong>{valor(metricas.novosNoPeriodo)}</strong>
            <span>Novos no período</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="ativos" /></span>
          <div>
            <strong>{valor(metricas.ativosNoPeriodo)}</strong>
            <span>Ativos no período</span>
          </div>
        </article>
      </div>

      <div className="content-box">
        <h3>Composição das contas</h3>
        <div className="adm-composicao">
          <div className="adm-linha">
            <span>Locadores</span>
            <strong>{metricas.locadoresCount} · {parte(metricas.locadoresCount)}%</strong>
          </div>
          <div className="adm-linha">
            <span>Locatários</span>
            <strong>{metricas.locatariosCount} · {parte(metricas.locatariosCount)}%</strong>
          </div>
          <div className="adm-linha">
            <span>Administradores</span>
            <strong>{metricas.adminsCount}</strong>
          </div>
        </div>
        {erro && <p className="error-message">{erro}</p>}
      </div>
    </div>
  );
}