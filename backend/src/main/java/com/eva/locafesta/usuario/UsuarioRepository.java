package com.eva.locafesta.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Método para procurar um utilizador pelo UID gerado pelo Firebase no momento do login/registo
    Optional<Usuario> findByFirebaseUid(String firebaseUid);
    
    // Método para verificar se um email já está registado no sistema antes de criar uma nova conta
    Optional<Usuario> findByEmail(String email);
}
