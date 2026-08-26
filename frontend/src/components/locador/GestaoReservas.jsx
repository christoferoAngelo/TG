import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho conforme seu projeto
import './GestaoReservas.css';

export default function GestaoReservas() {
    const { usuarioLogado } = useAuth();
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        if (usuarioLogado?.id) {
            buscarReservas();
        }
    }, [usuarioLogado]);

    const buscarReservas = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/reservas/minhas-solicitacoes', {
                headers: { 
                    'Usuario-Id': usuarioLogado.id,
                    'Content-Type': 'application/json' 
                }
            });
            if (!response.ok) throw new Error("Erro ao buscar solicitações");
            const data = await response.json();
            setReservas(data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setCarregando(false);
        }
    };

    const handleAcao = async (reservaId, acao) => {
        // acao deve ser 'aprovar' ou 'rejeitar'
        try {
            const response = await fetch(`http://localhost:8080/api/reservas/${reservaId}/${acao}`, {
                method: 'PATCH',
                headers: { 'Usuario-Id': usuarioLogado.id }
            });
            
            if (!response.ok) throw new Error(`Erro ao ${acao} a reserva`);
            
            // Recarrega a lista para atualizar a tela
            buscarReservas();
        } catch (error) {
            console.error("Erro na ação:", error);
            alert("Não foi possível processar sua solicitação.");
        }
    };

    if (carregando) return <div className="loading">Carregando suas reservas...</div>;

    return (
        <div className="gestao-reservas-container">
            <header className="gestao-header">
                <h1>Gestão de Reservas</h1>
                <p>Acompanhe e gerencie as solicitações de locação dos seus espaços.</p>
            </header>

            {reservas.length === 0 ? (
                <div className="sem-reservas">Nenhuma solicitação de reserva encontrada.</div>
            ) : (
                <div className="lista-reservas">
                    {reservas.map(reserva => (
                        <div key={reserva.id} className={`reserva-card status-${reserva.status.toLowerCase()}`}>
                            <div className="reserva-info">
                                <h3>{reserva.espaco.titulo}</h3>
                                <p><strong>Data do Evento:</strong> {reserva.dataEvento}</p>
                                <p><strong>Valor:</strong> R$ {Number(reserva.valorTotal).toFixed(2)}</p>
                                <span className="badge-status">{reserva.status}</span>
                            </div>

                            {reserva.status === 'PENDENTE' && (
                                <div className="reserva-acoes">
                                    <button 
                                        className="btn-aprovar" 
                                        onClick={() => handleAcao(reserva.id, 'aprovar')}>
                                        ✓ Aceitar
                                    </button>
                                    <button 
                                        className="btn-rejeitar" 
                                        onClick={() => handleAcao(reserva.id, 'rejeitar')}>
                                        ✕ Recusar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}