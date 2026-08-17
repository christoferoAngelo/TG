package com.eva.locafesta.documento;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.event.AuditoriaEvent;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import com.eva.locafesta.usuario.UsuarioService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


    // =========================================================
    // DOCUMENTO DE USUÁRIO
    // =========================================================

    @Transactional
    public DocumentoDTO criarDocumentoUsuario(
            Long usuarioId,
            DocumentoCreateDTO dto
    ) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Usuário não encontrado com o ID: " + usuarioId
                        )
                );

        DocumentoEntity documento = DocumentoEntity.builder()
                .tipoDocumento(dto.getTipoDocumento())
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
                        new RuntimeException(
                                "Espaço não encontrado com o ID: " + espacoId
                        )
                );

        DocumentoEntity documento = DocumentoEntity.builder()
                .tipoDocumento(dto.getTipoDocumento())
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

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Documento não encontrado com o ID: "
                                                + documentoId
                                )
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

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Documento não encontrado com o ID: "
                                                + documentoId
                                )
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

        DocumentoEntity documento =
                documentoRepository.findById(documentoId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Documento não encontrado com o ID: "
                                                + documentoId
                                )
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
                                new RuntimeException(
                                        "Documento não encontrado."
                                )
                        );

        return new DocumentoDTO(documento);
    }
}