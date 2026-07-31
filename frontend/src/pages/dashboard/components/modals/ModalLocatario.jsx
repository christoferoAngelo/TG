import React, { useState } from "react";

export default function ModalLocatario({ usuarioLogado, onClose, onSuccess, setPerfilLocatario }) {
    const [formLocatario, setFormLocatario] = useState({ 
        cpf: "", 
        telefone: usuarioLogado?.telefone || "" 
    });
    const [carregando, setCarregando] = useState(false);

    const handleSalvarLocatario = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            if (formLocatario.telefone !== usuarioLogado?.telefone) {
                await fetch(`http://localhost:8080/api/users/${usuarioLogado.id}/telefone`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ telefone: formLocatario.telefone })
                });
            }

            const response = await fetch("http://localhost:8080/api/locatarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cpf: formLocatario.cpf,
                    usuarioId: usuarioLogado.id
                })
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Falha ao cadastrar perfil de locatário.");
            }

            const novoPerfil = await response.json();
            setPerfilLocatario(novoPerfil);

            alert("Conta de locatário criada com sucesso!");
            onSuccess();
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Completar Cadastro de Locatário</h3>
                <p className="modal-desc">Informe seu CPF e telefone de contato para poder alugar espaços e salões na plataforma.</p>

                <form onSubmit={handleSalvarLocatario}>
                    <div className="input-group">
                        <label>CPF:</label>
                        <input
                            type="text"
                            required
                            placeholder="000.000.000-00"
                            value={formLocatario.cpf}
                            onChange={(e) => setFormLocatario({ ...formLocatario, cpf: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div className="input-group">
                        <label>Telefone / WhatsApp:</label>
                        <input
                            type="text"
                            required
                            placeholder="(00) 00000-0000"
                            value={formLocatario.telefone}
                            onChange={(e) => setFormLocatario({ ...formLocatario, telefone: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-cancelar">Cancelar</button>
                        <button type="submit" disabled={carregando} className="btn btn-destaque">
                            {carregando ? "Salvando..." : "Concluir Cadastro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}