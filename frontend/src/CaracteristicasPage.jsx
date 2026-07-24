import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard/Dashboard.css"; // Reaproveitando os estilos padrões

export default function CaracteristicasPage() {
    const navigate = useNavigate();
    const [caracteristicas, setCaracteristicas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [form, setForm] = useState({ nome: "", icone: "" });
    const [erro, setErro] = useState("");

    // Carregar lista de características
    const carregarCaracteristicas = async () => {
        setCarregando(true);
        try {
            const res = await fetch("http://localhost:8080/api/caracteristicas");
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
            const res = await fetch("http://localhost:8080/api/caracteristicas", {
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
            const res = await fetch(`http://localhost:8080/api/caracteristicas/${id}`, {
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
        <div className="dashboard">
            <header className="header">
                <h2 className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    LocaFesta - Características
                </h2>
                <button onClick={() => navigate(-1)} className="btn btn-cancelar">
                    Voltar
                </button>
            </header>

            <main className="main" style={{ maxWidth: "800px", margin: "20px auto" }}>
                <div className="card">
                    <h3 className="card-title">Cadastrar Nova Característica</h3>
                    {erro && <p style={{ color: "red", marginTop: "10px" }}>{erro}</p>}

                    <form onSubmit={handleSalvar} style={{ marginTop: "15px" }}>
                        <div className="form-row">
                            <div className="input-group flex-2">
                                <label>Nome da Característica:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Piscina, Wi-Fi, Estacionamento"
                                    value={form.nome}
                                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div className="input-group flex-1">
                                <label>Ícone (Opcional):</label>
                                <input
                                    type="text"
                                    placeholder="Ex: pool, wifi, local_parking"
                                    value={form.icone}
                                    onChange={(e) => setForm({ ...form, icone: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-destaque" style={{ marginTop: "10px" }}>
                            + Adicionar
                        </button>
                    </form>
                </div>

                <div className="card" style={{ marginTop: "20px" }}>
                    <h3 className="card-title">Características Cadastradas</h3>

                    {carregando ? (
                        <p className="data-line">Carregando...</p>
                    ) : caracteristicas.length === 0 ? (
                        <p className="data-line data-line-empty">Nenhuma característica cadastrada.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                            {caracteristicas.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 15px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "6px",
                                        border: "1px solid #eee"
                                    }}
                                >
                                    <div>
                                        <strong>{item.nome}</strong>
                                        {item.icone && (
                                            <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.85rem" }}>
                                                (ícone: {item.icone})
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleExcluir(item.id)}
                                        className="btn btn-cancelar"
                                        style={{ backgroundColor: "#dc3545", color: "#fff", padding: "4px 10px", fontSize: "0.85rem" }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}