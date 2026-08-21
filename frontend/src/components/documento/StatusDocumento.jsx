import React from "react";

export default function StatusDocumento({ status }) {

    const statusNormalizado =
        (status || "").toUpperCase();

    const configuracoes = {

        PENDENTE: {
            texto: "Em análise",
            classe: "status-pendente"
        },

        APROVADO: {
            texto: "Aprovado",
            classe: "status-aprovado"
        },

        REJEITADO: {
            texto: "Rejeitado",
            classe: "status-rejeitado"
        },

        CORRECAO_SOLICITADA: {
            texto: "Correção solicitada",
            classe: "status-correcao"
        }
    };

    const config =
        configuracoes[statusNormalizado] || {
            texto: status || "Desconhecido",
            classe: "status-desconhecido"
        };

    return (
        <span className={`status-documento ${config.classe}`}>
            {config.texto}
        </span>
    );
}