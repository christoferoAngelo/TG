package com.eva.locafesta.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByFirebaseUid(String firebaseUid);
    Optional<Usuario> findByEmail(String email);
    long countByDataAtivoAfter(LocalDateTime data);
    long countByDataCadastroAfter(LocalDateTime data);
    long countByStatusContaNot(String statusConta);
}