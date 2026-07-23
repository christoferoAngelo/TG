package com.eva.locafesta.locatario;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PerfilLocatarioService {

    @Autowired
    private PerfilLocatarioRepository  locatarioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Método auxiliar para converter Entidade em DTO
    private PerfilLocatarioDTO  converterParaDTO(PerfilLocatario  perfil) {
        return new PerfilLocatarioDTO(
        		perfil.getId(),
                perfil.getDocumento(),
                perfil.getUsuario().getId()
        );
    }

    // CREATE
    @Transactional
    public PerfilLocatarioDTO criarPerfil(PerfilLocatarioDTO dto) {
        if (locatarioRepository.existsByDocumento(dto.getDocumento())) {
            throw new RuntimeException("Este CPF/CNPJ já está cadastrado como locatario.");
        }

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (locatarioRepository.existsByUsuarioId(dto.getUsuarioId())) {
            throw new RuntimeException("Este usuário já possui um perfil de locatario.");
        }

        PerfilLocatario perfil = new PerfilLocatario(dto.getDocumento(), usuario);
        PerfilLocatario perfilSalvo = locatarioRepository.save(perfil);
        
        return converterParaDTO(perfilSalvo);
    }

    // READ - Buscar por ID do Perfil
    public PerfilLocatarioDTO buscarPorId(Long id) {
    	PerfilLocatario perfil = locatarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Perfil de locatario não encontrado."));
        return converterParaDTO(perfil);
    }

    // READ - Buscar por ID do Usuário
    public PerfilLocatarioDTO buscarPorUsuarioId(Long usuarioId) {
    	PerfilLocatario perfil = locatarioRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locatario não encontrado para este usuário."));
        return converterParaDTO(perfil);
    }

    // READ - Listar todos (útil para o Administrador)
    public List<PerfilLocatarioDTO> listarTodos() {
        return locatarioRepository.findAll().stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    @Transactional
    public PerfilLocatarioDTO atualizarPerfil(Long id, PerfilLocatarioDTO dto) {
    	PerfilLocatario perfil = locatarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Perfil de locatario não encontrado."));

        // Verifica se o locatario está tentando mudar para um documento que já existe em outra conta
        if (!perfil.getDocumento().equals(dto.getDocumento()) && locatarioRepository.existsByDocumento(dto.getDocumento())) {
            throw new RuntimeException("Este CPF/CNPJ já está cadastrado em outro perfil.");
        }

        perfil.setDocumento(dto.getDocumento());
        
        PerfilLocatario perfilAtualizado = locatarioRepository.save(perfil);
        return converterParaDTO(perfilAtualizado);
    }
}