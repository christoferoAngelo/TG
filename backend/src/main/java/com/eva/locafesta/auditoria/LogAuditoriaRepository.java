package com.eva.locafesta.auditoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {

    // Lista paginada ordenada do mais recente para o mais antigo (Ideal para a tabela do React)
    Page<LogAuditoria> findAllByOrderByDataHoraDesc(Pageable pageable);

    // Filtrar histórico de um administrador específico
    List<LogAuditoria> findByAdminIdOrderByDataHoraDesc(Long adminId);

    // Filtrar por tipo de entidade (ex: buscar apenas alterações em "Imovel")
    List<LogAuditoria> findByTipoEntidadeOrderByDataHoraDesc(String tipoEntidade);
}