package com.eva.locafesta.usuario;

import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.endereco.GeocodingService;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;
import java.util.List;

import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

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

    @Autowired
    private GeocodingService geocodingService; // <--- Injetando nosso novo serviço

    @Transactional
    public UsuarioDTO cadastrarUsuario(UsuarioCreateDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setFirebaseUid(dto.getFirebaseUid());
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefone(dto.getTelefone());
        
        if (dto.getEndereco() != null) {
            // Busca a latitude/longitude na API se vierem nulas
            geocodingService.preencherCoordenadas(dto.getEndereco());

            Endereco end = Endereco.builder()
                    .cep(dto.getEndereco().getCep())
                    .logradouro(dto.getEndereco().getLogradouro())
                    .numero(dto.getEndereco().getNumero())
                    .complemento(dto.getEndereco().getComplemento())
                    .bairro(dto.getEndereco().getBairro())
                    .cidade(dto.getEndereco().getCidade())
                    .estado(dto.getEndereco().getEstado())
                    .latitude(dto.getEndereco().getLatitude())
                    .longitude(dto.getEndereco().getLongitude())
                    .build();
            
            usuario.setEndereco(end);
        }
        
        Usuario usuarioSalvo = usuarioRepository.save(usuario);
    
        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());
    
        return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
    }
    
    @Transactional(readOnly = true)
    public UsuarioDTO buscarPorFirebaseUid(String firebaseUid) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuario.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuario.getId());

        return new UsuarioDTO(usuario, isLocatario, isLocador);
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(u -> {
                    boolean isLocador = perfilLocadorRepository.existsByUsuarioId(u.getId());
                    boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(u.getId());
                    return new UsuarioDTO(u, isLocatario, isLocador);
                })
                .collect(Collectors.toList());
    }
    
    @Transactional
    public UsuarioDTO atualizarEndereco(Long usuarioId, EnderecoDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
    
        // Busca a latitude e longitude se o frontend não enviou
        geocodingService.preencherCoordenadas(dto);

        Endereco endereco = Endereco.builder()
                .cep(dto.getCep())
                .logradouro(dto.getLogradouro())
                .numero(dto.getNumero())
                .complemento(dto.getComplemento())
                .bairro(dto.getBairro())
                .cidade(dto.getCidade())
                .estado(dto.getEstado())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
    
        usuario.setEndereco(endereco);
        
        Usuario usuarioSalvo = usuarioRepository.save(usuario);
    
        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());
    
        return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
    }

    @Transactional
    public void atualizarDataAtivo(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado para atualizar atividade."));
        
        usuario.setDataAtivo(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }
    
    @Transactional
    public UsuarioDTO atualizarTelefone(Long usuarioId, String telefone) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        usuario.setTelefone(telefone);
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());

        return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
    }
}