import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./CadastroLocador.css";

export default function CadastroLocador() {
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [documento, setDocumento] = useState("");
    const [nomeFantasia, setNomeFantasia] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [perfilPronto, setPerfilPronto] = useState(null);

    const telefoneOk = Boolean(usuarioLogado?.telefone?.trim());
    const enderecoOk = Boolean(usuarioLogado?.endereco?.cep);

    useEffect(() => {
        if (!usuarioLogado?.id) return undefined;
        let ativo = true;
        fetch(`http://localhost:8080/api/locatarios/usuario/${usuarioLogado.id}`)
            .then((res) => {
                if (ativo) setPerfilPronto(res.ok && telefoneOk && enderecoOk);
            })
            .catch(() => {
                if (ativo) setPerfilPronto(false);
            });
        return () => {
            ativo = false;
        };
    }, [usuarioLogado, telefoneOk, enderecoOk]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        const payload = {
            documento: documento.replace(/\D/g, ""),
            nomeFantasia: nomeFantasia,
            usuarioId: usuarioLogado?.id,
        };

        try {
            const response = await fetch("http://localhost:8080/api/locadores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || "Erro ao processar cadastro.");
            }

            navigate("/perfil_locador");
        } catch (error) {
            setErro(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cl-page">
            <div className="cl-card">
                <h2 className="cl-titulo">Torne-se um anunciante</h2>
                <p className="cl-subtitulo">
                    Preencha os dados abaixo para começar a alugar seus espaços no LocaFesta.
                </p>

                {perfilPronto === null ? (
                    <p className="cl-subtitulo">Verificando seu cadastro…</p>
                ) : !perfilPronto ? (
                    <>
                        <p className="cl-subtitulo">
                            A conta de locador só abre depois do telefone, do CPF e do endereço.
                            Complete esses dados no perfil para publicar espaços, gerenciar reservas e ver relatórios.
                        </p>
                        <div className="cl-acoes">
                            <button type="button" className="cl-btn cl-btn--primario" onClick={() => navigate("/perfil")}>
                                Completar cadastro
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {erro && <div className="cl-erro" role="alert">{erro}</div>}

                        <form onSubmit={handleSubmit} className="cl-form">
                            <div className="cl-campo">
                                <label htmlFor="cl-doc">CPF ou CNPJ *</label>
                                <input
                                    id="cl-doc"
                                    type="text"
                                    required
                                    maxLength="18"
                                    placeholder="Apenas números"
                                    value={documento}
                                    onChange={(e) => setDocumento(e.target.value)}
                                />
                            </div>

                            <div className="cl-campo">
                                <label htmlFor="cl-fantasia">Nome fantasia da propriedade / empresa</label>
                                <input
                                    id="cl-fantasia"
                                    type="text"
                                    maxLength="150"
                                    placeholder="Ex: Chácara Recanto Feliz (opcional)"
                                    value={nomeFantasia}
                                    onChange={(e) => setNomeFantasia(e.target.value)}
                                />
                            </div>

                            <div className="cl-acoes">
                                <button type="button" className="cl-btn cl-btn--ghost" onClick={() => navigate("/perfil")}>
                                    Cancelar
                                </button>
                                <button type="submit" className="cl-btn cl-btn--primario" disabled={loading}>
                                    {loading ? "Salvando…" : "Confirmar cadastro"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
