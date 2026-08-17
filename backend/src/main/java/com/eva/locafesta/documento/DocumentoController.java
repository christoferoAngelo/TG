package com.eva.locafesta.documento;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/documentos")
@CrossOrigin(origins = "*")
public class DocumentoController {

    @Autowired
    private DocumentoService documentoService;


    // =========================================================
    // USUÁRIO
    // =========================================================

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<DocumentoDTO> criarDocumentoUsuario(
            @PathVariable Long usuarioId,
            @RequestBody DocumentoCreateDTO dto
    ) {

        return ResponseEntity.ok(
                documentoService.criarDocumentoUsuario(
                        usuarioId,
                        dto
                )
        );
    }


    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<DocumentoDTO>> listarPorUsuario(
            @PathVariable Long usuarioId
    ) {

        return ResponseEntity.ok(
                documentoService.listarPorUsuario(usuarioId)
        );
    }


    // =========================================================
    // ESPAÇO
    // =========================================================

    @PostMapping("/espaco/{espacoId}")
    public ResponseEntity<DocumentoDTO> criarDocumentoEspaco(
            @PathVariable Long espacoId,
            @RequestBody DocumentoCreateDTO dto
    ) {

        return ResponseEntity.ok(
                documentoService.criarDocumentoEspaco(
                        espacoId,
                        dto
                )
        );
    }


    @GetMapping("/espaco/{espacoId}")
    public ResponseEntity<List<DocumentoDTO>> listarPorEspaco(
            @PathVariable Long espacoId
    ) {

        return ResponseEntity.ok(
                documentoService.listarPorEspaco(espacoId)
        );
    }


    // =========================================================
    // ADMIN
    // =========================================================

    @GetMapping("/admin/pendentes")
    public ResponseEntity<List<DocumentoDTO>> listarPendentes() {

        return ResponseEntity.ok(
                documentoService.listarPendentes()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<DocumentoDTO> buscarPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                documentoService.buscarPorId(id)
        );
    }


    @PutMapping("/admin/{id}/aprovar")
    public ResponseEntity<DocumentoDTO> aprovar(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                documentoService.aprovarDocumento(id)
        );
    }


    @PutMapping("/admin/{id}/rejeitar")
    public ResponseEntity<DocumentoDTO> rejeitar(
            @PathVariable Long id,
            @RequestParam String motivo
    ) {

        return ResponseEntity.ok(
                documentoService.rejeitarDocumento(
                        id,
                        motivo
                )
        );
    }


    @PutMapping("/admin/{id}/correcao")
    public ResponseEntity<DocumentoDTO> solicitarCorrecao(
            @PathVariable Long id,
            @RequestParam String motivo
    ) {

        return ResponseEntity.ok(
                documentoService.solicitarCorrecao(
                        id,
                        motivo
                )
        );
    }
}