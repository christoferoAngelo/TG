package com.eva.locafesta.reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ReservaResponseDTO(
    Long id,
    EspacoResumoDTO espaco,
    LocalDate dataEvento,
    LocalTime horaInicio,
    LocalTime horaFim,
    BigDecimal valorTotal,
    String status,
    Integer nota,
    String comentarioAvaliacao,
    String canceladoPor,
    String condicaoReembolso,
    LocalDateTime canceladoEm,
    Integer prazoCancelamentoDias,
    boolean pagamentoLiberado,
    String observacao,
    String locatarioNome
) {
    // Sub-record para enviar apenas o que importa do Espaço
    public record EspacoResumoDTO(Long id, String titulo) {}
}
