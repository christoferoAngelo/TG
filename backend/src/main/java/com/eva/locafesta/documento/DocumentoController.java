package com.eva.locafesta.documento;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documentos")
@CrossOrigin(origins = "*")
public class DocumentoController {

    @Autowired
    private DocumentoService documentoService;


    // =========================================================
    // DOCUMENTOS DE USUÁRIO
    // =========================================================

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> criarDocumentoUsuario(
            @PathVariable Long usuarioId,
            @RequestBody DocumentoDTO dto
    ) {

        try {

            DocumentoDTO documento =
                    documentoService.criarDocumentoUsuario(
                            usuarioId,
                            dto
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(documento);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // DOCUMENTOS DE ESPAÇO
    // =========================================================

    @PostMapping("/espaco/{espacoId}")
    public ResponseEntity<?> criarDocumentoEspaco(
            @PathVariable Long espacoId,
            @RequestBody DocumentoDTO dto
    ) {

        try {

            DocumentoDTO documento =
                    documentoService.criarDocumentoEspaco(
                            espacoId,
                            dto
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(documento);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // LISTAR DOCUMENTOS DO USUÁRIO
    // =========================================================

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> listarPorUsuario(
            @PathVariable Long usuarioId
    ) {

        try {

            List<DocumentoDTO> documentos =
                    documentoService.listarPorUsuario(usuarioId);

            return ResponseEntity.ok(documentos);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // LISTAR DOCUMENTOS DO ESPAÇO
    // =========================================================

    @GetMapping("/espaco/{espacoId}")
    public ResponseEntity<?> listarPorEspaco(
            @PathVariable Long espacoId
    ) {

        try {

            List<DocumentoDTO> documentos =
                    documentoService.listarPorEspaco(espacoId);

            return ResponseEntity.ok(documentos);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // ADMIN - DOCUMENTOS PENDENTES
    // =========================================================

    @GetMapping("/pendentes")
    public ResponseEntity<?> listarPendentes() {

        try {

            return ResponseEntity.ok(
                    documentoService.listarPendentes()
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // BUSCAR DOCUMENTO
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(
            @PathVariable Long id
    ) {

        try {

            return ResponseEntity.ok(
                    documentoService.buscarPorId(id)
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // ADMIN - APROVAR
    // =========================================================

    @PutMapping("/{id}/aprovar")
    public ResponseEntity<?> aprovar(
            @PathVariable Long id
    ) {

        try {

            return ResponseEntity.ok(
                    documentoService.aprovarDocumento(id)
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // ADMIN - REJEITAR
    // =========================================================

    @PutMapping("/{id}/rejeitar")
    public ResponseEntity<?> rejeitar(
            @PathVariable Long id,
            @RequestParam String motivo
    ) {

        try {

            return ResponseEntity.ok(
                    documentoService.rejeitarDocumento(
                            id,
                            motivo
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // ADMIN - SOLICITAR CORREÇÃO
    // =========================================================

    @PutMapping("/{id}/solicitar-correcao")
    public ResponseEntity<?> solicitarCorrecao(
            @PathVariable Long id,
            @RequestParam String motivo
    ) {

        try {

            return ResponseEntity.ok(
                    documentoService.solicitarCorrecao(
                            id,
                            motivo
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }
}