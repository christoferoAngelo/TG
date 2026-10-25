import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DetalheEspacoModal from './DetalheEspacoModal';
import JellyRadio, { jellyTema } from '../ui/JellyRadio';
import './EspacosTab.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function EspacosTab() {
  // --------------------------------------------------------------------------
  // ESTADOS
  // --------------------------------------------------------------------------
  const [espacos, setEspacos] = useState([]);
  const [statusAba, setStatusAba] = useState('PENDENTE'); // 'PENDENTE', 'APROVADO', 'REJEITADO'
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);

  // Estados do Modal de Rejeição
  const [modalRejeitarAberto, setModalRejeitarAberto] = useState(false);
  const [espacoSelecionado, setEspacoSelecionado] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  // --------------------------------------------------------------------------
  // EFEITOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    carregarEspacos(statusAba);
  }, [statusAba]);

  const carregarEspacos = async (status) => {
    setLoading(true);
    setMensagem(null);
    setErro(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/espacos`, {
        params: { status }
      });
      setEspacos(response.data);
    } catch (err) {
      console.error(`Erro ao carregar espaços (${status}):`, err);
      setErro("Não foi possível carregar a lista de espaços.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS (AÇÕES)
  // --------------------------------------------------------------------------
  const handleAprovar = async (espaco) => {
    const confirmar = window.confirm(`Tem certeza que deseja APROVAR o espaço "${espaco.titulo}"?`);
    if (!confirmar) return "cancelado";

    setProcessandoId(espaco.id);
    setMensagem(null);
    setErro(null);

    try {
      await axios.patch(`${API_BASE_URL}/api/admin/espacos/${espaco.id}/aprovar`);
      setMensagem(`Espaço "${espaco.titulo}" aprovado.`);
      carregarEspacos(statusAba);
      return "ok";
    } catch (err) {
      console.error("Erro ao aprovar espaço:", err);
      setErro("Erro ao aprovar o espaço. Verifique se o backend está rodando.");
      return "erro";
    } finally {
      setProcessandoId(null);
    }
  };

  // Abre o modal e guarda o espaço selecionado
  const handleAbrirModalRejeitar = (espaco) => {
    setDetalhe(null);
    setEspacoSelecionado(espaco);
    setMotivoRejeicao('');
    setModalRejeitarAberto(true);
  };

  const abrirDetalhe = async (espaco) => {
    setDetalhe({ espaco, carregando: true, erro: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/locadores/espacos/${espaco.id}`);
      setDetalhe({ espaco: response.data, carregando: false, erro: null });
    } catch (err) {
      console.error("Erro ao carregar detalhes do espaço:", err);
      setDetalhe({
        espaco,
        carregando: false,
        erro: "Não foi possível atualizar os dados. Mostrando o que já estava na lista.",
      });
    }
  };

  // Executa o envio da rejeição via API ao confirmar no Modal
  const handleConfirmarRejeicao = async () => {
    if (!motivoRejeicao.trim()) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }

    setProcessandoId(espacoSelecionado.id);
    setMensagem(null);
    setErro(null);

    try {
      await axios.patch(`${API_BASE_URL}/api/admin/espacos/${espacoSelecionado.id}/rejeitar`, { 
        motivo: motivoRejeicao.trim() 
      });

      setMensagem(`Espaço "${espacoSelecionado.titulo}" rejeitado.`);
      setModalRejeitarAberto(false);
      carregarEspacos(statusAba);
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
        <JellyRadio
          className="adm-abas"
          ariaLabel="Situação dos espaços"
          size="sm"
          items={[
            { value: 'PENDENTE', label: 'Pendentes' },
            { value: 'APROVADO', label: 'Aprovados' },
            { value: 'REJEITADO', label: 'Recusados' },
          ]}
          value={statusAba}
          onChange={setStatusAba}
          {...jellyTema}
        />

        {mensagem && <div className="alert-success">{mensagem}</div>}
        {erro && <div className="alert-error">{erro}</div>}

        {loading ? (
          <div className="adm-vazio"><p>Buscando espaços…</p></div>
        ) : espacos.length === 0 ? (
          <div className="empty-state-box">
            <strong>Nenhum espaço nesta lista</strong>
            <p>Não há anúncios com a situação {statusAba.toLowerCase()}.</p>
          </div>
        ) : (
          <div className="table-responsive">
<table className="admin-table">
  <thead>
    <tr>
      <th className="admin-th">Título do Espaço</th>
      <th className="admin-th">Diária</th>
      <th className="admin-th">Capacidade</th>
      
      {/* Colunas condicionais conforme a aba ativa */}
      {statusAba === 'REJEITADO' && <th className="admin-th">Motivo da Rejeição</th>}
      {statusAba === 'PENDENTE' && <th className="admin-th">Mensagem do Locador</th>}
      
      <th className="admin-th">Ações</th>
    </tr>
  </thead>
  <tbody>
    {espacos.map((espaco) => (
      <tr key={espaco.id}>
        <td className="admin-td">
          <button type="button" className="adm-ver" onClick={() => abrirDetalhe(espaco)}>
            {espaco.titulo}
          </button>
          
          {/* Badge limpa usando a classe .badge-reenviado */}
          {espaco.reenviado && (
            <span className="badge-reenviado">Reenviado</span>
          )}
          
          <br/>
          <small className="text-muted">
            {espaco.endereco?.cidade} - {espaco.endereco?.estado}
          </small>
        </td>
        <td className="admin-td">
          R$ {Number(espaco.valorDiaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </td>
        <td className="admin-td">{espaco.capacidadePessoas} pessoas</td>
        
        {/* Célula do motivo da rejeição */}
        {statusAba === 'REJEITADO' && (
          <td className="admin-td motivo-rejeicao">
            {espaco.motivoRejeicao || 'Sem motivo especificado.'}
          </td>
        )}

        {/* Célula da mensagem/resposta do locador */}
        {statusAba === 'PENDENTE' && (
          <td className="admin-td resposta-locador">
            {espaco.respostaLocador ? (
              <span>"{espaco.respostaLocador}"</span>
            ) : (
              <span className="text-muted">Nenhuma mensagem.</span>
            )}
          </td>
        )}

        <td className="admin-td action-buttons">
          <button type="button" className="btn-sm" onClick={() => abrirDetalhe(espaco)}>
            Ver detalhes
          </button>
          {statusAba !== 'APROVADO' && (
            <button 
              className="btn-sm btn-approve" 
              onClick={() => handleAprovar(espaco)}
              disabled={processandoId === espaco.id}
            >
              {processandoId === espaco.id ? 'Salvando…' : 'Aprovar'}
            </button>
          )}

          {statusAba !== 'REJEITADO' && (
            <button 
              className="btn-sm btn-reject" 
              onClick={() => handleAbrirModalRejeitar(espaco)}
              disabled={processandoId === espaco.id}
            >
              {processandoId === espaco.id ? 'Salvando…' : 'Recusar'}
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
          </div>
        )}
      </div>

      {detalhe && (
        <DetalheEspacoModal
          espaco={detalhe.espaco}
          carregando={detalhe.carregando}
          erro={detalhe.erro}
          processando={processandoId === detalhe.espaco?.id}
          onFechar={() => setDetalhe(null)}
          onAprovar={async (espaco) => {
            const resultado = await handleAprovar(espaco);
            if (resultado !== "cancelado") setDetalhe(null);
          }}
          onRecusar={handleAbrirModalRejeitar}
        />
      )}

      {/* MODAL DE REJEIÇÃO */}
      {modalRejeitarAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Rejeição</h3>
            <p>Informe o motivo da rejeição do espaço <strong>"{espacoSelecionado?.titulo}"</strong>:</p>
            
            <textarea
              className="adm-campo"
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              maxLength={500}
              placeholder="Descreva o que precisa mudar"
              rows={4}
            />

            <div className="adm-modal-acoes">
              <button
                type="button"
                className="btn btn-cancelar"
                onClick={() => setModalRejeitarAberto(false)}
                disabled={processandoId !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-reject"
                onClick={handleConfirmarRejeicao}
                disabled={processandoId !== null}
              >
                {processandoId !== null ? 'Salvando…' : 'Confirmar recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}