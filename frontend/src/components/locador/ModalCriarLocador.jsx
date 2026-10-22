import React, { useRef, useState } from "react";
import Modal from "./Modal";
import { apenasDigitos, cnpjValido, cpfValido, mascararCpfOuCnpj } from "../../services/documentos";

const API = "http://localhost:8080/api";

/**
 * Cria a conta de locador (quem anuncia espaços).
 * Só deve ser aberto para quem já tem conta de locatário.
 *
 * Props:
 *  - usuarioLogado
 *  - onCriado: chamado depois que a API confirmar (atualize o usuário aqui)
 *  - onClose
 */
export default function ModalCriarLocador({ usuarioLogado, onCriado, onClose }) {
    const [documento, setDocumento] = useState("");
    const [nomeFantasia, setNomeFantasia] = useState("");
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState("");
    const [salvando, setSalvando] = useState(false);
    const documentoRef = useRef(null);

    const limparErro = (chave) =>
        setErros((prev) => {
            if (!prev[chave]) return prev;
            const { [chave]: _r, ...resto } = prev;
            return resto;
        });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (salvando) return;
        setErroGeral("");

        const digitos = apenasDigitos(documento);
        const novos = {};
        if (digitos.length === 0) {
            novos.documento = "Informe seu CPF ou CNPJ.";
        } else if (digitos.length <= 11 ? !cpfValido(documento) : !cnpjValido(documento)) {
            novos.documento = digitos.length <= 11 ? "CPF inválido. Confira os números." : "CNPJ inválido. Confira os números.";
        }
        if (nomeFantasia.trim().length < 2) novos.nomeFantasia = "Informe o nome que vai aparecer nos seus anúncios.";

        setErros(novos);
        if (Object.keys(novos).length > 0) {
            requestAnimationFrame(() => document.querySelector(".mdl-campo--erro input")?.focus());
            return;
        }

        setSalvando(true);
        try {
            const response = await fetch(`${API}/locadores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documento,
                    nomeFantasia: nomeFantasia.trim(),
                    usuarioId: usuarioLogado.id,
                }),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || "Não foi possível criar a conta de locador.");
            }

            await onCriado?.();
            onClose?.();
        } catch (err) {
            console.error(err);
            setErroGeral(err.message || "Não foi possível criar a conta de locador. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal
            titulo="Criar conta de locador"
            subtitulo="Informe os dados de quem vai anunciar. Depois você já poderá cadastrar seus espaços."
            onClose={onClose}
            bloqueado={salvando}
            tamanho="sm"
            rodape={
                <>
                    <button type="button" className="mdl-btn mdl-btn--ghost" onClick={onClose} disabled={salvando}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="form-criar-locador"
                        className="mdl-btn mdl-btn--primario"
                        disabled={salvando}
                    >
                        {salvando ? "Criando…" : "Criar conta"}
                    </button>
                </>
            }
        >
            <form id="form-criar-locador" onSubmit={handleSubmit} noValidate>
                {erroGeral && <p className="mdl-alerta" role="alert">{erroGeral}</p>}

                <div className="mdl-secao">
                    <div className={`mdl-campo${erros.documento ? " mdl-campo--erro" : ""}`}>
                        <label htmlFor="cl-documento">CPF ou CNPJ do anunciante</label>
                        <input
                            id="cl-documento"
                            ref={documentoRef}
                            type="text"
                            inputMode="numeric"
                            className="mdl-input"
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            value={documento}
                            autoFocus
                            onChange={(e) => {
                                setDocumento(mascararCpfOuCnpj(e.target.value));
                                limparErro("documento");
                            }}
                        />
                        {erros.documento && <small className="mdl-erro">{erros.documento}</small>}
                    </div>

                    <div className={`mdl-campo${erros.nomeFantasia ? " mdl-campo--erro" : ""}`}>
                        <label htmlFor="cl-nome">Nome fantasia / nome do espaço</label>
                        <input
                            id="cl-nome"
                            type="text"
                            className="mdl-input"
                            maxLength={100}
                            placeholder="Ex: Espaço Festa & Cia"
                            value={nomeFantasia}
                            onChange={(e) => {
                                setNomeFantasia(e.target.value);
                                limparErro("nomeFantasia");
                            }}
                        />
                        {erros.nomeFantasia && <small className="mdl-erro">{erros.nomeFantasia}</small>}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
