import React from "react";
import { CardEspaco } from "./CardEspaco";

export function ListaEspacos({ espacos, carregando }) {
    if (carregando) {
        return <p className="data-line">Carregando espaços disponíveis...</p>;
    }

    if (!espacos || espacos.length === 0) {
        return (
            <p className="data-line data-line-empty" style={{ textAlign: "center", padding: "40px" }}>
                Nenhum espaço disponível no momento.
            </p>
        );
    }

    return (
        <div className="espacos-lista">
            {espacos.map((espaco, index) => (
                <CardEspaco key={espaco.id || index} espaco={espaco} />
            ))}
        </div>
    );
}