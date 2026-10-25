import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CaracteristicasPage() {
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [form, setForm] = useState({ nome: "", icone: "" });
    const [erro, setErro] = useState("");

    // Carregar lista de características
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
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarCaracteristicas();
    }, []);

    // Salvar nova característica
    const handleSalvar = async (e) => {
        e.preventDefault();
        setErro("");

        try {
            const res = await fetch(`${API}/api/caracteristicas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Erro ao salvar característica.");
            }

            setForm({ nome: "", icone: "" });
            carregarCaracteristicas();
        } catch (err) {
            setErro(err.message);
        }
    };

    // Excluir característica
    const handleExcluir = async (id) => {
        if (!window.confirm("Deseja realmente excluir esta característica?")) return;

        try {
            const res = await fetch(`${API}/api/caracteristicas/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                carregarCaracteristicas();
            } else {
                alert("Erro ao excluir característica.");
            }
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    return (
        <div>
            <form className="content-box adm-carac-form" onSubmit={handleSalvar}>
                <h3>Nova característica</h3>
                <p className="section-description">O locador marca estes itens ao criar o anúncio.</p>
                {erro && <p className="error-message">{erro}</p>}
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
                        <label htmlFor="adm-carac-icone">Ícone (opcional)</label>
                        <input
                            id="adm-carac-icone"
                            className="adm-campo"
                            type="text"
                            maxLength={100}
                            placeholder="Ex.: pool, wifi"
                            value={form.icone}
                            onChange={(e) => setForm({ ...form, icone: e.target.value })}
                        />
                    </div>
                </div>
                <button type="submit" className="btn btn-destaque">Adicionar</button>
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
                                <div>
                                    <strong>{item.nome}</strong>
                                    {item.icone && <span>{item.icone}</span>}
                                </div>
                                <button type="button" className="btn-sm btn-delete" onClick={() => handleExcluir(item.id)}>
                                    Excluir
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}