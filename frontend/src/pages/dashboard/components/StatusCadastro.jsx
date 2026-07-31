import React from "react";

export default function StatusCadastro({ contaCompleta, temDocumento, temTelefone, temEndereco }) {
    if (contaCompleta) return null; // Se a conta estiver completa, o card nem renderiza

    return (
        <div className="card">
            <div className="card-header">
                <h4 className="card-title">Status do Cadastro</h4>
                <span className="badge badge-aviso">⚠ Conta Incompleta</span>
            </div>

            <div className="status-grid">
                <div className="status-item">
                    <span>Identificação (CPF/CNPJ):</span>
                    <strong>{temDocumento ? " Cadastrado" : " Pendente"}</strong>
                </div>
                <div className="status-item">
                    <span>Telefone de Contato:</span>
                    <strong>{temTelefone ? " Cadastrado" : " Pendente"}</strong>
                </div>
                <div className="status-item">
                    <span>Endereço Residencial:</span>
                    <strong>{temEndereco ? " Cadastrado" : " Pendente"}</strong>
                </div>
            </div>
        </div>
    );
}