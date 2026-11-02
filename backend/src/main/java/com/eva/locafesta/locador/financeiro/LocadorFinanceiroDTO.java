package com.eva.locafesta.locador.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record LocadorFinanceiroDTO(
        LocalDate de,
        LocalDate ate,
        Long espacoIdFiltro,
        BigDecimal percentualComissao,
        KpisDTO kpis,
        List<PontoMensalDTO> faturamentoMensal,
        List<EspacoRankingDTO> espacosMaisAlugados,
        List<PeriodoProcuraDTO> procuraPorMes,
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
            boolean pagamentoLiberado
    ) {}

    public record EspacoOpcaoDTO(Long id, String titulo) {}
}
