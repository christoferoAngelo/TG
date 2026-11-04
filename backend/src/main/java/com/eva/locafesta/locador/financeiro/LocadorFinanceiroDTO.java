package com.eva.locafesta.locador.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Resposta de {@code GET /api/locador/financeiro}.
 * <p>
 * Definições:
 * <ul>
 *   <li><b>Faturamento bruto</b>: soma do valor das reservas APROVADA com data do evento no período.</li>
 *   <li><b>Comissão da plataforma</b>: bruto × percentual configurado, HALF_UP 2 casas.</li>
 *   <li><b>Valor líquido estimado</b>: bruto − comissão.</li>
 *   <li><b>A receber</b>: líquido estimado das APROVADA com pagamentoLiberado = false
 *       (estoque aberto; inclui eventos futuros; não corta na data final do filtro).</li>
 *   <li>CANCELADA e REJEITADA não entram no faturamento.</li>
 * </ul>
 */
public record LocadorFinanceiroDTO(
        LocalDate de,
        LocalDate ate,
        Long espacoIdFiltro,
        BigDecimal percentualComissao,
        KpisDTO kpis,
        VariacaoKpisDTO variacao,
        List<PontoMensalDTO> faturamentoMensal,
        List<EspacoRankingDTO> espacosMaisAlugados,
        List<PeriodoProcuraDTO> procuraPorMes,
        List<PeriodoProcuraDTO> procuraPorDiaSemana,
        List<LinhaReservaDTO> reservas,
        int pagina,
        int tamanhoPagina,
        long totalReservas,
        int totalPaginas,
        List<EspacoOpcaoDTO> espacosDisponiveis
) {
    public record KpisDTO(
            BigDecimal faturamentoBruto,
            BigDecimal comissaoPlataforma,
            BigDecimal valorLiquidoEstimado,
            BigDecimal aReceber,
            long quantidadeReservas
    ) {}

    /**
     * Variação % vs. período anterior de mesma duração.
     * Quando a base anterior é zero, {@code disponivel=false} e
     * {@code mensagem} = "sem base de comparação" (sem divisão por zero).
     */
    public record VariacaoKpisDTO(
            VariacaoItemDTO faturamentoBruto,
            VariacaoItemDTO comissaoPlataforma,
            VariacaoItemDTO valorLiquidoEstimado,
            VariacaoItemDTO aReceber,
            VariacaoItemDTO quantidadeReservas
    ) {}

    public record VariacaoItemDTO(
            boolean disponivel,
            BigDecimal percentual,
            String mensagem
    ) {
        public static VariacaoItemDTO semBase() {
            return new VariacaoItemDTO(false, null, "sem base de comparação");
        }

        public static VariacaoItemDTO de(BigDecimal percentual) {
            return new VariacaoItemDTO(true, percentual, null);
        }
    }

    public record PontoMensalDTO(String chave, String rotulo, BigDecimal bruto, BigDecimal liquido) {}

    public record EspacoRankingDTO(Long espacoId, String titulo, long reservas, BigDecimal faturamento) {}

    public record PeriodoProcuraDTO(String rotulo, long quantidade) {}

    public record LinhaReservaDTO(
            Long id,
            LocalDate dataEvento,
            Long espacoId,
            String espacoTitulo,
            String locatarioNome,
            BigDecimal valorBruto,
            BigDecimal comissao,
            BigDecimal liquidoEstimado,
            boolean pagamentoLiberado,
            String situacaoPagamento
    ) {}

    public record EspacoOpcaoDTO(Long id, String titulo) {}
}
