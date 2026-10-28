import React, { useEffect, useState } from "react";
import BotaoImagem from "../../components/ui/BotaoImagem";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function enviarIconeCloudinary(arquivo) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
        throw new Error("Upload de imagem não configurado.");
    }
    const body = new FormData();
    body.append("file", arquivo);
    body.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body
    });
    if (!res.ok) throw new Error("Não foi possível enviar o ícone.");
    const data = await res.json();
    if (!data.secure_url) throw new Error("Resposta inválida do serviço de imagens.");
    return data.secure_url;
}

const FORM_VAZIO = { id: null, nome: "", icone: "" };

export default function CaracteristicasPage() {
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [form, setForm] = useState(FORM_VAZIO);
    const [preview, setPreview] = useState("");
    const [arquivo, setArquivo] = useState(null);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [pendenteExcluir, setPendenteExcluir] = useState(null);

    const editando = form.id != null;

    const carregarCaracteristicas = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${API}/api/caracteristicas`);
            if (res.ok) {
                const data = await res.json();
                setCaracteristicas(data);
            }
        } catch (err) {
            console.error("Erro ao carregar características:", err);
            setErro("Não foi possível carregar as características.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarCaracteristicas();
    }, []);

    const limparFormulario = () => {
        setForm(FORM_VAZIO);
        setArquivo(null);
        setPreview("");
    };

    const aoEscolherArquivo = (evento) => {
        const escolhido = evento.target.files?.[0];
        evento.target.value = "";
        if (!escolhido) return;
        if (!escolhido.type.startsWith("image/")) {
            setErro("Envie um arquivo de imagem.");
            return;
        }
        setErro("");
        setArquivo(escolhido);
        setPreview(URL.createObjectURL(escolhido));
    };

    const comecarEdicao = (item) => {
        setErro("");
        setSucesso("");
        setArquivo(null);
        setForm({ id: item.id, nome: item.nome || "", icone: item.icone || "" });
        setPreview(item.icone || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSalvar = async (e) => {
        e.preventDefault();
        setErro("");
        setSucesso("");
        setEnviando(true);

        try {
            let icone = form.icone;
            if (arquivo) {
                icone = await enviarIconeCloudinary(arquivo);
            }

            const payload = { nome: form.nome.trim(), icone: icone || null };
            const url = editando
                ? `${API}/api/caracteristicas/${form.id}`
                : `${API}/api/caracteristicas`;
            const res = await fetch(url, {
                method: editando ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Erro ao salvar característica.");
            }

            limparFormulario();
            setSucesso(editando ? "Característica atualizada." : "Característica adicionada.");
            carregarCaracteristicas();
        } catch (err) {
            setErro(err.message || "Erro ao salvar característica.");
        } finally {
            setEnviando(false);
        }
    };

    const confirmarExclusao = async () => {
        if (!pendenteExcluir) return;
        setErro("");
        setSucesso("");
        try {
            const res = await fetch(`${API}/api/caracteristicas/${pendenteExcluir}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                throw new Error("Não foi possível excluir. Ela pode estar vinculada a um espaço.");
            }
            if (form.id === pendenteExcluir) limparFormulario();
            setSucesso("Característica excluída.");
            carregarCaracteristicas();
        } catch (err) {
            setErro(err.message || "Erro ao excluir característica.");
        } finally {
            setPendenteExcluir(null);
        }
    };

    return (
        <div>
            <form className="content-box adm-carac-form" onSubmit={handleSalvar}>
                <h3>{editando ? "Editar característica" : "Nova característica"}</h3>
                <p className="section-description">
                    {editando
                        ? "Ajuste o nome ou troque o ícone e salve."
                        : "O locador marca estes itens ao criar o anúncio."}
                </p>
                {erro && <p className="error-message" role="alert">{erro}</p>}
                {sucesso && <p className="adm-sucesso" role="status">{sucesso}</p>}
                <div className="adm-carac-campos">
                    <div className="adm-campo-grupo">
                        <label htmlFor="adm-carac-nome">Nome</label>
                        <input
                            id="adm-carac-nome"
                            className="adm-campo"
                            type="text"
                            required
                            maxLength={50}
                            placeholder="Ex.: Piscina, Wi-Fi, Estacionamento"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        />
                    </div>
                    <div className="adm-campo-grupo">
                        <span className="adm-campo-rotulo">Ícone</span>
                        <BotaoImagem
                            id="adm-carac-icone"
                            preview={preview || form.icone || ""}
                            rotulo="Adicionar imagem"
                            rotuloTroca="Trocar imagem"
                            dica="Ícone quadrado, fundo claro"
                            onChange={aoEscolherArquivo}
                        />
                    </div>
                </div>
                <div className="adm-carac-acoes">
                    <button type="submit" className="btn btn-destaque" disabled={enviando}>
                        {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar"}
                    </button>
                    {editando && (
                        <button type="button" className="btn btn-cancelar" onClick={limparFormulario}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <div className="content-box">
                <h3>Cadastradas</h3>
                {carregando ? (
                    <div className="adm-vazio"><p>Carregando…</p></div>
                ) : caracteristicas.length === 0 ? (
                    <div className="adm-vazio">
                        <strong>Nenhuma característica</strong>
                        <p>As que você adicionar aparecem para o locador.</p>
                    </div>
                ) : (
                    <ul className="adm-carac-lista">
                        {caracteristicas.map((item) => (
                            <li key={item.id}>
                                <div className="adm-carac-item">
                                    {item.icone ? (
                                        <img src={item.icone} alt="" className="adm-carac-ico" />
                                    ) : (
                                        <span className="adm-carac-ico adm-carac-ico--vazio" aria-hidden="true" />
                                    )}
                                    <strong>{item.nome}</strong>
                                </div>
                                <div className="action-buttons">
                                    <button
                                        type="button"
                                        className="btn-sm btn-edit"
                                        onClick={() => comecarEdicao(item)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-sm btn-delete"
                                        onClick={() => {
                                            setSucesso("");
                                            setErro("");
                                            setPendenteExcluir(item.id);
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {pendenteExcluir != null && (
                <div className="adm-confirm" role="dialog" aria-modal="true" aria-labelledby="adm-carac-confirm-titulo">
                    <div className="adm-confirm-caixa">
                        <h4 id="adm-carac-confirm-titulo">Excluir característica?</h4>
                        <p>Essa ação não pode ser desfeita.</p>
                        <div className="adm-confirm-acoes">
                            <button type="button" className="btn" onClick={() => setPendenteExcluir(null)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-delete" onClick={confirmarExclusao}>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
