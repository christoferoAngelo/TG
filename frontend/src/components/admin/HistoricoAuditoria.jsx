import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HistoricoAuditoria.css'; // Ou Tailwind CSS se preferir

export default function HistoricoAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const tamanhoPagina = 10;

  useEffect(() => {
    carregarLogs(pagina);
  }, [pagina]);

  const carregarLogs = async (page) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/logs-auditoria?pagina=${page}&tamanho=${tamanhoPagina}`
      );
      
      setLogs(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para formatar a data ISO em formato legível
  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper para estilizar as badges por tipo de ação
  const renderBadgeAcao = (acao) => {
    let classe = 'badge-default';
    let label = acao;

    if (acao.includes('EXCLUIR') || acao.includes('DELETAR')) {
      classe = 'badge-danger';
    } else if (acao.includes('CADASTRAR') || acao.includes('CRIAR')) {
      classe = 'badge-success';
    } else if (acao.includes('ATUALIZAR') || acao.includes('EDITAR')) {
      classe = 'badge-warning';
    }

    return <span className={`badge ${classe}`}>{label}</span>;
  };

  return (
    <div className="auditoria-container">
      <div className="auditoria-header">
        <div>
          <h2>Histórico de Auditoria</h2>
          <p>Rastreamento de ações administrativas realizadas no sistema</p>
        </div>
        <div className="auditoria-counter">
          Total de registros: <strong>{totalElements}</strong>
        </div>
      </div>

      {loading ? (
        <div className="auditoria-loading">
          <p>Carregando histórico...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="auditoria-empty">
          <p>Nenhum registro de auditoria encontrado.</p>
        </div>
      ) : (
        <>
          <div className="tabela-responsive">
            <table className="tabela-auditoria">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Administrador</th>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>ID Afetado</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="col-data">{formatarData(log.dataHora)}</td>
                    <td>
                      <strong>{log.adminNome || 'Sistema'}</strong>
                      <small className="admin-id"> (ID: {log.adminId})</small>
                    </td>
                    <td>{renderBadgeAcao(log.acao)}</td>
                    <td><span className="entidade-tag">{log.tipoEntidade}</span></td>
                    <td><code>#{log.idEntidade}</code></td>
                    <td className="col-detalhes">{log.detalhes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="paginacao-container">
            <button
              className="btn-paginacao"
              disabled={pagina === 0}
              onClick={() => setPagina((prev) => prev - 1)}
            >
              &laquo; Anterior
            </button>

            <span className="info-pagina">
              Página <strong>{pagina + 1}</strong> de <strong>{totalPages || 1}</strong>
            </span>

            <button
              className="btn-paginacao"
              disabled={pagina + 1 >= totalPages}
              onClick={() => setPagina((prev) => prev + 1)}
            >
              Próxima &raquo;
            </button>
          </div>
        </>
      )}
    </div>
  );
}