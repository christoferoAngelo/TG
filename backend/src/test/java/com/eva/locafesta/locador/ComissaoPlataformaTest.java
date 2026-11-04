package com.eva.locafesta.locador;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ComissaoPlataformaTest {

    ComissaoPlataforma comissao;

    @BeforeEach
    void setUp() {
        comissao = new ComissaoPlataforma(new BigDecimal("10"));
    }

    @Test
    void taxaDezPorCentoComDuasCasas() {
        assertEquals(new BigDecimal("100.00"), comissao.taxa(new BigDecimal("1000.00")));
        assertEquals(new BigDecimal("12.35"), comissao.taxa(new BigDecimal("123.45")));
    }

    @Test
    void arredondamentoHalfUpEmTrezentosTrintaETres() {
        // R$ 333,33 × 10% = 33,333 → HALF_UP → R$ 33,33
        assertEquals(new BigDecimal("33.33"), comissao.taxa(new BigDecimal("333.33")));
        assertEquals(new BigDecimal("300.00"), comissao.liquido(new BigDecimal("333.33")));
    }

    @Test
    void liquidoEhBrutoMenosComissao() {
        assertEquals(new BigDecimal("900.00"), comissao.liquido(new BigDecimal("1000.00")));
        // 123,45 × 10% = 12,345 → 12,35; líquido = 123,45 − 12,35 = 111,10
        assertEquals(new BigDecimal("111.10"), comissao.liquido(new BigDecimal("123.45")));
    }

    @Test
    void nuloViraZero() {
        assertEquals(new BigDecimal("0.00"), comissao.taxa(null));
        assertEquals(new BigDecimal("0.00"), comissao.liquido(null));
    }

    @Test
    void percentualExpostoEhOConfigurado() {
        assertEquals(0, new BigDecimal("10").compareTo(comissao.percentual()));
    }
}
