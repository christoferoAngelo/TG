package com.eva.locafesta.locador;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Única fonte da comissão da plataforma.
 * Percentual lido de {@code locafesta.comissao-percentual} (ex.: 10 = 10%).
 * Comissão = bruto × (percentual/100), arredondada HALF_UP em 2 casas.
 * Líquido estimado = bruto − comissão.
 */
@Component
public class ComissaoPlataforma {

    private final BigDecimal percentualConfigurado;
    private final BigDecimal taxaDecimal;

    public ComissaoPlataforma(
            @Value("${locafesta.comissao-percentual:10}") BigDecimal percentualConfigurado
    ) {
        if (percentualConfigurado == null || percentualConfigurado.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("locafesta.comissao-percentual inválido.");
        }
        this.percentualConfigurado = percentualConfigurado.stripTrailingZeros();
        this.taxaDecimal = percentualConfigurado
                .divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP);
    }

    /** Percentual configurado (ex.: 10 para 10%). */
    public BigDecimal percentual() {
        return percentualConfigurado;
    }

    /** Comissão = bruto × taxa, HALF_UP com 2 casas. */
    public BigDecimal taxa(BigDecimal bruto) {
        if (bruto == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return bruto.multiply(taxaDecimal).setScale(2, RoundingMode.HALF_UP);
    }

    /** Valor líquido estimado = bruto − comissão. */
    public BigDecimal liquido(BigDecimal bruto) {
        if (bruto == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return bruto.subtract(taxa(bruto)).setScale(2, RoundingMode.HALF_UP);
    }
}
