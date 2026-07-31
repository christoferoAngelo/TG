import React from "react";

export default function DadosCadastrais({ usuarioLogado, temEndereco, setModalAberto }) {
    return (
        <div className="card">
            <div className="card-header card-header-spaced">
                <h4 className="card-title">Seus Dados Cadastrais:</h4>
                <button onClick={() => setModalAberto('endereco')} className="btn-link">
                    {temEndereco ? "Editar Endereço" : "+ Adicionar Endereço"}
                </button>
            </div>

            <p className="data-line"><strong>ID Interno:</strong> {usuarioLogado?.id}</p>
            <p className="data-line"><strong>E-mail:</strong> {usuarioLogado?.email}</p>
            <p className="data-line"><strong>Telefone:</strong> {usuarioLogado?.telefone || "Não informado"}</p>
            
            <hr className="divisor" />
            
            <strong className="section-subtitle">Endereço Principal:</strong>
            {temEndereco ? (
                <p className="data-line">
                    {usuarioLogado.endereco.logradouro}, Nº {usuarioLogado.endereco.numero} 
                    {usuarioLogado.endereco.complemento ? ` (${usuarioLogado.endereco.complemento})` : ""} - 
                    {usuarioLogado.endereco.bairro}, {usuarioLogado.endereco.cidade}/{usuarioLogado.endereco.estado} - CEP: {usuarioLogado.endereco.cep}
                </p>
            ) : (
                <p className="data-line data-line-empty">
                    Nenhum endereço residencial cadastrado.
                </p>
            )}
        </div>
    );
}