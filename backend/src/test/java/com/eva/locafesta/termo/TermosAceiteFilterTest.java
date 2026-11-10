package com.eva.locafesta.termo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TermosAceiteFilterTest {

    @Test
    void allowlistLiberaTermosAuthEspacosPagamento() {
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/termos/LOCATARIO/vigente", "GET"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/termos/aceitar", "POST"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/termos/pendente", "GET"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/users", "POST"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/users/abc", "GET"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/espacos/busca", "GET"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/espacos/12", "GET"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/v1/pagamentos/webhook", "POST"));
        assertTrue(TermosAceiteFilter.estaNaAllowlist("/api/caracteristicas", "GET"));
    }

    @Test
    void rotasDeContaNaoEstaoNaAllowlist() {
        assertFalse(TermosAceiteFilter.estaNaAllowlist("/api/reservas", "POST"));
        assertFalse(TermosAceiteFilter.estaNaAllowlist("/api/favoritos", "GET"));
        assertFalse(TermosAceiteFilter.estaNaAllowlist("/api/locador/painel/resumo", "GET"));
        assertFalse(TermosAceiteFilter.estaNaAllowlist("/api/documentos", "GET"));
        assertFalse(TermosAceiteFilter.estaNaAllowlist("/api/espacos", "POST"));
    }
}
