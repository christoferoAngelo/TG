package com.eva.locafesta.relatorioLocador;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioDTO(
        BigDecimal faturamento,
        long reservasConfirmadas,
        List<EspacoRelatorio> espacos,
        List<PeriodoRelatorio> periodos
) {
    public record EspacoRelatorio(Long espacoId, String titulo, long reservas, BigDecimal faturamento) {}

    public record PeriodoRelatorio(String periodo, long reservas) {}
}
