import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/locador/Modal";
import { adicionarEspaco, contemEspaco, criarLista, removerEspaco } from "../../favoritos/favoritosApi";
import "./SalvarLista.css";

export default function SalvarLista({ espaco, listas, usuarioId, onFechar, onListas }) {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [erro, setErro] = useState("");
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        setNome("");
        setErro("");
    }, [espaco?.id]);

    if (!espaco) return null;

    const entrar = () => {
        onFechar();
        navigate("/login");
    };

    const alternar = async (lista, marcado) => {
        setErro("");
        setOcupado(true);
        try {
            const atualizada = marcado
                ? await removerEspaco(usuarioId, lista.id, espaco.id)
                : await adicionarEspaco(usuarioId, lista.id, espaco.id);
            onListas((atual) => atual.map((item) => (item.id === atualizada.id ? atualizada : item)));
        } catch (falha) {
            setErro(falha.message);
        } finally {
            setOcupado(false);
        }
    };

    const criar = async (evento) => {
        evento.preventDefault();
        const limpo = nome.trim();
        if (!limpo) {
            setErro("Dê um nome para a lista.");
            return;
        }
        if (listas.some((lista) => lista.nome.localeCompare(limpo, "pt-BR", { sensitivity: "accent" }) === 0)) {
            setErro("Você já tem uma lista com esse nome.");
            return;
        }
        setErro("");
        setOcupado(true);
        try {
            const criada = await criarLista(usuarioId, limpo, espaco.id);
            onListas((atual) => [...atual, criada]);
            setNome("");
        } catch (falha) {
            setErro(falha.message);
        } finally {
            setOcupado(false);
        }
    };

    return (
        <Modal titulo="Salvar em uma lista" subtitulo={espaco.titulo} onClose={onFechar} tamanho="sm">
            {!usuarioId ? (
                <div className="sl-entrar">
                    <p>Entre na sua conta para guardar este espaço numa lista com o nome que você quiser.</p>
                    <button type="button" className="sl-btn sl-btn--cheio" onClick={entrar}>Entrar</button>
                </div>
            ) : (
                <div className="sl-corpo">
                    {listas.length > 0 && (
                        <ul className="sl-listas">
                            {listas.map((lista) => {
                                const marcado = contemEspaco(lista, espaco.id);
                                const quantidade = lista.espacoIds?.length || 0;
                                return (
                                    <li key={lista.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={marcado}
                                                disabled={ocupado}
                                                onChange={() => alternar(lista, marcado)}
                                            />
                                            <span>
                                                <strong>{lista.nome}</strong>
                                                <small>{quantidade === 1 ? "1 espaço" : `${quantidade} espaços`}</small>
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <form className="sl-nova" onSubmit={criar}>
                        <label htmlFor="sl-nome">Nova lista</label>
                        <div>
                            <input
                                id="sl-nome"
                                value={nome}
                                maxLength={80}
                                placeholder="Ex.: Chá de panela da Vivian"
                                onChange={(evento) => setNome(evento.target.value)}
                            />
                            <button type="submit" className="sl-btn sl-btn--cheio" disabled={ocupado}>
                                Criar
                            </button>
                        </div>
                    </form>
                    {erro && <p className="sl-erro" role="alert">{erro}</p>}
                </div>
            )}
        </Modal>
    );
}
