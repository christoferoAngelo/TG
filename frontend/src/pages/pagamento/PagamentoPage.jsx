import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function PagamentoPage() {
  const location = useLocation();

  // Pega os dados passados na navegação ou usa valores padrão para teste
  const reservaData = location.state || {
    reservaId: '1024',
    nomeEspaco: 'Espaço de Eventos',
    valorTotal: '350.00'
  };

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const handlePagar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch('http://localhost:8080/api/v1/pagamentos/criar-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservaId: reservaData.reservaId,
          nomeEspaco: reservaData.nomeEspaco,
          valorTotal: reservaData.valorTotal
        })
      });

      if (!response.ok) {
        const texto = await response.text();
        console.error('Erro do backend:', texto);
        setErro('Não foi possível iniciar o pagamento. Tente novamente.');
        return;
      }

      const data = await response.json();

      // Em teste, usa o link sandbox se existir; em produção, o initPoint
      window.location.href = data.sandboxInitPoint || data.initPoint;
    } catch (error) {
      console.error('Erro ao gerar preferência do Mercado Pago:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '16px' }}>Finalizar Pagamento</h2>
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
        <p><strong>Espaço:</strong> {reservaData.nomeEspaco}</p>
        <p><strong>Valor Total:</strong> R$ {reservaData.valorTotal}</p>
      </div>

      {erro && <p style={{ color: '#c0392b', marginBottom: '12px' }}>{erro}</p>}

      <button
        onClick={handlePagar}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#009ee3',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Redirecionando...' : 'Pagar com Mercado Pago'}
      </button>
    </div>
  );
}