package com.eva.locafesta.termo;

import java.time.LocalDateTime;

public record AceiteDTO(
        Long id,
        Long usuarioId,
        Long termoId,
        String tipo,
        Integer versao,
        LocalDateTime aceitoEm
) {
    public static AceiteDTO de(AceiteTermo a) {
        return new AceiteDTO(
                a.getId(),
                a.getUsuario().getId(),
                a.getTermo().getId(),
                a.getTermo().getTipo().name(),
                a.getVersao(),
                a.getAceitoEm()
        );
    }
}
