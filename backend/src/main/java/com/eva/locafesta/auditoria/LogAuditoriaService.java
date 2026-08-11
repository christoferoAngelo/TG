package com.eva.locafesta.auditoria;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LogAuditoriaService {

    @Autowired
    private LogAuditoriaRepository logAuditoriaRepository;

    // Apenas métodos de LEITURA ficam aqui!
    // O antigo método "registrarAcao" foi apagado, pois o AuditoriaListener assumiu esse trabalho.

    public Page<LogAuditoria> listarTodosPaginado(int pagina, int tamanho) {
        // Retorna da mais recente para a mais antiga
        Pageable pageable = PageRequest.of(pagina, tamanho, Sort.by("dataHora").descending());
        return logAuditoriaRepository.findAll(pageable);
    }

    public List<LogAuditoria> listarPorAdmin(Long adminId) {
        return logAuditoriaRepository.findByAdminIdOrderByDataHoraDesc(adminId);
    }
}