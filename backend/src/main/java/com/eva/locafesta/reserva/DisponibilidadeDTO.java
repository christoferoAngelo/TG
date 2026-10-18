package com.eva.locafesta.reserva;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Resposta de GET /api/reservas/espaco/{id}/disponibilidade?data=AAAA-MM-DD */
public record DisponibilidadeDTO(
    Long espacoId,
    LocalDate data,
    LocalTime horarioAbertura,
    LocalTime horarioFechamento,
    int intervaloLimpezaMin,
    boolean aceitaHorarioPersonalizado,
    List<PeriodoDTO> periodos,
    List<IntervaloDTO> ocupados
) {
    public record PeriodoDTO(
        AgendaEspaco.Modalidade modalidade,
        Integer periodo,
        LocalTime horaInicio,
        LocalTime horaFim,
        boolean disponivel
    ) {}

    public record IntervaloDTO(LocalTime horaInicio, LocalTime horaFim) {}
}
