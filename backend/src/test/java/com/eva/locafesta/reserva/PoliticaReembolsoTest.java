package com.eva.locafesta.reserva;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PoliticaReembolsoTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 11, 1);

    @Test
    void aprovadaCom20DiasETotal() {
        assertEquals(
                PoliticaReembolso.TOTAL,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE.plusDays(20), HOJE)
        );
    }

    @Test
    void aprovadaCom15DiasETotal() {
        assertEquals(
                PoliticaReembolso.TOTAL,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE.plusDays(15), HOJE)
        );
    }

    @Test
    void aprovadaCom14DiasEParcial() {
        assertEquals(
                PoliticaReembolso.PARCIAL,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE.plusDays(14), HOJE)
        );
    }

    @Test
    void aprovadaCom7DiasEParcial() {
        assertEquals(
                PoliticaReembolso.PARCIAL,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE.plusDays(7), HOJE)
        );
    }

    @Test
    void aprovadaCom6DiasSemReembolso() {
        assertEquals(
                PoliticaReembolso.SEM_REEMBOLSO,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE.plusDays(6), HOJE)
        );
    }

    @Test
    void aprovadaNoMesmoDiaSemReembolso() {
        assertEquals(
                PoliticaReembolso.SEM_REEMBOLSO,
                PoliticaReembolso.condicaoCancelamentoLocatario("APROVADA", HOJE, HOJE)
        );
    }

    @Test
    void pendenteSemCobranca() {
        assertEquals(
                PoliticaReembolso.SEM_COBRANCA,
                PoliticaReembolso.condicaoCancelamentoLocatario("PENDENTE", HOJE.plusDays(20), HOJE)
        );
    }

    @Test
    void mensagensPadrao() {
        assertEquals("Será feito reembolso total.", PoliticaReembolso.mensagem(PoliticaReembolso.TOTAL));
        assertEquals(
                "Será feito reembolso parcial de 50%.",
                PoliticaReembolso.mensagem(PoliticaReembolso.PARCIAL)
        );
        assertEquals("Sem reembolso.", PoliticaReembolso.mensagem(PoliticaReembolso.SEM_REEMBOLSO));
        assertEquals(
                "Pedido ainda não confirmado, sem cobrança.",
                PoliticaReembolso.mensagem(PoliticaReembolso.SEM_COBRANCA)
        );
    }
}
