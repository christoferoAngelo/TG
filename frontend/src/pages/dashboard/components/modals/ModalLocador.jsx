import React, { useState } from "react";

export default function ModalLocador({ usuarioLogado, onClose, onSuccess }) {
    const [formLocador, setFormLocador] = useState({ documento: "", nomeFantasia: "" });
    const [carregando, setCarregando] = useState(false);

    const handleSalvarLocador = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            const response = await fetch("http://localhost:8080/api/locadores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documento: formLocador.documento,
                    nomeFantasia: formLocador.nomeFantasia,
                    usuarioId: usuarioLogado.id
                })
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao cadastrar perfil de locador.");
            }

            alert("Perfil de Locador criado com sucesso!");
            onSuccess(); // Atualiza o usuário e fecha o modal
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Tornar-se um Anunciante (Locador)</h3>
                <p className="modal-desc">Informe os dados para disponibilizar seus espaços para locação.</p>

                <form onSubmit={handleSalvarLocador}>
                    <div className="input-group">
                        <label>CPF ou CNPJ do Anunciante:</label>
                        <input
                            type="text"
                            required
                            placeholder="000.000.000-00 ou 00.000.000/0001-00"
                            value={formLocador.documento}
                            onChange={(e) => setFormLocador({ ...formLocador, documento: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Nome Fantasia / Nome do Espaço:</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Espaço Festa & Cia"
                            value={formLocador.nomeFantasia}
                            onChange={(e) => setFormLocador({ ...formLocador, nomeFantasia: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-cancelar">Cancelar</button>
                        <button type="submit" disabled={carregando} className="btn btn-destaque">
                            {carregando ? "Salvando..." : "Confirmar e Anunciar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}