package com.eva.locafesta.reserva;

/**
 * Prévia somente leitura da condição de reembolso ao cancelar pelo locatário.
 */
public record PrevisaoCancelamentoDTO(
        String condicao,
        String mensagem,
        long diasRestantes
) {}
