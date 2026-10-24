import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { CardExplorar } from "../home/explorar/CardExplorar";
import SalvarLista from "../home/explorar/SalvarLista";
import { fotosDe } from "../home/explorar/explorar";
import {
    carregarListas,
    contemEspaco,
    criarLista,
    excluirLista,
    removerEspaco,
    renomearLista,
} from "./favoritosApi";
import "../home/HomeExplorar.css";
import "./Favoritos.css";

const API_BUSCA = "http://localhost:8080/api/locadores/espacos/busca";

export default function Favoritos() {
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();
    const [listas, setListas] = useState([]);
    const [espacos, setEspacos] = useState([]);
    const [abertaId, setAbertaId] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [nomeNova, setNomeNova] = useState("");
    const [criando, setCriando] = useState(false);
    const [editando, setEditando] = useState(false);
    const [nomeEdit, setNomeEdit] = useState("");
    const [confirmarApagar, setConfirmarApagar] = useState(false);
    const [salvandoEspaco, setSalvandoEspaco] = useState(null);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!usuarioLogado?.id) return undefined;
        let ativo = true;
        setCarregando(true);
        Promise.all([
            carregarListas(usuarioLogado.id),
            fetch(`${API_BUSCA}?q=`).then((res) => (res.ok ? res.json() : [])),
        ])
            .then(([listasSalvas, catalogo]) => {
                if (!ativo) return;
                setListas(Array.isArray(listasSalvas) ? listasSalvas : []);
                setEspacos(Array.isArray(catalogo) ? catalogo : []);
                setErro("");
            })
            .catch((falha) => {
                if (ativo) setErro(falha.message);
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [usuarioLogado?.id]);

    useEffect(() => {
        if (!aviso) return undefined;
        const timer = setTimeout(() => setAviso(""), 3200);
        return () => clearTimeout(timer);
    }, [aviso]);

    const aberta = listas.find((lista) => lista.id === abertaId) || null;
    const porId = useMemo(() => new Map(espacos.map((espaco) => [Number(espaco.id), espaco])), [espacos]);

    const criar = async (evento) => {
        evento.preventDefault();
        const limpo = nomeNova.trim();
        if (!limpo) {
            setErro("Dê um nome para a lista.");
            return;
        }
        setCriando(true);
        setErro("");
        try {
            const criada = await criarLista(usuarioLogado.id, limpo);
            setListas((atual) => [...atual, criada]);
            setNomeNova("");
            setAbertaId(criada.id);
            setAviso("Lista criada.");
        } catch (falha) {
            setErro(falha.message);
        } finally {
            setCriando(false);
        }
    };

    const salvarNome = async (evento) => {
        evento.preventDefault();
        const limpo = nomeEdit.trim();
        if (!limpo || !aberta) return;
        setErro("");
        try {
            const atualizada = await renomearLista(usuarioLogado.id, aberta.id, limpo);
            setListas((atual) => atual.map((lista) => (lista.id === atualizada.id ? atualizada : lista)));
            setEditando(false);
        } catch (falha) {
            setErro(falha.message);
        }
    };

    const apagar = async () => {
        if (!aberta) return;
        setErro("");
        try {
            await excluirLista(usuarioLogado.id, aberta.id);
            setListas((atual) => atual.filter((lista) => lista.id !== aberta.id));
            setAbertaId(null);
            setConfirmarApagar(false);
        } catch (falha) {
            setErro(falha.message);
        }
    };

    const tirar = async (espacoId) => {
        if (!aberta) return;
        setErro("");
        try {
            const atualizada = await removerEspaco(usuarioLogado.id, aberta.id, espacoId);
            setListas((atual) => atual.map((lista) => (lista.id === atualizada.id ? atualizada : lista)));
        } catch (falha) {
            setErro(falha.message);
        }
    };

    const capaDe = (lista) => {
        const primeiro = (lista.espacoIds || []).map((id) => porId.get(Number(id))).find(Boolean);
        return primeiro ? fotosDe(primeiro)[0]?.url : "";
    };

    return (
        <div className="fv">
            {!aberta ? (
                <>
                    <header className="fv-topo">
                        <div>
                            <h1>Favoritos</h1>
                            <p>Organize os espaços salvos em listas para comparar opções e retomar a escolha.</p>
                        </div>
                    </header>

                    <form className="fv-nova" onSubmit={criar}>
                        <label htmlFor="fv-nome">Nova lista</label>
                        <div>
                            <input
                                id="fv-nome"
                                value={nomeNova}
                                maxLength={80}
                                placeholder="Nome da lista"
                                onChange={(evento) => setNomeNova(evento.target.value)}
                            />
                            <button type="submit" className="fv-criar" disabled={criando}>
                                {criando && <span className="fv-spinner" aria-hidden="true" />}
                                {criando ? "Criando" : "Criar lista"}
                            </button>
                        </div>
                    </form>

                    {erro && <p className="fv-erro" role="alert">{erro}</p>}

                    {carregando ? (
                        <p className="fv-muted">Carregando suas listas…</p>
                    ) : listas.length === 0 && !erro ? (
                        <div className="fv-vazio">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z" />
                            </svg>
                            <strong>Nenhum espaço salvo</strong>
                            <p>As listas que você criar aparecem aqui. Comece escolhendo um espaço na busca.</p>
                            <button type="button" onClick={() => navigate("/home")}>Explorar espaços</button>
                        </div>
                    ) : listas.length === 0 ? null : (
                        <div className="fv-pastas">
                            {listas.map((lista) => {
                                const quantidade = lista.espacoIds?.length || 0;
                                const capa = capaDe(lista);
                                return (
                                    <button key={lista.id} type="button" className="fv-pasta" onClick={() => {
                                        setAbertaId(lista.id);
                                        setEditando(false);
                                        setConfirmarApagar(false);
                                        setErro("");
                                    }}>
                                        <span className="fv-capa">
                                            {capa ? <img src={capa} alt="" /> : <span>Sem foto</span>}
                                        </span>
                                        <strong>{lista.nome}</strong>
                                        <small>{quantidade === 1 ? "1 espaço" : `${quantidade} espaços`}</small>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button type="button" className="fv-voltar" onClick={() => setAbertaId(null)}>Todas as listas</button>
                    <header className="fv-topo">
                        <div>
                            {editando ? (
                                <form className="fv-renomear" onSubmit={salvarNome}>
                                    <input
                                        value={nomeEdit}
                                        maxLength={80}
                                        aria-label="Nome da lista"
                                        onChange={(evento) => setNomeEdit(evento.target.value)}
                                    />
                                    <button type="submit">Salvar</button>
                                    <button type="button" onClick={() => setEditando(false)}>Cancelar</button>
                                </form>
                            ) : (
                                <h1>{aberta.nome}</h1>
                            )}
                            <p>{(aberta.espacoIds?.length || 0) === 1 ? "1 espaço" : `${aberta.espacoIds?.length || 0} espaços`}</p>
                        </div>
                        {!editando && (
                            <div className="fv-acoes">
                                <button type="button" onClick={() => { setNomeEdit(aberta.nome); setEditando(true); }}>Renomear</button>
                                {confirmarApagar ? (
                                    <button type="button" className="fv-apagar" onClick={apagar}>Confirmar exclusão</button>
                                ) : (
                                    <button type="button" className="fv-apagar" onClick={() => setConfirmarApagar(true)}>Apagar lista</button>
                                )}
                            </div>
                        )}
                    </header>

                    {erro && <p className="fv-erro" role="alert">{erro}</p>}

                    {(aberta.espacoIds || []).length === 0 ? (
                        <p className="fv-vazio">Esta lista está vazia. Volte para a busca e salve um espaço nela.</p>
                    ) : (
                        <div className="hm-grade">
                            {(aberta.espacoIds || []).map((id) => {
                                const espaco = porId.get(Number(id));
                                if (!espaco) {
                                    return (
                                        <article key={id} className="fv-sumiu">
                                            <p>Este espaço não está mais na busca.</p>
                                            <button type="button" onClick={() => tirar(id)}>Tirar da lista</button>
                                        </article>
                                    );
                                }
                                return (
                                    <CardExplorar
                                        key={id}
                                        espaco={espaco}
                                        favorito
                                        onFavoritar={() => setSalvandoEspaco(espaco)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {aviso && (
                <p className="fv-toast" role="status">{aviso}</p>
            )}

            <SalvarLista
                espaco={salvandoEspaco}
                listas={listas}
                usuarioId={usuarioLogado?.id}
                onFechar={() => setSalvandoEspaco(null)}
                onListas={setListas}
            />
        </div>
    );
}
