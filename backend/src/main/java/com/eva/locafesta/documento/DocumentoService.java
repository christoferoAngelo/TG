package com.eva.locafesta.documento;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.event.AuditoriaEvent;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import com.eva.locafesta.notificacao.NotificacaoService;
import com.eva.locafesta.usuario.UsuarioService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentoService {

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EspacoRepository espacoRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private NotificacaoService notificacaoService;


    // =========================================================
    // VALIDAÇÕES
    // =========================================================

    private static final int TIPO_MAX = 50;
    private static final int NOME_ARQUIVO_MAX = 255;

    private static ResponseStatusException erro(HttpStatus status, String mensagem) {
        return new ResponseStatusException(status, mensagem);
    }

    // Garante que o documento chegou completo antes de salvar (evita 500 por coluna nula ou grande demais)
    private void validarDocumento(DocumentoCreateDTO dto) {
        if (dto == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Dados do documento não informados.");
        }

        String tipo = dto.getTipoDocumento();
        if (tipo == null || tipo.isBlank()) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe o tipo do documento.");
        }
        if (tipo.trim().length() > TIPO_MAX) {
            throw erro(HttpStatus.BAD_REQUEST,
                    "O tipo do documento deve ter no máximo " + TIPO_MAX + " caracteres.");
        }

        String url = dto.getArquivoUrl();
        if (url == null || url.isBlank()) {
            throw erro(HttpStatus.BAD_REQUEST, "Envie o arquivo do documento.");
        }
        String urlLimpa = url.trim().toLowerCase();
        if (!urlLimpa.startsWith("https://") && !urlLimpa.startsWith("http://")) {
            throw erro(HttpStatus.BAD_REQUEST, "O endereço do arquivo é inválido.");
        }

        String observacao = dto.getObservacao();
        if (observacao != null && observacao.trim().length() > 500) {
            throw erro(HttpStatus.BAD_REQUEST, "A observação deve ter no máximo 500 caracteres.");
        }
        String nome = dto.getNomeArquivo();
        if (nome != null && nome.length() > NOME_ARQUIVO_MAX) {
            throw erro(HttpStatus.BAD_REQUEST,
                    "O nome do arquivo deve ter no máximo " + NOME_ARQUIVO_MAX + " caracteres.");
        }
    }

    // ---------------------------------------------------------
    // QUEM ESTÁ LOGADO / QUEM PODE VER OU ENVIAR O QUÊ
    // O filtro do Firebase coloca o firebaseUid como nome da autenticação
    // (é o mesmo que o UsuarioService.obterAdminLogado() usa).
    // ---------------------------------------------------------

    private Usuario usuarioAutenticado() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();

        if (autenticacao == null
                || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw erro(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }

        return usuarioRepository.findByFirebaseUid(autenticacao.getName())
                .orElseThrow(() -> erro(HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado."));
    }

    // Só administrador passa
    private void exigirAdmin() {
        if (!usuarioAutenticado().isAdmin()) {
            throw erro(HttpStatus.FORBIDDEN, "Apenas administradores podem fazer isso.");
        }
    }

    // Só o dono (ou um administrador) passa
    private void exigirDonoOuAdmin(Long donoId) {
        Usuario logado = usuarioAutenticado();

        if (logado.isAdmin()) {
            return;
        }
        if (donoId == null || !donoId.equals(logado.getId())) {
            throw erro(HttpStatus.FORBIDDEN, "Você não tem permissão para acessar estes documentos.");
        }
    }

    // Dono de um espaço = o usuário por trás do locador que o cadastrou
    private Long donoDoEspaco(Espaco espaco) {
        if (espaco.getLocador() == null || espaco.getLocador().getUsuario() == null) {
            return null;
        }
        return espaco.getLocador().getUsuario().getId();
    }

    private void validarMotivo(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe o motivo.");
        }
    }


    // =========================================================
    // DOCUMENTO DE USUÁRIO
    // =========================================================

    @Transactional
    public DocumentoDTO criarDocumentoUsuario(
            Long usuarioId,
            DocumentoCreateDTO dto
    ) {

        exigirDonoOuAdmin(usuarioId);
        validarDocumento(dto);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado com o ID: " + usuarioId)
                );

        DocumentoEntity documento = DocumentoEntity.builder()
                .tipoDocumento(dto.getTipoDocumento().trim())
                .categoria("PESSOA")
                .usuario(usuario)
                .nomeArquivo(dto.getNomeArquivo())
                .arquivoUrl(dto.getArquivoUrl())
                .observacao(dto.getObservacao())
                .status("PENDENTE")
                .build();

        DocumentoEntity salvo =
                documentoRepository.save(documento);

        return new DocumentoDTO(salvo);
    }


    // =========================================================
    // DOCUMENTO DE ESPAÇO
    // =========================================================

    @Transactional
    public DocumentoDTO criarDocumentoEspaco(
            Long espacoId,
            DocumentoCreateDTO dto
    ) {

        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Espaço não encontrado com o ID: " + espacoId)
                );

        exigirDonoOuAdmin(donoDoEspaco(espaco));
        validarDocumento(dto);

        DocumentoEntity documento = DocumentoEntity.builder()
                .tipoDocumento(dto.getTipoDocumento().trim())
                .categoria("ESPACO")
                .espaco(espaco)
                .nomeArquivo(dto.getNomeArquivo())
                .arquivoUrl(dto.getArquivoUrl())
                .observacao(dto.getObservacao())
                .status("PENDENTE")
                .build();

        DocumentoEntity salvo =
                documentoRepository.save(documento);

        return new DocumentoDTO(salvo);
    }


    // =========================================================
    // DOCUMENTOS DO USUÁRIO
    // =========================================================

    @Transactional(readOnly = true)
    public List<DocumentoDTO> listarPorUsuario(Long usuarioId) {

        exigirDonoOuAdmin(usuarioId);

        return documentoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(DocumentoDTO::new)
                .collect(Collectors.toList());
    }


    // =========================================================
    // DOCUMENTOS DO ESPAÇO
    // =========================================================

    @Transactional(readOnly = true)
    public List<DocumentoDTO> listarPorEspaco(Long espacoId) {

        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Espaço não encontrado com o ID: " + espacoId)
                );

        exigirDonoOuAdmin(donoDoEspaco(espaco));

        return documentoRepository.findByEspacoId(espacoId)
                .stream()
                .map(DocumentoDTO::new)
                .collect(Collectors.toList());
    }


    // =========================================================
    // ADMIN - PENDENTES
    // =========================================================

    @Transactional(readOnly = true)
    public List<DocumentoDTO> listarPendentes() {

        exigirAdmin();

        return documentoRepository.findByStatus("PENDENTE")
                .stream()
                .map(DocumentoDTO::new)
                .collect(Collectors.toList());
    }


    // =========================================================
    // ADMIN - APROVAR
    // =========================================================

    @Transactional
    public DocumentoDTO aprovarDocumento(Long documentoId) {

        exigirAdmin();

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado com o ID: " + documentoId)
                        );

        String statusAnterior = documento.getStatus();

        documento.setStatus("APROVADO");
        documento.setMotivoRejeicao(null);
        documento.setDataAnalise(LocalDateTime.now());

        DocumentoEntity salvo =
                documentoRepository.save(documento);

        Usuario adminLogado =
                usuarioService.obterAdminLogado();

        String detalhes =
                "Aprovou o documento "
                        + documento.getTipoDocumento()
                        + " ID "
                        + documento.getId()
                        + ". Status anterior: "
                        + statusAnterior
                        + ". Novo status: APROVADO.";

        eventPublisher.publishEvent(
                new AuditoriaEvent(
                        adminLogado.getId(),
                        adminLogado.getNome(),
                        "APROVAR_DOCUMENTO",
                        "Documento",
                        documento.getId().toString(),
                        detalhes
                )
        );

        Long donoId = null;
        String alvo = documento.getTipoDocumento() == null ? "enviado" : documento.getTipoDocumento().replace('_', ' ').toLowerCase();
        if (documento.getUsuario() != null) {
            donoId = documento.getUsuario().getId();
        } else if (documento.getEspaco() != null
                && documento.getEspaco().getLocador() != null
                && documento.getEspaco().getLocador().getUsuario() != null) {
            donoId = documento.getEspaco().getLocador().getUsuario().getId();
            alvo = alvo + " do espaço " + documento.getEspaco().getTitulo();
        }
        notificacaoService.avisar(
                donoId,
                null,
                "Documento aprovado",
                "O documento " + alvo + " foi aprovado."
        );

        return new DocumentoDTO(salvo);
    }


    // =========================================================
    // ADMIN - REJEITAR
    // =========================================================

    @Transactional
    public DocumentoDTO rejeitarDocumento(
            Long documentoId,
            String motivo
    ) {

        exigirAdmin();
        validarMotivo(motivo);

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado com o ID: " + documentoId)
                        );

        String statusAnterior = documento.getStatus();

        documento.setStatus("REJEITADO");
        documento.setMotivoRejeicao(motivo);
        documento.setDataAnalise(LocalDateTime.now());

        DocumentoEntity salvo =
                documentoRepository.save(documento);

        Usuario adminLogado =
                usuarioService.obterAdminLogado();

        String detalhes =
                "Rejeitou o documento "
                        + documento.getTipoDocumento()
                        + " ID "
                        + documento.getId()
                        + ". Status anterior: "
                        + statusAnterior
                        + ". Novo status: REJEITADO."
                        + " Motivo: "
                        + motivo;

        eventPublisher.publishEvent(
                new AuditoriaEvent(
                        adminLogado.getId(),
                        adminLogado.getNome(),
                        "REJEITAR_DOCUMENTO",
                        "Documento",
                        documento.getId().toString(),
                        detalhes
                )
        );

        return new DocumentoDTO(salvo);
    }


    // =========================================================
    // ADMIN - SOLICITAR CORREÇÃO
    // =========================================================

    @Transactional
    public DocumentoDTO solicitarCorrecao(
            Long documentoId,
            String motivo
    ) {

        exigirAdmin();
        validarMotivo(motivo);

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado com o ID: " + documentoId)
                        );

        String statusAnterior = documento.getStatus();

        documento.setStatus("CORRECAO_SOLICITADA");
        documento.setMotivoRejeicao(motivo);
        documento.setDataAnalise(LocalDateTime.now());

        DocumentoEntity salvo =
                documentoRepository.save(documento);

        Usuario adminLogado =
                usuarioService.obterAdminLogado();

        String detalhes =
                "Solicitou correção do documento "
                        + documento.getTipoDocumento()
                        + " ID "
                        + documento.getId()
                        + ". Status anterior: "
                        + statusAnterior
                        + ". Novo status: CORRECAO_SOLICITADA."
                        + " Motivo: "
                        + motivo;

        eventPublisher.publishEvent(
                new AuditoriaEvent(
                        adminLogado.getId(),
                        adminLogado.getNome(),
                        "SOLICITAR_CORRECAO_DOCUMENTO",
                        "Documento",
                        documento.getId().toString(),
                        detalhes
                )
        );

        return new DocumentoDTO(salvo);
    }


    // =========================================================
    // BUSCAR POR ID
    // =========================================================

    @Transactional(readOnly = true)
    public DocumentoDTO buscarPorId(Long id) {

        DocumentoEntity documento =
                documentoRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento não encontrado.")
                        );

        Long donoId = documento.getUsuario() != null
                ? documento.getUsuario().getId()
                : (documento.getEspaco() != null ? donoDoEspaco(documento.getEspaco()) : null);

        exigirDonoOuAdmin(donoId);

        return new DocumentoDTO(documento);
    }
}