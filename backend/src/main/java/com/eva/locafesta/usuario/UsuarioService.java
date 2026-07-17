package com.eva.locafesta.usuario;

import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PerfilLocadorRepository perfilLocadorRepository;

    @Autowired
    private PerfilLocatarioRepository perfilLocatarioRepository;

    @Transactional
    public UsuarioDTO cadastrarUsuario(UsuarioCreateDTO dto) {
        // 1. Instancia a entidade real e passa os dados do seu UsuarioCreateDTO
        Usuario usuario = new Usuario();
        usuario.setFirebaseUid(dto.getFirebaseUid());
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefone(dto.getTelefone());

        // 2. Salva o usuário base no MySQL
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        // 3. Verifica nos outros repositórios se já existe perfil criado para este ID
        // (No momento do primeiro cadastro do React vai dar false para os dois, o que está correto!)
        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());

        // 4. Retorna usando o construtor exato que você criou no seu UsuarioDTO
        return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
    }
    
    // Dica extra: Você vai precisar de um método de busca para quando o usuário logar de novo
    @Transactional(readOnly = true)
    public UsuarioDTO buscarPorFirebaseUid(String firebaseUid) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuario.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuario.getId());

        return new UsuarioDTO(usuario, isLocatario, isLocador);
    }
}