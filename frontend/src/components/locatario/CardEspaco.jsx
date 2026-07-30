export function CardEspaco({ espaco }) {
  return (
    <div className="card-espaco">
      {/* Imagem de capa (ou placeholder caso não tenha foto) */}
      <img 
        src={espaco.fotoUrl || "https://via.placeholder.com/300x200"} 
        alt={espaco.titulo} 
      />
      
      <div className="info">
        <h3>{espaco.titulo}</h3>
        <p className="cidade">{espaco.cidade} - {espaco.estado}</p>
        <p className="preco">
          <strong>R$ {espaco.valorDiaria}</strong> / dia
        </p>
        
        <button onClick={() => alert(`Abrir espaço ${espaco.id}`)}>
          Ver detalhes
        </button>
      </div>
    </div>
  );
}