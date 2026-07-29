package com.eva.locafesta.locatario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerfilLocatarioRepository extends JpaRepository<PerfilLocatario, Long> {
    Optional<PerfilLocatario> findByUsuarioId(Long usuarioId);
    boolean existsByUsuarioId(Long usuarioId);
	boolean existsByCpf(String cpf);
}