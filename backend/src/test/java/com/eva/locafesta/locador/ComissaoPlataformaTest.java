package com.eva.locafesta.locador;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ComissaoPlataformaTest {

    @Test
    void taxaDezPorCentoComDuasCasas() {
        assertEquals(new BigDecimal("100.00"), ComissaoPlataforma.taxa(new BigDecimal("1000.00")));
        assertEquals(new BigDecimal("12.35"), ComissaoPlataforma.taxa(new BigDecimal("123.45")));
    }

    @Test
    void liquidoAposComissao() {
        assertEquals(new BigDecimal("900.00"), ComissaoPlataforma.liquido(new BigDecimal("1000.00")));
        assertEquals(new BigDecimal("111.11"), ComissaoPlataforma.liquido(new BigDecimal("123.45")));
    }

    @Test
    void nuloViraZero() {
        assertEquals(BigDecimal.ZERO, ComissaoPlataforma.taxa(null));
        assertEquals(BigDecimal.ZERO, ComissaoPlataforma.liquido(null));
    }
}
