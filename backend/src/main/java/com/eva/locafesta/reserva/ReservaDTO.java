package com.eva.locafesta.reserva;

import java.time.LocalDate;
import java.math.BigDecimal;

public record ReservaDTO(
    Long espacoId,
    LocalDate dataEvento,
    String observacao, // Adicionado
    BigDecimal valorTotal // Adicionado
) {}