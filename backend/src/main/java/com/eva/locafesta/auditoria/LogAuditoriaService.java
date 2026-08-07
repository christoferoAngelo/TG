package com.eva.locafesta.auditoria;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LogAuditoriaService {

    @Autowired
    private LogAuditoriaRepository repository;

    /**
     * REQUIRES_NEW garante que a gravação do log ocorra em uma nova transação.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarAcao(Long adminId, String adminNome, String acao, String tipoEntidade, String idEntidade, String detalhes) {
        LogAuditoria log = LogAuditoria.builder()
                .adminId(adminId)
                .adminNome(adminNome)
                .acao(acao)
                .tipoEntidade(tipoEntidade)
                .idEntidade(idEntidade)
                .detalhes(detalhes)
                .build();

        repository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<LogAuditoria> listarTodosPaginado(int pagina, int tamanho) {
        Pageable pageable = PageRequest.of(pagina, tamanho);
        return repository.findAllByOrderByDataHoraDesc(pageable);
    }

    @Transactional(readOnly = true)
    public List<LogAuditoria> listarPorAdmin(Long adminId) {
        return repository.findByAdminIdOrderByDataHoraDesc(adminId);
    }

    
}