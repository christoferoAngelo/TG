package com.eva.locafesta.termo;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TermoUsoRepository extends JpaRepository<TermoUso, Long> {

    Optional<TermoUso> findByTipoAndStatus(TipoTermo tipo, StatusTermo status);

    List<TermoUso> findByTipoOrderByVersaoDesc(TipoTermo tipo);

    @Query("SELECT COALESCE(MAX(t.versao), 0) FROM TermoUso t WHERE t.tipo = :tipo")
    int maxVersao(@Param("tipo") TipoTermo tipo);

    boolean existsByTipoAndStatus(TipoTermo tipo, StatusTermo status);

    long countByTipoAndStatus(TipoTermo tipo, StatusTermo status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TermoUso t WHERE t.id = :id")
    Optional<TermoUso> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TermoUso t WHERE t.tipo = :tipo AND t.status = :status")
    Optional<TermoUso> findByTipoAndStatusForUpdate(
            @Param("tipo") TipoTermo tipo,
            @Param("status") StatusTermo status
    );
}
