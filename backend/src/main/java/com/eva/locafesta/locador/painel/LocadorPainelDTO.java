package com.eva.locafesta.locador.painel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Resumo agregado do painel do locador.
 */
public record LocadorPainelDTO(
        List<AlertaDTO> alertas,
        KpisDTO kpis,
        List<PontoMensalDTO> faturamentoMensal,
        List<StatusCountDTO> reservasPorStatus,
        List<EspacoRankingDTO> espacosMaisAlugados,
        List<PeriodoProcuraDTO> procuraPorMes,
        List<PeriodoProcuraDTO> procuraPorDiaSemana,
        List<PedidoResumoDTO> pedidosParaResponder,
        List<EventoProximoDTO> proximosEventos,
        ContadoresAnuncioDTO contadoresAnuncios
) {
    public record AlertaDTO(String tipo, String titulo, String mensagem, String link) {}

    public record KpisDTO(
            long pedidosAguardando,
            BigDecimal faturamentoMes,
            BigDecimal faturamentoMesAnterior,
            Double variacaoPercentual,
            BigDecimal aReceber,
            EventoProximoDTO proximoEvento,
            List<BigDecimal> sparklinePedidos,
            List<BigDecimal> sparklineFaturamento,
            List<BigDecimal> sparklineAReceber
    ) {}

    public record PontoMensalDTO(String chave, String rotulo, BigDecimal valor, long quantidade) {}

    public record StatusCountDTO(String status, String rotulo, long quantidade) {}

    public record EspacoRankingDTO(Long espacoId, String titulo, long reservas, BigDecimal faturamento) {}

    public record PeriodoProcuraDTO(String rotulo, long quantidade) {}

    public record PedidoResumoDTO(
            Long id,
            Long espacoId,
            String espacoTitulo,
            String locatarioNome,
            LocalDate dataEvento,
            LocalTime horaInicio,
            LocalTime horaFim,
            BigDecimal valorTotal,
            String status
    ) {}

    public record EventoProximoDTO(
            Long reservaId,
            Long espacoId,
            String espacoTitulo,
            String locatarioNome,
            LocalDate dataEvento,
            LocalTime horaInicio,
            LocalTime horaFim,
            BigDecimal valorTotal
    ) {}

    public record ContadoresAnuncioDTO(
            long cadastrados,
            long aprovados,
            long emAnalise,
            long rejeitados,
            long ativos
    ) {}
}
