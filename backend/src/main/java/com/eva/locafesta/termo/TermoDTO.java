package com.eva.locafesta.termo;

import java.time.LocalDateTime;

public record TermoDTO(
        Long id,
        String tipo,
        Integer versao,
        String titulo,
        String conteudo,
        String status,
        LocalDateTime criadoEm,
        LocalDateTime publicadoEm,
        Long criadoPorId,
        String criadoPorNome
) {
    public static TermoDTO de(TermoUso t) {
        return new TermoDTO(
                t.getId(),
                t.getTipo().name(),
                t.getVersao(),
                t.getTitulo(),
                t.getConteudo(),
                t.getStatus().name(),
                t.getCriadoEm(),
                t.getPublicadoEm(),
                t.getCriadoPor() != null ? t.getCriadoPor().getId() : null,
                t.getCriadoPor() != null ? t.getCriadoPor().getNome() : null
        );
    }

    /** Resposta pública (sem dados internos). */
    public static TermoDTO vigente(TermoUso t) {
        return new TermoDTO(
                t.getId(),
                t.getTipo().name(),
                t.getVersao(),
                t.getTitulo(),
                t.getConteudo(),
                t.getStatus().name(),
                null,
                t.getPublicadoEm(),
                null,
                null
        );
    }
}
