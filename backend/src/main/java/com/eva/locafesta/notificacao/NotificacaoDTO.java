package com.eva.locafesta.notificacao;

import java.time.LocalDateTime;

public record NotificacaoDTO(
        Long id,
        Long reservaId,
        String titulo,
        String mensagem,
        boolean lida,
        LocalDateTime criadaEm
) {
    public NotificacaoDTO(Notificacao aviso) {
        this(
                aviso.getId(),
                aviso.getReservaId(),
                aviso.getTitulo(),
                aviso.getMensagem(),
                aviso.isLida(),
                aviso.getCriadaEm()
        );
    }
}
