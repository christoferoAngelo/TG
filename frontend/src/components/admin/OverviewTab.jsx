import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { IconeAdmin } from './AdminIcons';
import Counter from '../bits/Counter';
import GlideSelect from '../bits/GlideSelect';

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

  const parte = (numero) => ((numero / (metricas.totalUsuarios || 1)) * 100).toFixed(0);

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label" htmlFor="adm-periodo">Período</label>
          <GlideSelect
            id="adm-periodo"
            className="glide-select--bloco"
            ariaLabel="Período"
            size="lg"
            menuWidth={240}
            value={presetPeriodo}
            options={[
              { value: "30", label: "Últimos 30 dias" },
              { value: "60", label: "Últimos 60 dias" },
              { value: "90", label: "Últimos 90 dias" },
              { value: "all", label: "Todo o período" },
              { value: "custom", label: "Personalizado" }
            ]}
            onChange={setPresetPeriodo}
          />
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
            <strong>
              {loading ? "…" : (
                <Counter value={metricas.totalUsuarios} locale="pt-BR" fontSize={26} textColor="var(--color-text)" intro={false} fade={0} />
              )}
            </strong>
            <span>Total de usuários</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="espacos" /></span>
          <div>
            <strong>
              {loading ? "…" : (
                <Counter value={metricas.locadoresCount} locale="pt-BR" fontSize={26} textColor="var(--color-text)" intro={false} fade={0} />
              )}
            </strong>
            <span>Locadores</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="usuario" /></span>
          <div>
            <strong>
              {loading ? "…" : (
                <Counter value={metricas.locatariosCount} locale="pt-BR" fontSize={26} textColor="var(--color-text)" intro={false} fade={0} />
              )}
            </strong>
            <span>Locatários</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="novos" /></span>
          <div>
            <strong>
              {loading ? "…" : (
                <Counter value={metricas.novosNoPeriodo} locale="pt-BR" fontSize={26} textColor="var(--color-text)" intro={false} fade={0} />
              )}
            </strong>
            <span>Novos no período</span>
          </div>
        </article>
        <article className="adm-metrica">
          <span className="adm-metrica-ico"><IconeAdmin nome="ativos" /></span>
          <div>
            <strong>
              {loading ? "…" : (
                <Counter value={metricas.ativosNoPeriodo} locale="pt-BR" fontSize={26} textColor="var(--color-text)" intro={false} fade={0} />
              )}
            </strong>
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