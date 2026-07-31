import React, { useState } from "react";

export default function ModalEndereco({ usuarioLogado, onClose, onSuccess }) {
    const [formEndereco, setFormEndereco] = useState({
        cep: usuarioLogado?.endereco?.cep || "",
        logradouro: usuarioLogado?.endereco?.logradouro || "",
        numero: usuarioLogado?.endereco?.numero || "",
        complemento: usuarioLogado?.endereco?.complemento || "",
        bairro: usuarioLogado?.endereco?.bairro || "",
        cidade: usuarioLogado?.endereco?.cidade || "",
        estado: usuarioLogado?.endereco?.estado || ""
    });
    const [carregando, setCarregando] = useState(false);

    const handleSalvarEndereco = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            const response = await fetch(`http://localhost:8080/api/users/${usuarioLogado.id}/endereco`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formEndereco)
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro || "Erro ao salvar endereço.");
            }

            alert("Endereço salvo com sucesso!");
            onSuccess();
        } catch (err) {
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    const handleBuscarCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormEndereco(prev => ({
                        ...prev,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Endereço Residencial</h3>
                <p className="modal-desc">Seu endereço é utilizado para indicar opções de festa mais próximas.</p>

                <form onSubmit={handleSalvarEndereco}>
                    <div className="input-group">
                        <label>CEP:</label>
                        <input
                            type="text"
                            required
                            placeholder="00000-000"
                            value={formEndereco.cep}
                            onChange={(e) => {
                                setFormEndereco({ ...formEndereco, cep: e.target.value });
                                handleBuscarCep(e.target.value);
                            }}
                            className="input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-3">
                            <label>Rua/Avenida:</label>
                            <input type="text" required value={formEndereco.logradouro} onChange={(e) => setFormEndereco({ ...formEndereco, logradouro: e.target.value })} className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>Número:</label>
                            <input type="text" required value={formEndereco.numero} onChange={(e) => setFormEndereco({ ...formEndereco, numero: e.target.value })} className="input" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Complemento (Opcional):</label>
                        <input type="text" placeholder="Apto, Bloco..." value={formEndereco.complemento} onChange={(e) => setFormEndereco({ ...formEndereco, complemento: e.target.value })} className="input" />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-2">
                            <label>Bairro:</label>
                            <input type="text" required value={formEndereco.bairro} onChange={(e) => setFormEndereco({ ...formEndereco, bairro: e.target.value })} className="input" />
                        </div>
                        <div className="input-group flex-2">
                            <label>Cidade:</label>
                            <input type="text" required value={formEndereco.cidade} onChange={(e) => setFormEndereco({ ...formEndereco, cidade: e.target.value })} className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>UF:</label>
                            <input type="text" required maxLength={2} placeholder="SP" value={formEndereco.estado} onChange={(e) => setFormEndereco({ ...formEndereco, estado: e.target.value.toUpperCase() })} className="input" />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-cancelar">Cancelar</button>
                        <button type="submit" disabled={carregando} className="btn btn-destaque">
                            {carregando ? "Guardando..." : "Salvar Endereço"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}