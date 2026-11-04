package com.eva.locafesta.termo;

import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import com.eva.locafesta.usuario.UsuarioService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class TermoService {

    private static final int CONTEUDO_MINIMO = 40;

    private final TermoUsoRepository termoUsoRepository;
    private final AceiteTermoRepository aceiteTermoRepository;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final PerfilLocadorRepository perfilLocadorRepository;
    private final PerfilLocatarioRepository perfilLocatarioRepository;

    public TermoService(
            TermoUsoRepository termoUsoRepository,
            AceiteTermoRepository aceiteTermoRepository,
            UsuarioService usuarioService,
            UsuarioRepository usuarioRepository,
            PerfilLocadorRepository perfilLocadorRepository,
            PerfilLocatarioRepository perfilLocatarioRepository
    ) {
        this.termoUsoRepository = termoUsoRepository;
        this.aceiteTermoRepository = aceiteTermoRepository;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.perfilLocatarioRepository = perfilLocatarioRepository;
    }

    @Transactional(readOnly = true)
    public TermoDTO vigente(String tipoStr) {
        TipoTermo tipo = parseTipo(tipoStr);
        TermoUso termo = termoUsoRepository.findByTipoAndStatus(tipo, StatusTermo.PUBLICADO)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Não há termo publicado para " + tipo));
        return TermoDTO.vigente(termo);
    }

    @Transactional(readOnly = true)
    public List<TermoDTO> listarAdmin(String tipoStr) {
        usuarioService.obterAdminLogado();
        TipoTermo tipo = parseTipo(tipoStr);
        return termoUsoRepository.findByTipoOrderByVersaoDesc(tipo).stream()
                .map(TermoDTO::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public TermoDTO detalheAdmin(Long id) {
        usuarioService.obterAdminLogado();
        return TermoDTO.de(buscar(id));
    }

    @Transactional
    public TermoDTO criarRascunho(TermoCreateDTO dto) {
        Usuario admin = usuarioService.obterAdminLogado();
        TipoTermo tipo = parseTipo(dto.tipo());

        String titulo = limpar(dto.titulo());
        String conteudo = limpar(dto.conteudo());

        if (titulo == null || titulo.isBlank()) {
            titulo = TermosTextoSeed.TITULO;
        }
        if (conteudo == null || conteudo.isBlank()) {
            conteudo = termoUsoRepository.findByTipoAndStatus(tipo, StatusTermo.PUBLICADO)
                    .map(TermoUso::getConteudo)
                    .orElse(TermosTextoSeed.CONTEUDO);
        }

        int proxima = termoUsoRepository.maxVersao(tipo) + 1;
        TermoUso termo = TermoUso.builder()
                .tipo(tipo)
                .versao(proxima)
                .titulo(titulo.trim())
                .conteudo(conteudo)
                .status(StatusTermo.RASCUNHO)
                .criadoPor(admin)
                .criadoEm(LocalDateTime.now())
                .publicadoEm(null)
                .build();
        return TermoDTO.de(termoUsoRepository.save(termo));
    }

    @Transactional
    public TermoDTO atualizarRascunho(Long id, TermoUpdateDTO dto) {
        usuarioService.obterAdminLogado();
        TermoUso termo = buscar(id);
        if (termo.getStatus() != StatusTermo.RASCUNHO) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Só é possível editar rascunhos. Versões publicadas ou arquivadas são imutáveis.");
        }
        String titulo = limpar(dto.titulo());
        String conteudo = limpar(dto.conteudo());
        if (titulo != null && !titulo.isBlank()) {
            termo.setTitulo(titulo.trim());
        }
        if (conteudo != null) {
            termo.setConteudo(conteudo);
        }
        return TermoDTO.de(termoUsoRepository.save(termo));
    }

    /**
     * Publica o rascunho e garante no máximo um PUBLICADO por tipo
     * (MariaDB não tem índice parcial — a regra vive nesta transação).
     */
    @Transactional
    public TermoDTO publicar(Long id) {
        usuarioService.obterAdminLogado();
        TermoUso termo = buscarComTrava(id);

        if (termo.getStatus() != StatusTermo.RASCUNHO) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Só rascunhos podem ser publicados.");
        }
        if (termo.getConteudo() == null || termo.getConteudo().trim().length() < CONTEUDO_MINIMO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Conteúdo muito curto para publicar.");
        }

        termoUsoRepository.findByTipoAndStatusForUpdate(termo.getTipo(), StatusTermo.PUBLICADO)
                .ifPresent(atual -> {
                    atual.setStatus(StatusTermo.ARQUIVADO);
                    termoUsoRepository.save(atual);
                });

        termo.setStatus(StatusTermo.PUBLICADO);
        termo.setPublicadoEm(LocalDateTime.now());
        TermoUso salvo = termoUsoRepository.save(termo);

        long publicados = termoUsoRepository.countByTipoAndStatus(termo.getTipo(), StatusTermo.PUBLICADO);
        if (publicados != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Falha ao garantir um único termo PUBLICADO por tipo.");
        }
        return TermoDTO.de(salvo);
    }

    @Transactional
    public void aceitar(AceiteRequestDTO dto) {
        Usuario usuario = usuarioAutenticado();
        Set<Long> ids = new LinkedHashSet<>();
        if (dto != null && dto.termoIds() != null) {
            ids.addAll(dto.termoIds().stream().filter(id -> id != null && id > 0).toList());
        }

        if (ids.isEmpty()) {
            for (TipoTermo tipo : tiposAplicaveis(usuario)) {
                termoUsoRepository.findByTipoAndStatus(tipo, StatusTermo.PUBLICADO)
                        .ifPresent(t -> ids.add(t.getId()));
            }
        }

        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhum termo para aceitar.");
        }

        LocalDateTime agora = LocalDateTime.now();
        for (Long termoId : ids) {
            TermoUso termo = buscar(termoId);
            if (termo.getStatus() != StatusTermo.PUBLICADO) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Só é possível aceitar a versão publicada vigente.");
            }
            if (aceiteTermoRepository.existsByUsuarioIdAndTermoId(usuario.getId(), termoId)) {
                continue;
            }
            AceiteTermo aceite = AceiteTermo.builder()
                    .usuario(usuario)
                    .termo(termo)
                    .aceitoEm(agora)
                    .build();
            aceiteTermoRepository.save(aceite);
        }
    }

    @Transactional(readOnly = true)
    public TermoPendenteDTO pendente() {
        Usuario usuario = usuarioAutenticado();
        List<TermoDTO> pendentes = new ArrayList<>();
        for (TipoTermo tipo : tiposAplicaveis(usuario)) {
            termoUsoRepository.findByTipoAndStatus(tipo, StatusTermo.PUBLICADO).ifPresent(vigente -> {
                if (!aceiteTermoRepository.existsByUsuarioIdAndTermoId(usuario.getId(), vigente.getId())) {
                    pendentes.add(TermoDTO.vigente(vigente));
                }
            });
        }
        return new TermoPendenteDTO(!pendentes.isEmpty(), pendentes);
    }

    private List<TipoTermo> tiposAplicaveis(Usuario usuario) {
        boolean locador = perfilLocadorRepository.existsByUsuarioId(usuario.getId());
        boolean locatario = perfilLocatarioRepository.existsByUsuarioId(usuario.getId());
        List<TipoTermo> tipos = new ArrayList<>();
        if (locador) {
            tipos.add(TipoTermo.LOCADOR);
        }
        if (locatario || !locador) {
            // Sem perfil ainda (cadastro) ou locatário: exige LOCATARIO.
            tipos.add(TipoTermo.LOCATARIO);
        }
        return tipos;
    }

    private TermoUso buscar(Long id) {
        return termoUsoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Termo não encontrado: " + id));
    }

    private TermoUso buscarComTrava(Long id) {
        return termoUsoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Termo não encontrado: " + id));
    }

    private Usuario usuarioAutenticado() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }
        return usuarioRepository.findByFirebaseUid(autenticacao.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado."));
    }

    private static TipoTermo parseTipo(String tipoStr) {
        if (tipoStr == null || tipoStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de termo obrigatório.");
        }
        try {
            return TipoTermo.valueOf(tipoStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tipo inválido. Use LOCADOR ou LOCATARIO.");
        }
    }

    private static String limpar(String valor) {
        return valor == null ? null : valor;
    }
}
