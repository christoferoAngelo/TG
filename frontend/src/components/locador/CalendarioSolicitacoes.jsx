import React, { useState, useMemo } from "react";
import "./CalendarioSolicitacoes.css";

const NOMES_MES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mesmo mapa usado na visão em lista, para as duas visões renderizarem
// exatamente o mesmo badge de status (definido em Dashboard.css).
const BADGE_POR_STATUS = {
    PENDENTE: "badge-pendente",
    APROVADA: "badge-aprovado",
    REJEITADA: "badge-rejeitado",
};

// Monta a chave "YYYY-MM-DD" a partir de um Date local, sem passar por
// conversão UTC (evita o clássico bug de "dia errado" com LocalDate do Java).
function formatarChaveData(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

/**
 * Calendário mensal com os pedidos de locação agrupados por dia.
 *
 * Props:
 * - solicitacoes: lista de ReservaResponseDTO (id, espaco, dataEvento, valorTotal, status)
 * - onAprovar(id) / onRejeitar(id): mesmos handlers já usados na visão em lista
 */
export default function CalendarioSolicitacoes({ solicitacoes, onAprovar, onRejeitar }) {
    const [mesAtual, setMesAtual] = useState(() => {
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    });
    const [diaSelecionado, setDiaSelecionado] = useState(null);

    // Agrupa as solicitações por data. dataEvento chega do backend como
    // string "YYYY-MM-DD" (LocalDate), então usamos ela direto como chave
    // em vez de recriar um Date (que sofreria o mesmo bug de fuso horário).
    const solicitacoesPorDia = useMemo(() => {
        const mapa = {};
        solicitacoes.forEach((req) => {
            if (!req.dataEvento) return;
            const chave = req.dataEvento;
            if (!mapa[chave]) mapa[chave] = [];
            mapa[chave].push(req);
        });
        return mapa;
    }, [solicitacoes]);

    const diasDoMes = useMemo(() => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();

        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);

        const dias = [];

        // Espaços vazios antes do dia 1, para alinhar com o dia da semana correto
        for (let i = 0; i < primeiroDia.getDay(); i++) {
            dias.push(null);
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            dias.push(new Date(ano, mes, dia));
        }

        return dias;
    }, [mesAtual]);

    const irParaMesAnterior = () => {
        setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
        setDiaSelecionado(null);
    };

    const irParaProximoMes = () => {
        setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
        setDiaSelecionado(null);
    };

    const chaveSelecionada = diaSelecionado ? formatarChaveData(diaSelecionado) : null;
    const solicitacoesDoDiaSelecionado = chaveSelecionada
        ? (solicitacoesPorDia[chaveSelecionada] || [])
        : [];

    const hojeChave = formatarChaveData(new Date());

    return (
        <div className="calendario-solicitacoes">
            <div className="calendario-header">
                <button type="button" className="calendario-nav-btn" onClick={irParaMesAnterior} aria-label="Mês anterior">
                    &#8249;
                </button>
                <h4 className="calendario-titulo">
                    {NOMES_MES[mesAtual.getMonth()]} de {mesAtual.getFullYear()}
                </h4>
                <button type="button" className="calendario-nav-btn" onClick={irParaProximoMes} aria-label="Próximo mês">
                    &#8250;
                </button>
            </div>

            <div className="calendario-grid calendario-dias-semana">
                {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="calendario-dia-semana">{dia}</div>
                ))}
            </div>

            <div className="calendario-grid">
                {diasDoMes.map((data, index) => {
                    if (!data) {
                        return <div key={`vazio-${index}`} className="calendario-celula calendario-celula-vazia" />;
                    }

                    const chave = formatarChaveData(data);
                    const solicitacoesDoDia = solicitacoesPorDia[chave] || [];
                    const temPendente = solicitacoesDoDia.some((r) => r.status === "PENDENTE");
                    const temSolicitacao = solicitacoesDoDia.length > 0;
                    const ehHoje = chave === hojeChave;
                    const ehSelecionado = chave === chaveSelecionada;

                    return (
                        <button
                            type="button"
                            key={chave}
                            className={[
                                "calendario-celula",
                                ehHoje ? "calendario-celula-hoje" : "",
                                temPendente
                                    ? "calendario-celula-pendente"
                                    : temSolicitacao ? "calendario-celula-com-reserva" : "",
                                ehSelecionado ? "calendario-celula-selecionada" : ""
                            ].filter(Boolean).join(" ")}
                            onClick={() => temSolicitacao && setDiaSelecionado(data)}
                            disabled={!temSolicitacao}
                        >
                            <span className="calendario-numero-dia">{data.getDate()}</span>
                            {temSolicitacao && (
                                <span className="calendario-badge">{solicitacoesDoDia.length}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="calendario-legenda">
                <span><i className="legenda-cor legenda-pendente" /> Pendente</span>
                <span><i className="legenda-cor legenda-com-reserva" /> Já respondida</span>
            </div>

            {diaSelecionado && (
                <div className="calendario-lista-dia">
                    <h5>Pedidos em {diaSelecionado.toLocaleDateString("pt-BR")}</h5>

                    {solicitacoesDoDiaSelecionado.length === 0 ? (
                        <p className="data-line data-line-empty">Nenhum pedido para este dia.</p>
                    ) : (
                        <div className="calendario-lista-pedidos">
                            {solicitacoesDoDiaSelecionado.map((req) => (
                                <div key={req.id} className="calendario-pedido-item">
                                    <div>
                                        <strong>{req.espaco.titulo}</strong>
                                        <p className="calendario-pedido-valor">
                                            R$ {req.valorTotal.toFixed(2)}
                                        </p>
                                        <span className={`badge ${BADGE_POR_STATUS[req.status] || ""}`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    {req.status === "PENDENTE" && (
                                        <div className="calendario-pedido-acoes">
                                            <button type="button" className="btn btn-aprovar" onClick={() => onAprovar(req.id)}>
                                                Aprovar
                                            </button>
                                            <button type="button" className="btn btn-rejeitar" onClick={() => onRejeitar(req.id)}>
                                                Rejeitar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
