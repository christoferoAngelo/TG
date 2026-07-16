package com.eva.locafesta.usuario;


import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository userRepository;

    /**
     * Regista ou atualiza um utilizador no MySQL após validação com o Firebase.
     */
    @Transactional
    public Usuario registrarUsuario(UsuarioCreateDTO dto) {
        // Verifica se o email já existe na nossa base de dados MySQL
        Optional<Usuario> usuarioExistente = userRepository.findByEmail(dto.getEmail());
        if (usuarioExistente.isPresent()) {
            throw new RuntimeException("Este email já se encontra registado no sistema.");
        }

        // Verifica se o UID do Firebase já existe
        Optional<Usuario> uidExistente = userRepository.findByFirebaseUid(dto.getFirebaseUid());
        if (uidExistente.isPresent()) {
            throw new RuntimeException("Este UID do Firebase já está associado a uma conta.");
        }

        // Cria a nova entidade User a partir do DTO
        Usuario novoUsuario = new Usuario();
        novoUsuario.setFirebaseUid(dto.getFirebaseUid());
        novoUsuario.setNome(dto.getNome());
        novoUsuario.setEmail(dto.getEmail());
        novoUsuario.setTelefone(dto.getTelefone());
        novoUsuario.setStatusConta("ATIVO");

        return userRepository.save(novoUsuario);
    }

    /**
     * Procura um utilizador através do UID único do Firebase.
     * Útil para o frontend verificar se o perfil já existe no MySQL após o login.
     */
    @Transactional(readOnly = true)
    public Optional<Usuario> buscarPorFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }
}
