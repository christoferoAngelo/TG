import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { IconeAdmin } from './AdminIcons';
import JellyRadio, { jellyTema } from '../ui/JellyRadio';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function ehAdmin(usuario) {
  return Boolean(usuario?.isAdmin || usuario?.admin);
}

function ehLocador(usuario) {
  return Boolean(usuario?.isLocador || usuario?.locador);
}

function ehLocatario(usuario) {
  return Boolean(usuario?.isLocatario || usuario?.locatario);
}

function perfilDe(usuario) {
  if (ehAdmin(usuario)) return 'Administrador';
  if (ehLocador(usuario) && ehLocatario(usuario)) return 'Locador e locatário';
  if (ehLocador(usuario)) return 'Locador';
  if (ehLocatario(usuario)) return 'Locatário';
  return 'Conta básica';
}

function formatarEndereco(endereco) {
  if (!endereco?.cep) return 'Não informado';
  const rua = [endereco.logradouro, endereco.numero && `Nº ${endereco.numero}`].filter(Boolean).join(', ');
  const cidade = [endereco.bairro, [endereco.cidade, endereco.estado].filter(Boolean).join('/')].filter(Boolean).join(', ');
  return `${rua}${endereco.complemento ? ` (${endereco.complemento})` : ''} — ${cidade} — CEP ${endereco.cep}`;
}

