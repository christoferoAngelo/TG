package com.eva.locafesta.locador;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PerfilLocadorService {

    @Autowired
    private PerfilLocadorRepository locadorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Método auxiliar para converter Entidade em DTO
    private PerfilLocadorDTO converterParaDTO(PerfilLocador perfil) {
        return new PerfilLocadorDTO(
                perfil.getId(),
                perfil.getDocumento(),
                perfil.getNomeFantasia(),
                perfil.getUsuario().getId()
        );
    }

    // CREATE
    @Transactional
    public PerfilLocadorDTO criarPerfil(PerfilLocadorDTO dto) {
        if (locadorRepository.existsByDocumento(dto.getDocumento())) {
            throw new RuntimeException("Este CPF/CNPJ já está cadastrado como locador.");
        }

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (locadorRepository.existsByUsuarioId(dto.getUsuarioId())) {
            throw new RuntimeException("Este usuário já possui um perfil de locador.");
        }

        PerfilLocador perfil = new PerfilLocador(dto.getDocumento(), dto.getNomeFantasia(), usuario);
        PerfilLocador perfilSalvo = locadorRepository.save(perfil);
        
        return converterParaDTO(perfilSalvo);
    }

    // READ - Buscar por ID do Perfil
    public PerfilLocadorDTO buscarPorId(Long id) {
        PerfilLocador perfil = locadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado."));
        return converterParaDTO(perfil);
    }

    // READ - Buscar por ID do Usuário
    public PerfilLocadorDTO buscarPorUsuarioId(Long usuarioId) {
        PerfilLocador perfil = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));
        return converterParaDTO(perfil);
    }

    // READ - Listar todos (útil para o Administrador)
    public List<PerfilLocadorDTO> listarTodos() {
        return locadorRepository.findAll().stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    @Transactional
    public PerfilLocadorDTO atualizarPerfil(Long id, PerfilLocadorDTO dto) {
        PerfilLocador perfil = locadorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado."));

        // Verifica se o locador está tentando mudar para um documento que já existe em outra conta
        if (!perfil.getDocumento().equals(dto.getDocumento()) && locadorRepository.existsByDocumento(dto.getDocumento())) {
            throw new RuntimeException("Este CPF/CNPJ já está cadastrado em outro perfil.");
        }

        perfil.setDocumento(dto.getDocumento());
        perfil.setNomeFantasia(dto.getNomeFantasia());
        
        PerfilLocador perfilAtualizado = locadorRepository.save(perfil);
        return converterParaDTO(perfilAtualizado);
    }
}