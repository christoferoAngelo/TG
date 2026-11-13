package com.eva.locafesta.espaco;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Única regra de "melhor avaliados": nota média decrescente e, no empate,
 * mais avaliações. Espaço sem avaliação real fica depois dos avaliados
 * e não entra na conta como nota zero.
 */
public final class OrdenacaoAvaliacao {

    private static final Comparator<Espaco> POR_MELHOR_AVALIACAO = Comparator
            .comparingInt((Espaco espaco) -> possuiAvaliacao(espaco) ? 0 : 1)
            .thenComparing(Espaco::getNotaMedia, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Espaco::getQuantidadeAvaliacoes, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(
                    espaco -> espaco.getTitulo() == null ? "" : espaco.getTitulo(),
                    OrdenacaoAvaliacao::compararTitulo
            );

    private OrdenacaoAvaliacao() {
    }

    public static boolean possuiAvaliacao(Espaco espaco) {
        if (espaco == null || espaco.getNotaMedia() == null) {
            return false;
        }
        Integer quantidade = espaco.getQuantidadeAvaliacoes();
        return quantidade != null && quantidade > 0;
    }

    private static int compararTitulo(String esquerda, String direita) {
        Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        collator.setStrength(Collator.PRIMARY);
        return collator.compare(esquerda, direita);
    }

    public static List<Espaco> ordenar(List<Espaco> espacos) {
        if (espacos == null || espacos.isEmpty()) {
            return List.of();
        }
        return espacos.stream().sorted(POR_MELHOR_AVALIACAO).toList();
    }
}