function textoBusca(usuario) {
  return [
    usuario.id,
    usuario.nome,
    usuario.name,
    usuario.email,
    usuario.telefone,
    usuario.endereco?.cidade,
    usuario.endereco?.bairro,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function UsuariosTab({ onVerDocumentos }) {
  const [usuarios, setUsuarios] = useState([]);
  const [aba, setAba] = useState('LOCADORES');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroExtra, setFiltroExtra] = useState('TODOS');
  const [ordenacao, setOrdenacao] = useState('NOME');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [usuarioDetalhe, setUsuarioDetalhe] = useState(null);
  const [pendenteExcluir, setPendenteExcluir] = useState(null);
  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const ADMIN_MASTER = 'locafesta.suporte@gmail.com';
  const ehMaster = (usuario) => (usuario?.email || '').toLowerCase() === ADMIN_MASTER;

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    setFiltroExtra('TODOS');
    setTermoBusca('');
  }, [aba]);

  const carregarUsuarios = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const dados = response.data;
      setUsuarios(Array.isArray(dados) ? dados : (dados.content || []));
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setErro('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const pedirExclusao = (usuario) => {
    setErro(null);
    setSucesso(null);
    if (ehMaster(usuario) || ehAdmin(usuario)) {
      setErro('Administradores não são gerenciados nesta tela.');
      return;
    }
    setMotivoExclusao('');
    setPendenteExcluir(usuario);
  };

  const confirmarExclusao = async () => {
    if (!pendenteExcluir) return;
    const motivo = motivoExclusao.trim();
    if (motivo.length < 10) {
      setErro('Informe o motivo da exclusão (mínimo 10 caracteres). Ele será enviado ao e-mail da conta.');
      return;
    }
    setExcluindo(true);
    setErro(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${pendenteExcluir.id}`, {
        data: { motivo },
        headers: { 'Content-Type': 'application/json' },
      });
      const email = pendenteExcluir.email;
      const nome = pendenteExcluir.nome || 'usuário';
      setUsuarios((prev) => prev.filter((u) => u.id !== pendenteExcluir.id));
      setPendenteExcluir(null);
      setMotivoExclusao('');
      setSucesso(`Conta de ${nome} excluída. Abrindo e-mail para notificar ${email}…`);
      const assunto = encodeURIComponent('Sua conta LocaFesta foi encerrada');
      const corpo = encodeURIComponent(
        `Olá${pendenteExcluir.nome ? `, ${pendenteExcluir.nome}` : ''},\n\n` +
        `Sua conta na LocaFesta foi excluída pela equipe de suporte.\n\n` +
        `Motivo:\n${motivo}\n\n` +
        `Se tiver dúvidas, responda este e-mail ou fale com locafesta.suporte@gmail.com.\n\n` +
        `Equipe LocaFesta`
      );
      window.open(`mailto:${email}?subject=${assunto}&body=${corpo}`, '_blank');
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Erro ao excluir usuário.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao excluir usuário.');
    } finally {
      setExcluindo(false);
    }
  };

  const usuariosSemAdmin = useMemo(
    () => usuarios.filter((u) => !ehAdmin(u)),
    [usuarios]
  );

  const contagem = useMemo(() => ({
    locadores: usuariosSemAdmin.filter(ehLocador).length,
    locatarios: usuariosSemAdmin.filter((u) => ehLocatario(u) && !ehLocador(u)).length,
  }), [usuariosSemAdmin]);

  const usuariosFiltrados = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    let lista = usuariosSemAdmin.filter((u) => {
      if (aba === 'LOCADORES') return ehLocador(u);
      return ehLocatario(u) && !ehLocador(u);
    });

    if (filtroExtra === 'DUPLO' && aba === 'LOCADORES') {
      lista = lista.filter((u) => ehLocatario(u));
    } else if (filtroExtra === 'SO_LOCADOR' && aba === 'LOCADORES') {
      lista = lista.filter((u) => !ehLocatario(u));
    } else if (filtroExtra === 'COM_TELEFONE') {
      lista = lista.filter((u) => Boolean(u.telefone));
    } else if (filtroExtra === 'SEM_TELEFONE') {
      lista = lista.filter((u) => !u.telefone);
    } else if (filtroExtra === 'COM_ENDERECO') {
      lista = lista.filter((u) => Boolean(u.endereco?.cep));
    } else if (filtroExtra === 'SEM_ENDERECO') {
      lista = lista.filter((u) => !u.endereco?.cep);
    }

    if (termo) {
      lista = lista.filter((u) => textoBusca(u).includes(termo));
    }

    const ordenada = [...lista];
    ordenada.sort((a, b) => {
      if (ordenacao === 'RECENTES') {
        const da = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
        const db = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
        return db - da;
      }
      if (ordenacao === 'ID') return Number(a.id) - Number(b.id);
      const na = (a.nome || a.name || a.email || '').toLowerCase();
      const nb = (b.nome || b.name || b.email || '').toLowerCase();
      return na.localeCompare(nb, 'pt-BR');
    });
    return ordenada;
  }, [usuariosSemAdmin, aba, filtroExtra, termoBusca, ordenacao]);

  return (
    <div className="content-box">
      <JellyRadio
        className="adm-abas"
        ariaLabel="Tipo de usuário"
        size="sm"
        items={[
          { value: 'LOCADORES', label: `Locadores (${contagem.locadores})` },
          { value: 'LOCATARIOS', label: `Locatários (${contagem.locatarios})` },
        ]}
        value={aba}
        onChange={setAba}
        {...jellyTema}
      />

      <div className="adm-toolbar adm-toolbar--usuarios">
        <label className="adm-busca">
          <IconeAdmin nome="busca" />
          <input
            type="search"
            placeholder="Buscar por nome, e-mail, telefone ou cidade"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            aria-label="Buscar usuários"
          />
        </label>

        <div className="adm-filtros-usuarios">
          <label>
            Filtro
            <select value={filtroExtra} onChange={(e) => setFiltroExtra(e.target.value)}>
              <option value="TODOS">Todos nesta aba</option>
              {aba === 'LOCADORES' && (
                <>
                  <option value="DUPLO">Também locatário</option>
                  <option value="SO_LOCADOR">Só locador</option>
                </>
              )}
              <option value="COM_TELEFONE">Com telefone</option>
              <option value="SEM_TELEFONE">Sem telefone</option>
              <option value="COM_ENDERECO">Com endereço</option>
              <option value="SEM_ENDERECO">Sem endereço</option>
            </select>
          </label>
          <label>
            Ordenar
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
              <option value="NOME">Nome</option>
              <option value="RECENTES">Cadastro recente</option>
              <option value="ID">ID</option>
            </select>
          </label>
          <button type="button" className="btn-sm" onClick={carregarUsuarios} disabled={loading}>
            Atualizar
          </button>
        </div>
      </div>

      <p className="adm-usuarios-contador" aria-live="polite">
        {loading
          ? 'Carregando…'
          : `${usuariosFiltrados.length} ${aba === 'LOCADORES' ? 'locador(es)' : 'locatário(s)'}`}
      </p>

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
                      <p>Ajuste a busca ou os filtros nesta aba.</p>
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
                      <span className={`badge ${ehLocador(u) ? 'badge-locador' : 'badge-locatario'}`}>
                        {perfilDe(u)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-sm btn-edit" onClick={() => setUsuarioDetalhe(u)}>
                          Ver dados
                        </button>
                        <button
                          type="button"
                          className="btn-sm"
                          onClick={() => onVerDocumentos?.(u)}
                        >
                          Documentos
                        </button>
                        <button type="button" className="btn-sm btn-delete" onClick={() => pedirExclusao(u)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {usuarioDetalhe && (
        <div className="modal-overlay" onClick={() => setUsuarioDetalhe(null)}>
          <div className="modal-content" onClick={(evento) => evento.stopPropagation()}>
            <h3>Dados do usuário</h3>
            <p className="modal-desc">Conta #{usuarioDetalhe.id} · somente leitura</p>
            <dl className="adm-user-dados">
              <div>
                <dt>Nome</dt>
                <dd>{usuarioDetalhe.nome || usuarioDetalhe.name || '—'}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{usuarioDetalhe.email || '—'}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{usuarioDetalhe.telefone || 'Não informado'}</dd>
              </div>
              <div>
                <dt>Perfil</dt>
                <dd>{perfilDe(usuarioDetalhe)}</dd>
              </div>
              <div>
                <dt>Endereço</dt>
                <dd>{formatarEndereco(usuarioDetalhe.endereco)}</dd>
              </div>
              <div>
                <dt>Cadastro</dt>
                <dd>
                  {usuarioDetalhe.dataCadastro
                    ? new Date(usuarioDetalhe.dataCadastro).toLocaleString('pt-BR')
                    : '—'}
                </dd>
              </div>
            </dl>
            <div className="adm-modal-acoes">
              <button type="button" className="btn btn-cancelar" onClick={() => setUsuarioDetalhe(null)}>
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-destaque"
                onClick={() => {
                  const alvo = usuarioDetalhe;
                  setUsuarioDetalhe(null);
                  onVerDocumentos?.(alvo);
                }}
              >
                Ver documentos
              </button>
            </div>
          </div>
        </div>
      )}

      {pendenteExcluir && (
        <div className="adm-confirm" role="dialog" aria-modal="true">
          <div className="adm-confirm-caixa">
            <h4>Excluir conta?</h4>
            <p>
              Remover “{pendenteExcluir.nome || pendenteExcluir.email}”. Informe o motivo —
              ele será enviado no e-mail cadastrado ({pendenteExcluir.email}).
            </p>
            <label className="adm-campo-grupo" htmlFor="adm-motivo-exclusao">
              Motivo da exclusão
              <textarea
                id="adm-motivo-exclusao"
                className="adm-campo"
                rows={4}
                maxLength={800}
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                placeholder="Explique por que a conta está sendo encerrada…"
              />
            </label>
            <div className="adm-confirm-acoes">
              <button
                type="button"
                className="btn"
                onClick={() => { setPendenteExcluir(null); setMotivoExclusao(''); }}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button type="button" className="btn btn-delete" onClick={confirmarExclusao} disabled={excluindo}>
                {excluindo ? 'Excluindo…' : 'Excluir e notificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
