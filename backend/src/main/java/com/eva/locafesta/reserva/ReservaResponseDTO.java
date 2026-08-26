package com.eva.locafesta.reserva;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReservaResponseDTO(
    Long id,
    EspacoResumoDTO espaco,
    LocalDate dataEvento,
    BigDecimal valorTotal,
    String status
) {
    // Sub-record para enviar apenas o que importa do Espaço
    public record EspacoResumoDTO(Long id, String titulo) {}
}