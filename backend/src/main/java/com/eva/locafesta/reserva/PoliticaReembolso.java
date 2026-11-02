package com.eva.locafesta.reserva;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Fonte única das regras de reembolso informativo no cancelamento pelo locatário.
 * Não realiza estorno no Mercado Pago — apenas define a condição e a mensagem.
 */
public final class PoliticaReembolso {

    public static final ZoneId FUSO_BRASIL = ZoneId.of("America/Sao_Paulo");

    public static final int DIAS_REEMBOLSO_TOTAL = 15;
    public static final int DIAS_REEMBOLSO_PARCIAL = 7;
    public static final int PERCENTUAL_PARCIAL = 50;

    public static final String TOTAL = "TOTAL";
    public static final String PARCIAL = "PARCIAL";
    public static final String SEM_REEMBOLSO = "SEM_REEMBOLSO";
    public static final String SEM_COBRANCA = "SEM_COBRANCA";

    private PoliticaReembolso() {}

    public static LocalDate hojeNoBrasil() {
        return ZonedDateTime.now(FUSO_BRASIL).toLocalDate();
    }

    /**
     * Dias corridos entre a data de referência (cancelamento) e a data do evento.
     * Se o evento for no passado, o resultado é negativo ou zero.
     */
    public static long diasAteEvento(LocalDate dataEvento, LocalDate dataReferencia) {
        if (dataEvento == null || dataReferencia == null) {
            return 0;
        }
        return ChronoUnit.DAYS.between(dataReferencia, dataEvento);
    }

    /**
     * Condição de reembolso para cancelamento pelo locatário.
     */
    public static String condicaoCancelamentoLocatario(String status, LocalDate dataEvento, LocalDate dataCancelamento) {
        if (!"APROVADA".equals(status)) {
            return SEM_COBRANCA;
        }
        long dias = diasAteEvento(dataEvento, dataCancelamento);
        if (dias >= DIAS_REEMBOLSO_TOTAL) {
            return TOTAL;
        }
        if (dias >= DIAS_REEMBOLSO_PARCIAL) {
            return PARCIAL;
        }
        return SEM_REEMBOLSO;
    }

    public static String mensagem(String condicao) {
        if (condicao == null) {
            return "Sem cobrança.";
        }
        return switch (condicao) {
            case TOTAL -> "Será feito reembolso total.";
            case PARCIAL -> "Será feito reembolso parcial de " + PERCENTUAL_PARCIAL + "%.";
            case SEM_REEMBOLSO -> "Sem reembolso.";
            case SEM_COBRANCA -> "Pedido ainda não confirmado, sem cobrança.";
            default -> "Sem cobrança.";
        };
    }
}
