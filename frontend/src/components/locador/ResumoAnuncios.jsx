import React from "react";

export default function ResumoAnuncios({ totalEspacos }) {
    return (
        <div className="card">
            <h4 className="card-title">Resumo dos Anúncios</h4>
            <div className="status-grid mt-15">
                <div className="status-item">
                    <span>Total de Espaços:</span>
                    <strong>{totalEspacos}</strong>
                </div>
                <div className="status-item">
                    <span>Status da Conta:</span>
                    <strong className="text-success">Ativa</strong>
                </div>
            </div>
        </div>
    );
}