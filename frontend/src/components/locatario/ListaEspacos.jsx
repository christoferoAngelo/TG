import React from "react";
import { CardEspaco } from "./CardEspaco";

export function ListaEspacos({ espacos, carregando }) {
    if (carregando) {
        return <p className="data-line">Carregando espaços disponíveis...</p>;
    }

    // Filtra a lista removendo qualquer espaço que tenha o status 'REJEITADO'
    const espacosFiltrados = espacos?.filter(
        (espaco) => espaco.statusAprovacao?.toUpperCase() !== 'REJEITADO' && espaco.statusAprovacao !== 'PENDENTE' 
    ) || [];

    // Agora fazemos a checagem de lista vazia usando a lista já filtrada
    if (espacosFiltrados.length === 0) {
        return (
            <p className="data-line data-line-empty" style={{ textAlign: "center", padding: "40px" }}>
                Nenhum espaço disponível no momento.
            </p>
        );
    }

    return (
        <div className="espacos-lista">
            {espacosFiltrados.map((espaco, index) => (
                <CardEspaco key={espaco.id || index} espaco={espaco} />
            ))}
        </div>
    );
}