package com.eva.locafesta.locador;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PerfilLocadorRepository extends JpaRepository<PerfilLocador, Long> {
    Optional<PerfilLocador> findByUsuarioId(Long usuarioId);
    boolean existsByDocumento(String documento);
    boolean existsByUsuarioId(Long usuarioId);
}