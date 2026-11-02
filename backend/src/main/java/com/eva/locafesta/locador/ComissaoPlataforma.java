package com.eva.locafesta.locador;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Comissão da plataforma (configuração única). Sem coluna no banco por enquanto.
 */
public final class ComissaoPlataforma {

    public static final BigDecimal PERCENTUAL = new BigDecimal("0.10");

    private ComissaoPlataforma() {}

    public static BigDecimal liquido(BigDecimal bruto) {
        if (bruto == null) return BigDecimal.ZERO;
        return bruto.subtract(bruto.multiply(PERCENTUAL)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal taxa(BigDecimal bruto) {
        if (bruto == null) return BigDecimal.ZERO;
        return bruto.multiply(PERCENTUAL).setScale(2, RoundingMode.HALF_UP);
    }
}
