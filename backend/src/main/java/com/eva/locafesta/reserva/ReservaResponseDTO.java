package com.eva.locafesta.reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    String comentarioAvaliacao
) {
    // Sub-record para enviar apenas o que importa do Espaço
    public record EspacoResumoDTO(Long id, String titulo) {}
}
