import React, { useState } from "react";

export default function NovoEspacoModal({ onClose, onSalvar, carregando, caracteristicasDisponiveis }) {
    const estadoInicial = {
        titulo: "", descricao: "", valorDiaria: "", capacidadePessoas: "",
        restricoesHorario: "", horarioFechamento: "", caracteristicas: [],
        endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" }
    };

    const [formEspaco, setFormEspaco] = useState(estadoInicial);

    const handleToggleCaracteristica = (item) => {
        setFormEspaco((prev) => {
            const jaExiste = prev.caracteristicas.some((c) => c.id === item.id);
            if (jaExiste) {
                return { ...prev, caracteristicas: prev.caracteristicas.filter((c) => c.id !== item.id) };
            }
            return { ...prev, caracteristicas: [...prev.caracteristicas, item] };
        });
    };

    const handleEnderecoChange = (campo, valor) => {
        setFormEspaco((prev) => ({
            ...prev,
            endereco: { ...prev.endereco, [campo]: valor }
        }));
    };

    const handleBuscarCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormEspaco((prev) => ({
                        ...prev,
                        endereco: {
                            ...prev.endereco,
                            logradouro: data.logradouro || "",
                            bairro: data.bairro || "",
                            cidade: data.localidade || "",
                            estado: data.uf || ""
                        }
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSalvar(formEspaco);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                <h3>Anunciar Novo Espaço</h3>
                <p className="modal-desc">Preencha as informações do seu espaço para eventos.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Título do Anúncio:</label>
                        <input type="text" required placeholder="Ex: Salão de Festas Recanto"
                            value={formEspaco.titulo} onChange={(e) => setFormEspaco({ ...formEspaco, titulo: e.target.value })}
                            className="input" />
                    </div>

                    <div className="input-group">
                        <label>Descrição:</label>
                        <textarea required placeholder="Ex: Espaço amplo com piscina e churrasqueira"
                            value={formEspaco.descricao} onChange={(e) => setFormEspaco({ ...formEspaco, descricao: e.target.value })}
                            className="input" rows="3" />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-1">
                            <label>Capacidade (Pessoas):</label>
                            <input type="number" required placeholder="100"
                                value={formEspaco.capacidadePessoas} onChange={(e) => setFormEspaco({ ...formEspaco, capacidadePessoas: e.target.value })}
                                className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>Valor Diária (R$):</label>
                            <input type="number" required step="0.01" placeholder="800.00"
                                value={formEspaco.valorDiaria} onChange={(e) => setFormEspaco({ ...formEspaco, valorDiaria: e.target.value })}
                                className="input" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-1">
                            <label>Horário de Fechamento:</label>
                            <input type="text" placeholder="Ex: 22:00"
                                value={formEspaco.horarioFechamento} onChange={(e) => setFormEspaco({ ...formEspaco, horarioFechamento: e.target.value })}
                                className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>Restrições de Horário:</label>
                            <input type="text" placeholder="Ex: Som alto até as 20h"
                                value={formEspaco.restricoesHorario} onChange={(e) => setFormEspaco({ ...formEspaco, restricoesHorario: e.target.value })}
                                className="input" />
                        </div>
                    </div>

                    <hr className="divisor mt-15" />
                    <h4 className="section-title-sm">Características do Espaço</h4>

                    {caracteristicasDisponiveis.length === 0 ? (
                        <p style={{ fontSize: "0.85rem", color: "#666" }}>Nenhuma característica cadastrada no sistema.</p>
                    ) : (
                        <div className="caracteristicas-grid">
                            {caracteristicasDisponiveis.map((item) => {
                                const selecionado = formEspaco.caracteristicas.some((c) => c.id === item.id);
                                return (
                                    <label key={item.id} className={`caracteristica-label ${selecionado ? "selecionado" : ""}`}>
                                        <input type="checkbox" checked={selecionado} onChange={() => handleToggleCaracteristica(item)} />
                                        {item.nome}
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    <hr className="divisor mt-15" />
                    <h4 className="section-title-sm">Localização do Espaço</h4>

                    <div className="input-group">
                        <label>CEP:</label>
                        <input type="text" required placeholder="00000-000"
                            value={formEspaco.endereco.cep}
                            onChange={(e) => {
                                handleEnderecoChange("cep", e.target.value);
                                handleBuscarCep(e.target.value);
                            }}
                            className="input" />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-3">
                            <label>Rua/Avenida:</label>
                            <input type="text" required value={formEspaco.endereco.logradouro}
                                onChange={(e) => handleEnderecoChange("logradouro", e.target.value)} className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>Número:</label>
                            <input type="text" required value={formEspaco.endereco.numero}
                                onChange={(e) => handleEnderecoChange("numero", e.target.value)} className="input" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Complemento (Opcional):</label>
                        <input type="text" placeholder="Salão 2, Bloco B..." value={formEspaco.endereco.complemento}
                            onChange={(e) => handleEnderecoChange("complemento", e.target.value)} className="input" />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-2">
                            <label>Bairro:</label>
                            <input type="text" required value={formEspaco.endereco.bairro}
                                onChange={(e) => handleEnderecoChange("bairro", e.target.value)} className="input" />
                        </div>
                        <div className="input-group flex-2">
                            <label>Cidade:</label>
                            <input type="text" required value={formEspaco.endereco.cidade}
                                onChange={(e) => handleEnderecoChange("cidade", e.target.value)} className="input" />
                        </div>
                        <div className="input-group flex-1">
                            <label>UF:</label>
                            <input type="text" required maxLength={2} placeholder="SP" value={formEspaco.endereco.estado}
                                onChange={(e) => handleEnderecoChange("estado", e.target.value.toUpperCase())} className="input" />
                        </div>
                    </div>

                    <div className="modal-actions mt-15">
                        <button type="button" onClick={onClose} className="btn btn-cancelar">Cancelar</button>
                        <button type="submit" disabled={carregando} className="btn btn-destaque">
                            {carregando ? "Anunciando..." : "Salvar Anúncio"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}