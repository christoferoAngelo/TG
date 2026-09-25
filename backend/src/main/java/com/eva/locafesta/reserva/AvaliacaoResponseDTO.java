package com.eva.locafesta.reserva;

import java.time.LocalDateTime;

public record AvaliacaoResponseDTO(
    String nomeLocatario,
    Integer nota,
    String comentario,
    LocalDateTime dataAvaliacao
) {}