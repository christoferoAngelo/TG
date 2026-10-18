package com.eva.locafesta.reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * modalidade (opcional; sem ela vale INTEGRAL, como era antes):
 *  - MEIO_PERIODO: informe "periodo" (1 ou 2; padrão 1)
 *  - INTEGRAL: não precisa de mais nada
 *  - PERSONALIZADO: informe horaInicio e horaFim
 */
public record ReservaDTO(
    Long espacoId,
    LocalDate dataEvento,
    AgendaEspaco.Modalidade modalidade,
    Integer periodo,
    LocalTime horaInicio,
    LocalTime horaFim,
    String observacao,
    BigDecimal valorTotal
) {}
