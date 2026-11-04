package com.eva.locafesta.termo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AceiteTermoRepository extends JpaRepository<AceiteTermo, Long> {

    Optional<AceiteTermo> findByUsuarioIdAndTermoId(Long usuarioId, Long termoId);

    List<AceiteTermo> findByUsuarioId(Long usuarioId);

    boolean existsByUsuarioIdAndTermoId(Long usuarioId, Long termoId);

    Optional<AceiteTermo> findFirstByUsuarioIdAndTermoTipoOrderByAceitoEmDesc(Long usuarioId, TipoTermo tipo);
}
