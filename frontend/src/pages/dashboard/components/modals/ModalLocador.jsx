import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CODIGO_TERMOS_NAO_ACEITOS, apiFetch, parseJsonSeguro } from "../../../../services/http";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ModalLocador({ usuarioLogado, onClose, onSuccess }) {
    const navigate = useNavigate();
    const [formLocador, setFormLocador] = useState({ documento: "", nomeFantasia: "" });
    const [carregando, setCarregando] = useState(false);

    const irAceitarLocador = () => {
        const voltar = encodeURIComponent("/perfil");
        navigate(`/aceitar-termos?tipo=LOCADOR&voltar=${voltar}`);
        onClose?.();
    };

    const handleSalvarLocador = async (e) => {
        e.preventDefault();
        setCarregando(true);
        try {
            const response = await apiFetch(`${API}/api/locadores`, {
                method: "POST",
                body: JSON.stringify({
                    documento: formLocador.documento,
                    nomeFantasia: formLocador.nomeFantasia,
                    usuarioId: usuarioLogado.id,
                }),
            });

            const corpo = await parseJsonSeguro(response);
            if (!response.ok) {
                if (corpo?.codigo === CODIGO_TERMOS_NAO_ACEITOS) {
                    irAceitarLocador();
                    return;
                }
                throw new Error(corpo?.erro || corpo || "Falha ao cadastrar perfil de locador.");
            }

            alert("Perfil de Locador criado com sucesso!");
            onSuccess();
        } catch (err) {
            if (err?.codigo === CODIGO_TERMOS_NAO_ACEITOS) {
                irAceitarLocador();
                return;
            }
            alert("Erro: " + err.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Tornar-se um Anunciante (Locador)</h3>
                <p className="modal-desc">
                    Informe os dados para disponibilizar seus espaços. Antes de confirmar, é necessário
                    aceitar os Termos de Uso do locador.
                </p>

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
                        <button type="button" onClick={onClose} className="btn btn-cancelar">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={irAceitarLocador}
                        >
                            Ler Termos do locador
                        </button>
                        <button type="submit" disabled={carregando} className="btn btn-destaque">
                            {carregando ? "Salvando..." : "Confirmar e Anunciar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
