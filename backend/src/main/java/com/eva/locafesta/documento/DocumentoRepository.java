package com.eva.locafesta.documento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<DocumentoEntity, Long> {

    List<DocumentoEntity> findByUsuarioId(Long usuarioId);

    List<DocumentoEntity> findByEspacoId(Long espacoId);

    List<DocumentoEntity> findByStatus(String status);

    List<DocumentoEntity> findByUsuarioIdAndStatus(
            Long usuarioId,
            String status
    );

    List<DocumentoEntity> findByEspacoIdAndStatus(
            Long espacoId,
            String status
    );
}