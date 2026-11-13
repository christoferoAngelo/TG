package com.eva.locafesta.espaco;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrdenacaoAvaliacaoTest {

    @Test
    void ordenaPelaMaiorNotaEDesempataPelaQuantidade() {
        Espaco quatroOitoComUma = espaco("Quatro e oito", 4.8, 1);
        Espaco quatroOitoComDez = espaco("Quatro e oito antigo", 4.8, 10);
        Espaco quatroNove = espaco("Quatro e nove", 4.9, 2);
        Espaco cinco = espaco("Cinco", 5.0, 1);

        List<String> titulos = OrdenacaoAvaliacao.ordenar(List.of(
                quatroOitoComUma,
                quatroNove,
                quatroOitoComDez,
                cinco
        )).stream().map(Espaco::getTitulo).toList();

        assertEquals(
                List.of("Cinco", "Quatro e nove", "Quatro e oito antigo", "Quatro e oito"),
                titulos
        );
    }

    @Test
    void espacoSemAvaliacaoNaoEntraComoNotaZero() {
        Espaco notaBaixa = espaco("Nota baixa", 1.0, 1);
        Espaco semNota = espaco("Sem nota", null, 0);
        Espaco quantidadeNula = espaco("Quantidade nula", null, null);
        Espaco notaSemQuantidade = espaco("Nota sem quantidade", 5.0, 0);

        List<Espaco> ordenados = OrdenacaoAvaliacao.ordenar(List.of(
                semNota,
                notaSemQuantidade,
                quantidadeNula,
                notaBaixa
        ));

        assertEquals("Nota baixa", ordenados.get(0).getTitulo());
        assertTrue(OrdenacaoAvaliacao.possuiAvaliacao(notaBaixa));
        assertFalse(OrdenacaoAvaliacao.possuiAvaliacao(semNota));
        assertFalse(OrdenacaoAvaliacao.possuiAvaliacao(quantidadeNula));
        assertFalse(OrdenacaoAvaliacao.possuiAvaliacao(notaSemQuantidade));
        assertEquals(1, ordenados.stream().filter(OrdenacaoAvaliacao::possuiAvaliacao).count());
    }

    @Test
    void osQuatroPrimeirosAvaliadosIgnoramQuemNaoTemNota() {
        List<Espaco> ordenados = OrdenacaoAvaliacao.ordenar(List.of(
                espaco("C", 4.0, 3),
                espaco("Sem", null, 0),
                espaco("A", 4.9, 2),
                espaco("B", 4.9, 8),
                espaco("E", 3.5, 1),
                espaco("D", 4.2, 1)
        ));

        List<String> quatro = ordenados.stream()
                .filter(OrdenacaoAvaliacao::possuiAvaliacao)
                .limit(4)
                .map(Espaco::getTitulo)
                .toList();

        assertEquals(List.of("B", "A", "D", "C"), quatro);
    }

    @Test
    void empateDeNotaEQuantidadeOrdenaOTituloEmPortugues() {
        List<String> titulos = OrdenacaoAvaliacao.ordenar(List.of(
                espaco("Sítio Vale Florido", 4.6, 5),
                espaco("Sítio Águas Claras", 4.6, 5)
        )).stream().map(Espaco::getTitulo).toList();

        assertEquals(List.of("Sítio Águas Claras", "Sítio Vale Florido"), titulos);
    }

    @Test
    void listaVaziaPermaneceVazia() {
        assertTrue(OrdenacaoAvaliacao.ordenar(null).isEmpty());
        assertTrue(OrdenacaoAvaliacao.ordenar(List.of()).isEmpty());
    }

    private static Espaco espaco(String titulo, Double nota, Integer quantidade) {
        Espaco espaco = new Espaco();
        espaco.setTitulo(titulo);
        espaco.setNotaMedia(nota);
        espaco.setQuantidadeAvaliacoes(quantidade);
        espaco.setAtivo(true);
        espaco.setStatusAprovacao("APROVADO");
        return espaco;
    }
}
