package com.eva.locafesta.usuario;

import com.eva.locafesta.auditoria.LogAuditoriaService;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.endereco.GeocodingService;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioUpdateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import com.eva.locafesta.event.AuditoriaEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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

@Autowired
private ApplicationEventPublisher eventPublisher;

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

// ==========================================
// MÉTODOS DE ADMINISTRAÇÃO E GERENCIAMENTO
// ==========================================

@Transactional
public UsuarioDTO cadastrarAdmin(UsuarioCreateDTO dto) {
    // 1. Descobre quem tá fazendo a ação
    Usuario adminLogado = obterAdminLogado(); 

    // 2. TRAVAS DE SEGURANÇA: Evita erro 500 verificando duplicidade no banco
    if (usuarioRepository.findByFirebaseUid(dto.getFirebaseUid()).isPresent()) {
        throw new IllegalArgumentException("Erro: Este UID do Firebase já está cadastrado.");
    }
    if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
        throw new IllegalArgumentException("Erro: Já existe um usuário com este e-mail.");
    }

    // 3. Continua o cadastro normalmente
    Usuario usuario = new Usuario();
    usuario.setFirebaseUid(dto.getFirebaseUid());
    usuario.setNome(dto.getNome());
    usuario.setEmail(dto.getEmail());
    usuario.setTelefone(dto.getTelefone());
    usuario.setAdmin(true); 

    if (dto.getEndereco() != null) {
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
    
    // DISPARA O EVENTO ASSÍNCRONO!
eventPublisher.publishEvent(new AuditoriaEvent(
    adminLogado.getId(),
    adminLogado.getNome(),
    "CADASTRAR_ADMIN",
    "Usuario",
    usuarioSalvo.getId().toString(),
    "Cadastrou o administrador "
        + "'" + usuarioSalvo.getNome() + "'"
        + ", e-mail: " + usuarioSalvo.getEmail()
        + ", telefone: " + usuarioSalvo.getTelefone()
));

    return new UsuarioDTO(usuarioSalvo, false, false);
}

@Transactional
public UsuarioDTO atualizarUsuario(Long usuarioId, UsuarioUpdateDTO dto) {

    Usuario adminLogado = obterAdminLogado();

    Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

    // ==========================================
    // GUARDA OS VALORES ANTIGOS PARA AUDITORIA
    // ==========================================

    String nomeAntigo = usuario.getNome();
    String emailAntigo = usuario.getEmail();
    String telefoneAntigo = usuario.getTelefone();
    Boolean adminAntigo = usuario.isAdmin();

    // ==========================================
    // ATUALIZA OS DADOS
    // ==========================================

    usuario.setNome(dto.getNome());
    usuario.setEmail(dto.getEmail());
    usuario.setTelefone(dto.getTelefone());

    if (dto.getAdmin() != null) {
        usuario.setAdmin(dto.getAdmin());
    }

    if (dto.getEndereco() != null) {

        geocodingService.preencherCoordenadas(dto.getEndereco());

        Endereco endereco = Endereco.builder()
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

        usuario.setEndereco(endereco);
    }

    Usuario usuarioSalvo = usuarioRepository.save(usuario);

    // ==========================================
    // MONTA OS DETALHES DA AUDITORIA
    // ==========================================

    StringBuilder detalhes = new StringBuilder();

    if (!java.util.Objects.equals(nomeAntigo, usuarioSalvo.getNome())) {
        detalhes.append("Nome alterado de '")
                .append(nomeAntigo)
                .append("' para '")
                .append(usuarioSalvo.getNome())
                .append("'. ");
    }

    if (!java.util.Objects.equals(emailAntigo, usuarioSalvo.getEmail())) {
        detalhes.append("E-mail alterado de '")
                .append(emailAntigo)
                .append("' para '")
                .append(usuarioSalvo.getEmail())
                .append("'. ");
    }

    if (!java.util.Objects.equals(telefoneAntigo, usuarioSalvo.getTelefone())) {
        detalhes.append("Telefone alterado de '")
                .append(telefoneAntigo)
                .append("' para '")
                .append(usuarioSalvo.getTelefone())
                .append("'. ");
    }

    if (!java.util.Objects.equals(adminAntigo, usuarioSalvo.isAdmin())) {
        detalhes.append("Permissão de administrador alterada de '")
                .append(adminAntigo)
                .append("' para '")
                .append(usuarioSalvo.isAdmin())
                .append("'. ");
    }

    // Caso nenhuma dessas informações tenha mudado
    if (detalhes.length() == 0) {
        detalhes.append("Dados do usuário atualizados.");
    }

    // ==========================================
    // REGISTRA A AUDITORIA
    // ==========================================

    eventPublisher.publishEvent(new AuditoriaEvent(
            adminLogado.getId(),
            adminLogado.getNome(),
            "ATUALIZAR_USUARIO",
            "Usuario",
            usuarioSalvo.getId().toString(),
            detalhes.toString()
    ));

    // ==========================================
    // RETORNA O USUÁRIO
    // ==========================================

    boolean isLocador =
            perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());

    boolean isLocatario =
            perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());

    return new UsuarioDTO(
            usuarioSalvo,
            isLocatario,
            isLocador
    );
}

@Transactional
public void excluirUsuario(Long idUsuarioParaExcluir) {

    Usuario adminLogado = obterAdminLogado();

    Usuario usuario = usuarioRepository.findById(idUsuarioParaExcluir)
            .orElseThrow(() ->
                    new EntityNotFoundException("Usuário não encontrado."));

    // Guarda as informações antes de excluir
    Long idExcluido = usuario.getId();
    String nomeExcluido = usuario.getNome();
    String emailExcluido = usuario.getEmail();
    String telefoneExcluido = usuario.getTelefone();

    // Exclui o usuário
    usuarioRepository.delete(usuario);

    // Registra a auditoria
    eventPublisher.publishEvent(new AuditoriaEvent(
            adminLogado.getId(),
            adminLogado.getNome(),
            "EXCLUIR_USUARIO",
            "Usuario",
            idExcluido.toString(),
            "Excluiu o usuário "
                    + "'" + nomeExcluido + "'"
                    + ", e-mail: " + emailExcluido
                    + ", telefone: " + telefoneExcluido
                    + "."
    ));
}

public Usuario obterAdminLogado() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication == null || !authentication.isAuthenticated()) {
        throw new IllegalStateException("Nenhum administrador logado encontrado.");
    }

    // Se você estiver salvando o firebaseUid no Principal ou no nome do Authentication:
    String firebaseUid = authentication.getName(); 

    return usuarioRepository.findByFirebaseUid(firebaseUid)
            .filter(Usuario::isAdmin) // Garante que é admin
            .orElseThrow(() -> new IllegalStateException("Nenhum administrador logado encontrado."));
    }
}