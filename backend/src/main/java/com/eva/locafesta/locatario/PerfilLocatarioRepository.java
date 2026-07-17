package com.eva.locafesta.locatario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PerfilLocatarioRepository extends JpaRepository<PerfilLocatario, Long> {
    Optional<PerfilLocatario> findByUsuarioId(Long usuarioId);
    boolean existsByCpf(String cpf);
    boolean existsByUsuarioId(Long usuarioId);
}