package com.eva.locafesta.event;

// A mensagem que carrega os dados pro seu LogAuditoria
public record AuditoriaEvent(
    Long adminId,
    String adminNome,
    String acao,
    String tipoEntidade,
    String idEntidade,
    String detalhes
) {}