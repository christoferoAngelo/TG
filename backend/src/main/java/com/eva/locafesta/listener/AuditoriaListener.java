package com.eva.locafesta.listener;

import com.eva.locafesta.auditoria.LogAuditoria;
import com.eva.locafesta.auditoria.LogAuditoriaRepository;
import com.eva.locafesta.event.AuditoriaEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AuditoriaListener {

    private final LogAuditoriaRepository logAuditoriaRepository;

    public AuditoriaListener(LogAuditoriaRepository logAuditoriaRepository) {
        this.logAuditoriaRepository = logAuditoriaRepository;
    }

    @EventListener
    public void registrarAuditoria(AuditoriaEvent event) {

        LogAuditoria log = LogAuditoria.builder()
                .adminId(event.adminId())
                .adminNome(event.adminNome())
                .acao(event.acao())
                .tipoEntidade(event.tipoEntidade())
                .idEntidade(event.idEntidade())
                .detalhes(event.detalhes())
                .build();

        logAuditoriaRepository.save(log);
    }
}