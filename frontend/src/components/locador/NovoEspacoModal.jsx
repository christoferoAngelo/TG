import React, { useState } from "react";

export default function NovoEspacoModal({ onClose, onSalvar, carregando, caracteristicasDisponiveis }) {
    const estadoInicial = {
        titulo: "", descricao: "", valorDiaria: "", capacidadePessoas: "",
        restricoesHorario: "", horarioFechamento: "", caracteristicas: [],
        endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" },
        ambientes: [] // <--- Lista de ambientes estilo Airbnb
    };

    const [formEspaco, setFormEspaco] = useState(estadoInicial);
    const [uploadingImg, setUploadingImg] = useState(false);

    // Estado temporário para criar um novo ambiente antes de adicionar à lista
    const [novoAmbiente, setNovoAmbiente] = useState({
        titulo: "",
        descricao: "",
        arquivosImagens: [] // Arquivos locais selecionados para este ambiente
    });

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

    // Adiciona o cômodo configurado na lista de ambientes do espaço
    const handleAdicionarAmbiente = () => {
        if (!novoAmbiente.titulo.trim()) {
            alert("Informe o título do cômodo (Ex: Cozinha completa, Quarto 1).");
            return;
        }
        if (novoAmbiente.arquivosImagens.length === 0) {
            alert("Adicione pelo menos uma foto para este cômodo.");
            return;
        }

        setFormEspaco((prev) => ({
            ...prev,
            ambientes: [...prev.ambientes, novoAmbiente]
        }));

        // Limpa o form temporário do ambiente para cadastrar outro se quiser
        setNovoAmbiente({ titulo: "", descricao: "", arquivosImagens: [] });
    };

    // Remove um ambiente da lista
    const handleRemoverAmbiente = (index) => {
        setFormEspaco((prev) => ({
            ...prev,
            ambientes: prev.ambientes.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formEspaco.ambientes.length === 0) {
            alert("Adicione pelo menos um cômodo com fotos para o seu espaço.");
            return;
        }

        setUploadingImg(true);

        try {
            // Processa o upload de cada imagem de cada ambiente para o Cloudinary
            const ambientesProcessados = [];

            for (const amb of formEspaco.ambientes) {
                const urlsUrlsImagens = [];

                for (const arquivo of amb.arquivosImagens) {
                    const formData = new FormData();
                    formData.append("file", arquivo);
                    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

                    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                        method: "POST",
                        body: formData
                    });

                    const data = await res.json();
                    if (data.secure_url) {
                        urlsUrlsImagens.push(data.secure_url);
                    }
                }

                ambientesProcessados.push({
                    titulo: amb.titulo,
                    descricao: amb.descricao,
                    imagensUrls: urlsUrlsImagens
                });
            }

            setUploadingImg(false);

            // Envia para o backend a estrutura completa mapeada para o DTO
            onSalvar({
                ...formEspaco,
                ambientes: ambientesProcessados
            });

        } catch (err) {
            console.error("Erro no upload das imagens:", err);
            alert("Erro ao fazer upload das imagens para o Cloudinary. Tente novamente.");
            setUploadingImg(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
                <h3>Anunciar Novo Espaço (Estilo Airbnb)</h3>
                <p className="modal-desc">Organize seu espaço dividindo por cômodos e adicione fotos para cada um.</p>

                <form onSubmit={handleSubmit}>

                    {/* --- SEÇÃO DE CÔMODOS / AMBIENTES (ESTILO AIRBNB) --- */}
                    <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ddd" }}>
                        <h4 className="section-title-sm" style={{ marginTop: 0 }}>Adicionar Cômodos / Ambientes</h4>
                        
                        <div className="input-group">
                            <label>Nome do Cômodo / Ambiente:</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Cozinha completa, Quarto 1, Área Gourmet..."
                                value={novoAmbiente.titulo}
                                onChange={(e) => setNovoAmbiente({ ...novoAmbiente, titulo: e.target.value })}
                                className="input" 
                            />
                        </div>

                        <div className="input-group">
                            <label>Descrição do Cômodo (Opcional):</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Fogão, Forno, Freezer, Utensílios básicos..."
                                value={novoAmbiente.descricao}
                                onChange={(e) => setNovoAmbiente({ ...novoAmbiente, descricao: e.target.value })}
                                className="input" 
                            />
                        </div>

                        <div className="input-group">
                            <label>Fotos deste Cômodo:</label>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={(e) => setNovoAmbiente({ ...novoAmbiente, arquivosImagens: Array.from(e.target.files) })} 
                                className="input" 
                            />
                            {novoAmbiente.arquivosImagens.length > 0 && (
                                <p style={{ fontSize: "0.8rem", color: "green", marginTop: "5px" }}>
                                    {novoAmbiente.arquivosImagens.length} foto(s) selecionada(s) para este cômodo.
                                </p>
                            )}
                        </div>

                        <button type="button" onClick={handleAdicionarAmbiente} className="btn" style={{ background: "#333", color: "#fff", width: "100%", marginTop: "5px" }}>
                            + Incluir este Cômodo na Lista
                        </button>

                        {/* Listagem visual dos cômodos já adicionados */}
                        {formEspaco.ambientes.length > 0 && (
                            <div style={{ marginTop: "15px" }}>
                                <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Cômodos Adicionados:</label>
                                <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                                    {formEspaco.ambientes.map((amb, index) => (
                                        <li key={index} style={{ fontSize: "0.85rem", marginBottom: "5px" }}>
                                            <strong>{amb.titulo}</strong> ({amb.arquivosImagens.length} fotos) 
                                            <button type="button" onClick={() => handleRemoverAmbiente(index)} style={{ marginLeft: "10px", color: "red", border: "none", background: "none", cursor: "pointer" }}>[Remover]</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* --------------------------------------------------- */}

                    <div className="input-group">
                        <label>Título do Anúncio Principal:</label>
                        <input type="text" required placeholder="Ex: Sítio Recanto das Festas"
                            value={formEspaco.titulo} onChange={(e) => setFormEspaco({ ...formEspaco, titulo: e.target.value })}
                            className="input" />
                    </div>

                    <div className="input-group">
                        <label>Descrição Geral:</label>
                        <textarea required placeholder="Ex: Amplo espaço com verde, ideal para confraternizações."
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
                        <button type="button" onClick={onClose} className="btn btn-cancelar" disabled={uploadingImg || carregando}>Cancelar</button>
                        <button type="submit" disabled={uploadingImg || carregando} className="btn btn-destaque">
                            {uploadingImg ? "Enviando fotos..." : (carregando ? "Anunciando..." : "Salvar Anúncio")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}