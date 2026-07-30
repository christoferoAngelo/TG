import { CardEspaco } from "./CardEspaco";

export function ListaEspacos({ espacos, carregando }) {
  if (carregando) {
    return <p>Carregando espaços disponíveis...</p>;
  }

  if (!espacos || espacos.length === 0) {
    return <p>Nenhum espaço encontrado no momento.</p>;
  }

  return (
    <div className="grid-espacos">
      {espacos.map((espaco) => (
        <CardEspaco key={espaco.id} espaco={espaco} />
      ))}
    </div>
  );
}